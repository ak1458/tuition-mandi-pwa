import { useCallback, useMemo, useSyncExternalStore } from 'react'
import type { ParentInquiry } from '@/types/marketplace'

const STORAGE_KEY = 'takhti_local_inquiries'
const CHANGE_EVENT = 'takhti:local-inquiries:change'

function readMessages(): ParentInquiry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ParentInquiry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function subscribeStore(callback: () => void) {
  const local = () => callback()
  const cross = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY) callback()
  }
  window.addEventListener(CHANGE_EVENT, local)
  window.addEventListener('storage', cross)
  return () => {
    window.removeEventListener(CHANGE_EVENT, local)
    window.removeEventListener('storage', cross)
  }
}

export function useLocalInquiries(): ParentInquiry[] {
  const subscribe = useCallback((callback: () => void) => subscribeStore(callback), [])
  const getSnapshot = useCallback(() => localStorage.getItem(STORAGE_KEY) ?? '', [])
  const getServerSnapshot = useCallback(() => '', [])
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readMessages(), [snapshot])
}
