export type OfflineMutationType = 'attendance' | 'fees'

export interface OfflineMutation<T = unknown> {
  id?: number
  type: OfflineMutationType
  payload: T
  createdAt: string
  attempts?: number
}

// A single mutation that keeps failing must not wedge the whole queue. After
// this many failed flush attempts we drop it and move on.
const MAX_FLUSH_ATTEMPTS = 5

const DB_NAME = 'tuition-mandi-offline-queue'
const STORE_NAME = 'mutations'
const DB_VERSION = 1

function openQueueDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not supported in this browser'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Unable to open offline queue database'))
    }

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

export async function enqueueMutation<T>(type: OfflineMutationType, payload: T): Promise<void> {
  const db = await openQueueDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.add({
      type,
      payload,
      createdAt: new Date().toISOString(),
    })

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to queue offline mutation'))
  })
  db.close()
}

export async function getQueuedMutations(type?: OfflineMutationType): Promise<OfflineMutation[]> {
  const db = await openQueueDb()
  const items = await new Promise<OfflineMutation[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const values = (request.result ?? []) as OfflineMutation[]
      if (!type) {
        resolve(values)
        return
      }
      resolve(values.filter((item) => item.type === type))
    }

    request.onerror = () => reject(new Error('Failed to read offline queue'))
  })
  db.close()
  return items.sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
}

export async function removeQueuedMutation(id: number): Promise<void> {
  const db = await openQueueDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to remove offline mutation'))
  })
  db.close()
}

async function bumpMutationAttempts(item: OfflineMutation): Promise<number> {
  if (typeof item.id !== 'number') return 0
  const nextAttempts = (item.attempts ?? 0) + 1
  const db = await openQueueDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put({ ...item, attempts: nextAttempts })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(new Error('Failed to update offline mutation'))
  })
  db.close()
  return nextAttempts
}

export async function flushQueuedMutations(
  type: OfflineMutationType,
  processor: (item: OfflineMutation) => Promise<void>,
): Promise<number> {
  const items = await getQueuedMutations(type)
  let processedCount = 0

  for (const item of items) {
    try {
      await processor(item)
      if (typeof item.id === 'number') {
        await removeQueuedMutation(item.id)
      }
      processedCount += 1
    } catch {
      // Bump the failure counter. A poison-pill mutation that has exhausted its
      // retry budget is dropped so it can't wedge the queue forever; otherwise
      // we stop here (likely offline) and retry the rest on the next flush.
      const attempts = await bumpMutationAttempts(item)
      if (attempts >= MAX_FLUSH_ATTEMPTS && typeof item.id === 'number') {
        await removeQueuedMutation(item.id)
        continue
      }
      break
    }
  }

  return processedCount
}
