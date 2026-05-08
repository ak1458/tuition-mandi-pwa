import { useEffect, useRef } from 'react'
import { isLocalMode } from '@/lib/env'
import { flushQueuedMutations } from '@/lib/offline/mutation-queue'
import { saveAttendanceMutation, type AttendanceMutationPayload } from '@/features/attendance/services/attendance-service'
import { saveFeeMutation, type FeeMutationPayload } from '@/features/fees/services/fees-service'

/**
 * Hook that listens for the browser coming back online and flushes
 * any queued offline mutations (attendance, fees) to Supabase.
 *
 * Only operates when NOT in local mode (local mode persists directly
 * to localStorage and doesn't need sync).
 */
export function useOfflineSync() {
  const flushing = useRef(false)

  useEffect(() => {
    // In local mode, all data goes directly to localStorage — no sync needed
    if (isLocalMode) return

    async function flush() {
      if (flushing.current) return
      flushing.current = true

      try {
        // Flush attendance mutations
        await flushQueuedMutations('attendance', async (item) => {
          const payload = item.payload as AttendanceMutationPayload
          await saveAttendanceMutation(payload)
        })

        // Flush fee mutations
        await flushQueuedMutations('fees', async (item) => {
          const payload = item.payload as FeeMutationPayload
          await saveFeeMutation({
            teacherId: payload.teacherId,
            studentId: payload.studentId,
            feeMonth: payload.feeMonth,
            amountDue: payload.amountDue,
            amountPaid: payload.amountPaid,
          })
        })
      } catch {
        // Individual failures are handled inside flushQueuedMutations
        // (it stops at the first failure and keeps remaining items queued)
      } finally {
        flushing.current = false
      }
    }

    // Flush immediately on mount (in case we were offline and page was refreshed)
    if (navigator.onLine) {
      flush()
    }

    // Flush when the browser comes back online
    window.addEventListener('online', flush)

    return () => {
      window.removeEventListener('online', flush)
    }
  }, [])
}
