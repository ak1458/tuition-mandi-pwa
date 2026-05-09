import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import {
  getAttendanceBatches,
  getAttendanceStatusMap,
  getStudentsByBatch,
  saveAttendanceMutation,
  type AttendanceEntry,
  type AttendanceMutationPayload,
} from '@/features/attendance/services/attendance-service'
import {
  enqueueMutation,
  flushQueuedMutations,
  type OfflineMutation,
} from '@/lib/offline/mutation-queue'
import type { AttendanceStatus, Batch } from '@/types/domain'
import { getAvatarColor } from '@/styles/design-tokens'

interface AttendanceStudent {
  id: string
  full_name: string
  class_label: string
}

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('network') || message.includes('fetch')
}

/** Build week days around a date */
function getWeekDays(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))

  const days: Array<{ label: string; date: string; dayNum: number }> = []
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  for (let i = 0; i < 7; i++) {
    const curr = new Date(monday)
    curr.setDate(monday.getDate() + i)
    days.push({
      label: labels[i],
      date: curr.toISOString().slice(0, 10),
      dayNum: curr.getDate(),
    })
  }
  return days
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function AttendancePage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const teacherId = session?.user.id ?? ''

  const [batches, setBatches] = useState<Batch[]>([])
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [students, setStudents] = useState<AttendanceStudent[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>(
    {}
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])

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
      setErrorMessage(
        error instanceof Error ? error.message : 'Batch load failed'
      )
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
      setErrorMessage(
        error instanceof Error ? error.message : 'Attendance load failed'
      )
    } finally {
      setIsLoading(false)
    }
  }, [selectedBatchId, selectedDate, teacherId])

  const processAttendanceMutation = useCallback(
    async (mutation: OfflineMutation) => {
      const payload = mutation.payload as AttendanceMutationPayload
      await saveAttendanceMutation(payload)
    },
    []
  )

  const syncQueuedAttendance = useCallback(async () => {
    if (!navigator.onLine) return
    const count = await flushQueuedMutations(
      'attendance',
      processAttendanceMutation
    )
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
    [statusMap, students]
  )

  const onToggleStatus = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }))
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
        setMessage('Offline: attendance queue me save ho gaya.')
      } else {
        await saveAttendanceMutation(payload)
        setMessage('Attendance save ho gaya ✓')
      }
    } catch (error) {
      if (isNetworkError(error)) {
        await enqueueMutation('attendance', payload)
        setMessage('Network issue. Queue me dala gaya.')
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : 'Attendance save failed'
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-[#F5F5F5] px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="p-1">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1A1A1A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Attendance</h1>
          </div>
          {/* Batch selector */}
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="rounded-lg border border-[#E0E0E0] bg-white px-2 py-1 text-xs text-[#1A1A1A] max-w-[120px]"
          >
            <option value="">Batch chunein</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date display */}
        <p className="mt-2 text-center text-sm font-medium text-[#1A1A1A]">
          {formatDate(selectedDate)}
        </p>

        {/* ── Week Strip ── */}
        <div className="mt-3 flex items-center justify-between">
          {weekDays.map((day) => {
            const isActive = day.date === selectedDate
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDate(day.date)}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[10px] text-[#757575]">{day.label}</span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-[#1B8A3E] text-white'
                      : 'text-[#1A1A1A]'
                  }`}
                >
                  {day.dayNum}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Messages ── */}
      {errorMessage && (
        <div className="mx-4 mb-2 rounded-xl bg-[#FFEBEE] px-4 py-2 text-sm text-[#E53935]">
          {errorMessage}
        </div>
      )}
      {message && (
        <div className="mx-4 mb-2 rounded-xl bg-[#E8F5E9] px-4 py-2 text-sm text-[#1B8A3E]">
          {message}
        </div>
      )}

      {/* ── Student Rows ── */}
      <div className="flex-1 px-4 space-y-2 pb-32">
        {isLoading ? (
          <div className="rounded-xl bg-white p-4 text-sm text-[#757575]">
            Loading...
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-[#757575]">
            Is batch me koi student nahi hai.
          </div>
        ) : (
          students.map((student, index) => {
            const status = statusMap[student.id] ?? 'present'
            const initial = student.full_name.charAt(0).toUpperCase()

            return (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold"
                  style={{ backgroundColor: getAvatarColor(index) }}
                >
                  {initial}
                </div>
                <p className="flex-1 text-sm font-semibold text-[#1A1A1A] truncate">
                  {student.full_name}
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(student.id, 'present')}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      status === 'present'
                        ? 'bg-[#E8F5E9] text-[#1B8A3E]'
                        : 'border border-[#E0E0E0] text-[#9E9E9E]'
                    }`}
                  >
                    Present
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(student.id, 'absent')}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      status === 'absent'
                        ? 'bg-[#FFEBEE] text-[#E53935]'
                        : 'border border-[#E0E0E0] text-[#9E9E9E]'
                    }`}
                  >
                    Absent
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Save Button ── */}
      <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-gradient-to-t from-[#F5F5F5] to-transparent z-30">
        <button
          type="button"
          disabled={isSaving || students.length === 0}
          onClick={onSave}
          className="bg-[#1B8A3E] text-white rounded-xl py-3 w-full font-semibold text-sm disabled:opacity-50 active:bg-[#15732F]"
        >
          {isSaving ? 'Saving...' : 'Attendance Save Karein'}
        </button>
      </div>
    </div>
  )
}
