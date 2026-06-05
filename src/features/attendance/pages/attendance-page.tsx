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
import { enqueueMutation, flushQueuedMutations, type OfflineMutation } from '@/lib/offline/mutation-queue'
import type { AttendanceStatus, Batch } from '@/types/domain'
import { Icon, IconButton, PageHeader, PersonAvatar, cx } from '@/components/common/tuition-mandi-ui'
import { DemoTrialBadge } from '@/components/common/demo-trial-badge'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'

interface AttendanceStudent {
  id: string
  full_name: string
  class_label: string
  created_at?: string
}

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('network') || message.includes('fetch')
}

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function AttendancePage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const copy = useTuitionMandiCopy()
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
      if (!selectedBatchId && data.length > 0) setSelectedBatchId(data[0].id)
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
    await saveAttendanceMutation(mutation.payload as AttendanceMutationPayload)
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
    const listener = () => syncQueuedAttendance().catch(() => {})
    window.addEventListener('online', listener)
    return () => window.removeEventListener('online', listener)
  }, [syncQueuedAttendance])

  const entries = useMemo<AttendanceEntry[]>(
    () => students.map((student) => ({ studentId: student.id, status: statusMap[student.id] ?? 'present' })),
    [statusMap, students],
  )

  const presentCount = entries.filter((entry) => entry.status === 'present').length

  const onToggleStatus = (studentId: string, status: AttendanceStatus) => {
    setStatusMap((prev) => ({ ...prev, [studentId]: status }))
  }

  const onSave = async () => {
    if (!teacherId || !selectedBatchId) {
      setErrorMessage(copy.attendance.selectBatchError)
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
        setMessage(copy.attendance.saved)
      } else {
        await saveAttendanceMutation(payload)
        setMessage(copy.attendance.saved)
      }
    } catch (error) {
      if (isNetworkError(error)) {
        await enqueueMutation('attendance', payload)
        setMessage(copy.attendance.saved)
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Attendance save failed')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-paper pb-28">
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        right={
          <input
            className="max-w-[128px] rounded-xl border border-line bg-surface px-2 py-2 text-xs font-bold text-ink"
            onChange={(event) => setSelectedDate(event.target.value)}
            type="date"
            value={selectedDate}
          />
        }
        subtitle={formatDate(selectedDate)}
        title={copy.attendance.title}
      />

      <section className="px-4 py-4">
        <div className="rounded-[22px] border border-line bg-surface p-4 shadow-[0_14px_30px_rgba(53,38,22,0.07)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-bold text-ink-soft">{copy.attendance.subtitle}</p>
              <p className="mt-1 text-[28px] font-black text-leaf">{presentCount}/{students.length || 0}</p>
            </div>
            <select
              className="max-w-[150px] rounded-xl border border-line bg-surface-2 px-3 py-3 text-xs font-bold text-ink"
              onChange={(event) => setSelectedBatchId(event.target.value)}
              value={selectedBatchId}
            >
              <option value="">{copy.attendance.selectBatch}</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {errorMessage && <p className="mt-3 rounded-xl bg-coral-wash px-3 py-2 text-sm font-bold text-coral">{errorMessage}</p>}
        {message && <p className="mt-3 rounded-xl bg-leaf-wash px-3 py-2 text-sm font-bold text-leaf">{message}</p>}

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="rounded-[18px] border border-line bg-surface p-4 text-sm font-bold text-ink-soft">{copy.attendance.loading}</div>
          ) : students.length === 0 ? (
            <div className="rounded-[18px] border border-line bg-surface p-6 text-center text-sm font-bold text-ink-soft">{copy.attendance.empty}</div>
          ) : (
            students.map((student, index) => {
              const status = statusMap[student.id] ?? 'present'
              return (
                <article
                  className="flex flex-wrap items-center gap-3 rounded-[18px] border border-line bg-surface p-3 shadow-sm"
                  key={student.id}
                >
                  <PersonAvatar name={student.full_name} size="sm" variant={index % 2 ? 'female' : 'student'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[13px] font-extrabold text-ink">{student.full_name}</p>
                      <DemoTrialBadge createdAt={student.created_at} label={copy.demo.label} variant="compact" />
                    </div>
                    <p className="text-[11px] font-semibold text-ink-soft">{student.class_label}</p>
                  </div>
                  <div className="flex rounded-xl bg-paper p-1">
                    {(['present', 'absent'] as const).map((option) => (
                      <button
                        className={cx(
                          'rounded-lg px-3 py-1.5 text-[11px] font-black',
                          status === option
                            ? option === 'present'
                              ? 'bg-leaf-wash text-leaf'
                              : 'bg-coral-wash text-coral'
                            : 'text-ink-soft',
                        )}
                        key={option}
                        onClick={() => onToggleStatus(student.id, option)}
                        type="button"
                      >
                        {option === 'present' ? copy.common.present : copy.common.absent}
                      </button>
                    ))}
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-[#f4f1ea] to-transparent px-4 py-3">
        <button
          className="w-full rounded-xl bg-[#138a5e] py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,123,81,0.18)] disabled:opacity-50"
          disabled={isSaving || students.length === 0}
          onClick={onSave}
          type="button"
        >
          {isSaving ? copy.attendance.saving : copy.attendance.save}
        </button>
      </div>
    </div>
  )
}
