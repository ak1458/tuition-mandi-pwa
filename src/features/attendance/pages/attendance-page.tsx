import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import {
  getAttendanceBatches,
  getAttendanceStatusMap,
  getStudentsByBatch,
  saveAttendanceMutation,
  type AttendanceEntry,
  type AttendanceMutationPayload,
} from '@/features/attendance/services/attendance-service'
import { isLocalMode } from '@/lib/env'
import {
  enqueueMutation,
  flushQueuedMutations,
  type OfflineMutation,
} from '@/lib/offline/mutation-queue'
import type { AttendanceStatus, Batch } from '@/types/domain'

interface AttendanceStudent {
  id: string
  full_name: string
  class_label: string
}

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('network') || message.includes('fetch')
}

export function AttendancePage() {
  const { session } = useAuth()
  const teacherId = session?.user.id ?? ''

  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [students, setStudents] = useState<AttendanceStudent[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadBatches = useCallback(async () => {
    if (!teacherId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    try {
      const data = await getAttendanceBatches(teacherId)
      setBatches(data)
      if (!selectedBatchId && data.length > 0) {
        setSelectedBatchId(data[0].id)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Batch load failed')
    } finally {
      setIsLoading(false)
    }
  }, [selectedBatchId, teacherId])

  const loadAttendance = useCallback(async () => {
    if (!teacherId || !selectedBatchId) {
      setStudents([])
      setStatusMap({})
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    try {
      const [studentRows, attendanceMap] = await Promise.all([
        getStudentsByBatch(teacherId, selectedBatchId),
        getAttendanceStatusMap(teacherId, selectedBatchId, selectedDate),
      ])

      setStudents(studentRows)
      const defaultMap: Record<string, AttendanceStatus> = {}
      for (const student of studentRows) {
        defaultMap[student.id] = attendanceMap[student.id] ?? 'present'
      }
      setStatusMap(defaultMap)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Attendance load failed')
    } finally {
      setIsLoading(false)
    }
  }, [selectedBatchId, selectedDate, teacherId])

  const processAttendanceMutation = useCallback(async (mutation: OfflineMutation) => {
    const payload = mutation.payload as AttendanceMutationPayload
    await saveAttendanceMutation(payload)
  }, [])

  const syncQueuedAttendance = useCallback(async () => {
    if (!navigator.onLine) return
    const count = await flushQueuedMutations('attendance', processAttendanceMutation)
    if (count > 0) {
      setMessage(`${count} queued attendance sync ho gaya.`)
      await loadAttendance()
    }
  }, [loadAttendance, processAttendanceMutation])

  useEffect(() => {
    loadBatches().catch(() => {})
  }, [loadBatches])

  useEffect(() => {
    loadAttendance().catch(() => {})
  }, [loadAttendance])

  useEffect(() => {
    const listener = () => {
      syncQueuedAttendance().catch(() => {})
    }
    window.addEventListener('online', listener)
    return () => {
      window.removeEventListener('online', listener)
    }
  }, [syncQueuedAttendance])

  const entries = useMemo<AttendanceEntry[]>(
    () =>
      students.map((student) => ({
        studentId: student.id,
        status: statusMap[student.id] ?? 'present',
      })),
    [statusMap, students],
  )

  const onToggleStatus = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({
      ...prev,
      [studentId]: status,
    }))
  }

  const onSave = async () => {
    if (!teacherId || !selectedBatchId) {
      setErrorMessage('Batch select karein.')
      return
    }

    setIsSaving(true)
    setErrorMessage('')
    setMessage('')

    const payload: AttendanceMutationPayload = {
      teacherId,
      batchId: selectedBatchId,
      sessionDate: selectedDate,
      entries,
    }

    try {
      if (!navigator.onLine) {
        await enqueueMutation('attendance', payload)
        setMessage('Offline mode: attendance queue me save ho gaya.')
      } else {
        await saveAttendanceMutation(payload)
        setMessage('Attendance successfully save ho gaya.')
      }
    } catch (error) {
      if (isNetworkError(error)) {
        await enqueueMutation('attendance', payload)
        setMessage('Network issue. Attendance queue me dala gaya.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Attendance save failed')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {isLocalMode && (
        <p className="rounded-xl bg-saffron/15 px-3 py-2 text-sm text-ink">
          Local demo mode active. Attendance local storage me save ho rahi hai.
        </p>
      )}
      {errorMessage && <p className="rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">{errorMessage}</p>}
      {message && <p className="rounded-xl bg-sage/10 px-3 py-2 text-sm text-sage">{message}</p>}

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-saffron">Select Batch and Date</p>
        <div className="mt-3 grid gap-2">
          <select
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setSelectedBatchId(event.target.value)}
            value={selectedBatchId}
          >
            <option value="">Choose batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name} - {batch.class_label}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setSelectedDate(event.target.value)}
            type="date"
            value={selectedDate}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-saffron">Attendance List</p>
        {isLoading ? (
          <p className="mt-2 text-sm text-muted">Attendance data load ho raha hai...</p>
        ) : students.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No students found for selected batch/date.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {students.map((student) => {
              const status = statusMap[student.id] ?? 'present'
              return (
                <li className="rounded-xl bg-cream px-3 py-3" key={student.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">{student.full_name}</p>
                      <p className="text-xs text-muted">{student.class_label}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className={`rounded-xl px-3 py-1 text-xs font-semibold ${
                          status === 'present' ? 'bg-sage text-white' : 'bg-white text-muted'
                        }`}
                        onClick={() => onToggleStatus(student.id, 'present')}
                        type="button"
                      >
                        Present
                      </button>
                      <button
                        className={`rounded-xl px-3 py-1 text-xs font-semibold ${
                          status === 'absent' ? 'bg-rose text-white' : 'bg-white text-muted'
                        }`}
                        onClick={() => onToggleStatus(student.id, 'absent')}
                        type="button"
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <button
        className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        disabled={isSaving || students.length === 0}
        onClick={onSave}
        type="button"
      >
        {isSaving ? 'Saving...' : 'Save Attendance'}
      </button>
    </div>
  )
}
