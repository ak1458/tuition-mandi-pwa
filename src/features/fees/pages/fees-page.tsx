import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { isLocalMode } from '@/lib/env'
import {
  buildFeeSummary,
  getFeeRows,
  resolveFeeStatus,
  saveFeeMutation,
  toMonthStart,
  type FeeMutationPayload,
  type FeeRow,
} from '@/features/fees/services/fees-service'
import {
  enqueueMutation,
  flushQueuedMutations,
  type OfflineMutation,
} from '@/lib/offline/mutation-queue'

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('network') || message.includes('fetch')
}

export function FeesPage() {
  const { session } = useAuth()
  const teacherId = session?.user.id ?? ''
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [rows, setRows] = useState<FeeRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const summary = useMemo(() => buildFeeSummary(rows), [rows])

  const loadRows = useCallback(async () => {
    if (!teacherId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    try {
      const data = await getFeeRows(teacherId, selectedMonth)
      setRows(data)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Fee load failed')
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, teacherId])

  const processFeeMutation = useCallback(async (mutation: OfflineMutation) => {
    const payload = mutation.payload as FeeMutationPayload
    await saveFeeMutation(payload)
  }, [])

  const syncQueuedFees = useCallback(async () => {
    if (!navigator.onLine) return
    const count = await flushQueuedMutations('fees', processFeeMutation)
    if (count > 0) {
      setMessage(`${count} queued fee updates sync ho gaye.`)
      await loadRows()
    }
  }, [loadRows, processFeeMutation])

  useEffect(() => {
    loadRows().catch(() => {})
  }, [loadRows])

  useEffect(() => {
    const listener = () => {
      syncQueuedFees().catch(() => {})
    }
    window.addEventListener('online', listener)
    return () => {
      window.removeEventListener('online', listener)
    }
  }, [syncQueuedFees])

  const onAmountChange = (studentId: string, amountPaid: number) => {
    setRows((prev) =>
      prev.map((row) =>
        row.studentId === studentId
          ? {
              ...row,
              amountPaid,
              status: resolveFeeStatus(row.amountDue, amountPaid),
            }
          : row,
      ),
    )
  }

  const applyPreset = (studentId: string, preset: 'pending' | 'partial' | 'paid') => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row
        const amountPaid = preset === 'paid' ? row.amountDue : preset === 'partial' ? row.amountDue / 2 : 0
        return {
          ...row,
          amountPaid,
          status: resolveFeeStatus(row.amountDue, amountPaid),
        }
      }),
    )
  }

  const onSaveRow = async (row: FeeRow) => {
    if (!teacherId) return
    setIsSaving(true)
    setErrorMessage('')
    setMessage('')

    const payload: FeeMutationPayload = {
      teacherId,
      studentId: row.studentId,
      feeMonth: toMonthStart(selectedMonth),
      amountDue: row.amountDue,
      amountPaid: row.amountPaid,
    }

    try {
      if (!navigator.onLine) {
        await enqueueMutation('fees', payload)
        setMessage('Offline mode: fee update queue me save ho gaya.')
      } else {
        await saveFeeMutation(payload)
        setMessage(`Fee update saved for ${row.fullName}.`)
      }
      await loadRows()
    } catch (error) {
      if (isNetworkError(error)) {
        await enqueueMutation('fees', payload)
        setMessage('Network issue. Fee update queue me dala gaya.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Fee save failed')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {isLocalMode && (
        <p className="rounded-xl bg-saffron/15 px-3 py-2 text-sm text-ink">
          Local demo mode active. Fee records local storage me update ho rahe hain.
        </p>
      )}
      {errorMessage && <p className="rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">{errorMessage}</p>}
      {message && <p className="rounded-xl bg-sage/10 px-3 py-2 text-sm text-sage">{message}</p>}

      <section className="rounded-2xl bg-ink px-4 py-5 text-white">
        <p className="text-xs uppercase tracking-[0.16em] text-white/70">Month</p>
        <input
          className="mt-2 rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm"
          onChange={(event) => setSelectedMonth(event.target.value)}
          type="month"
          value={selectedMonth}
        />
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-xs text-white/70">Collected</p>
            <p className="font-display text-xl">Rs {summary.totalCollected}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-xs text-white/70">Due</p>
            <p className="font-display text-xl">Rs {summary.totalDue}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-xs text-white/70">Paid</p>
            <p className="font-display text-xl">{summary.paidCount}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-xs text-white/70">Pending + Partial</p>
            <p className="font-display text-xl">{summary.pendingCount + summary.partialCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-saffron">Student Fee Status</p>
        {isLoading ? (
          <p className="mt-2 text-sm text-muted">Fee data load ho raha hai...</p>
        ) : rows.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No students/fee data for this month.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {rows.map((row) => (
              <li className="rounded-xl bg-cream px-3 py-3" key={row.studentId}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-ink">{row.fullName}</p>
                    <p className="text-xs text-muted">
                      {row.classLabel} • Due: Rs {row.amountDue}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      row.status === 'paid'
                        ? 'bg-sage/20 text-sage'
                        : row.status === 'partial'
                          ? 'bg-saffron/20 text-saffron'
                          : 'bg-rose/20 text-rose'
                    }`}
                  >
                    {row.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-2">
                  <input
                    className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
                    min={0}
                    onChange={(event) => onAmountChange(row.studentId, Number(event.target.value || '0'))}
                    type="number"
                    value={row.amountPaid}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      className="rounded-xl border border-[#dfd4bc] px-2 py-1 text-xs font-semibold text-muted"
                      onClick={() => applyPreset(row.studentId, 'pending')}
                      type="button"
                    >
                      Pending
                    </button>
                    <button
                      className="rounded-xl border border-[#dfd4bc] px-2 py-1 text-xs font-semibold text-muted"
                      onClick={() => applyPreset(row.studentId, 'partial')}
                      type="button"
                    >
                      Partial
                    </button>
                    <button
                      className="rounded-xl border border-[#dfd4bc] px-2 py-1 text-xs font-semibold text-muted"
                      onClick={() => applyPreset(row.studentId, 'paid')}
                      type="button"
                    >
                      Paid
                    </button>
                  </div>
                  <button
                    className="rounded-xl bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    disabled={isSaving}
                    onClick={() => onSaveRow(row)}
                    type="button"
                  >
                    Save
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
