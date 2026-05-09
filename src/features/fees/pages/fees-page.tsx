import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import {
  getFeeRows,
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
import { buildFeeReminderLink } from '@/utils/whatsapp'
import { pill } from '@/styles/design-tokens'

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('network') || message.includes('fetch')
}

function monthLabel(monthStr: string): string {
  const d = new Date(monthStr + '-01T00:00:00')
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function FeesPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const teacherId = session?.user.id ?? ''
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )
  const [rows, setRows] = useState<FeeRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')

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
      setErrorMessage(
        error instanceof Error ? error.message : 'Fee load failed'
      )
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, teacherId])

  const processFeeMutation = useCallback(
    async (mutation: OfflineMutation) => {
      const payload = mutation.payload as FeeMutationPayload
      await saveFeeMutation(payload)
    },
    []
  )

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

  const onSavePayment = async (row: FeeRow, amount: number) => {
    if (!teacherId) return
    setIsSaving(true)
    setErrorMessage('')
    setMessage('')

    const payload: FeeMutationPayload = {
      teacherId,
      studentId: row.studentId,
      feeMonth: toMonthStart(selectedMonth),
      amountDue: row.amountDue,
      amountPaid: amount,
    }

    try {
      if (!navigator.onLine) {
        await enqueueMutation('fees', payload)
        setMessage('Offline: fee queue me save ho gaya.')
      } else {
        await saveFeeMutation(payload)
        setMessage(`${row.fullName} ki fee update ho gayi ✓`)
      }
      setEditingStudentId(null)
      await loadRows()
    } catch (error) {
      if (isNetworkError(error)) {
        await enqueueMutation('fees', payload)
        setMessage('Network issue. Queue me dala gaya.')
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : 'Fee save failed'
        )
      }
    } finally {
      setIsSaving(false)
    }
  }

  const statusPillClass = (status: string) => {
    if (status === 'paid') return pill.paid
    if (status === 'partial') return pill.partial
    return pill.pending
  }

  const statusLabel = (status: string) => {
    if (status === 'paid') return 'Paid'
    if (status === 'partial') return 'Partial'
    return 'Pending'
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-[#F5F5F5] px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate(-1)} className="p-1">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-[#1A1A1A]">Fees</h1>
          </div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-[#E0E0E0] bg-white px-2 py-1 text-xs"
          />
        </div>
        <p className="mt-1 text-center text-sm font-medium text-[#757575]">
          {monthLabel(selectedMonth)}
        </p>
      </div>

      {/* Messages */}
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

      {/* ── Fee Rows ── */}
      <div className="flex-1 px-4 space-y-2 pb-32">
        {isLoading ? (
          <div className="rounded-xl bg-white p-4 text-sm text-[#757575]">
            Loading fees...
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-[#757575]">
            Is month ki koi fee record nahi hai.
          </div>
        ) : (
          rows.map((row) => (
            <div key={row.studentId} className="rounded-xl bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                    {row.fullName}
                  </p>
                  <p className="text-xs text-[#757575]">₹{row.amountDue}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {row.guardianPhone &&
                    (row.status === 'pending' || row.status === 'partial') && (() => {
                      const waLink = buildFeeReminderLink(
                        row.guardianPhone,
                        row.fullName,
                        row.amountDue - row.amountPaid,
                        selectedMonth
                      )
                      if (!waLink) return null
                      return (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366]/10"
                        >
                          <svg className="h-4 w-4 fill-[#25D366]" viewBox="0 0 24 24">
                            <path d="M12.031 0C5.405 0 0 5.405 0 12.031c0 2.115.549 4.182 1.593 6L.045 24l6.115-1.517c1.765.952 3.754 1.455 5.871 1.455 6.626 0 12.031-5.405 12.031-12.031S18.657 0 12.031 0z" />
                          </svg>
                        </a>
                      )
                    })()}
                  <button
                    type="button"
                    onClick={() => {
                      if (editingStudentId === row.studentId) {
                        setEditingStudentId(null)
                      } else {
                        setEditingStudentId(row.studentId)
                        setEditAmount(String(row.amountPaid))
                      }
                    }}
                  >
                    <span className={statusPillClass(row.status)}>
                      {statusLabel(row.status)}
                    </span>
                  </button>
                </div>
              </div>

              {/* Inline payment edit */}
              {editingStudentId === row.studentId && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="flex-1 rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm outline-none focus:border-[#1B8A3E]"
                    placeholder="Amount paid"
                    min={0}
                  />
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      onSavePayment(row, Number(editAmount) || 0)
                    }
                    className="bg-[#1B8A3E] text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Fixed bottom button ── */}
      <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-gradient-to-t from-[#F5F5F5] to-transparent z-30">
        <button
          type="button"
          onClick={() => setEditingStudentId(rows[0]?.studentId ?? null)}
          className="bg-[#1B8A3E] text-white rounded-xl py-3 w-full font-semibold text-sm active:bg-[#15732F]"
        >
          + Payment Jodein
        </button>
      </div>
    </div>
  )
}
