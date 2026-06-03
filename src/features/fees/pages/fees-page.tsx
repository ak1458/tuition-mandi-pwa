import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { getFeeRows, saveFeeMutation, toMonthStart, type FeeMutationPayload, type FeeRow } from '@/features/fees/services/fees-service'
import { enqueueMutation, flushQueuedMutations, type OfflineMutation } from '@/lib/offline/mutation-queue'
import { buildFeeReminderLink } from '@/utils/whatsapp'
import { Icon, IconButton, PageHeader, PersonAvatar, cx } from '@/components/common/tuition-mandi-ui'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('network') || message.includes('fetch')
}

function monthLabel(monthStr: string): string {
  return new Date(`${monthStr}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function statusClass(status: string) {
  if (status === 'paid') return 'bg-[#eaf7ef] text-[#0d7b51]'
  if (status === 'partial') return 'bg-[#fff4df] text-[#c87b22]'
  return 'bg-[#fff0ee] text-[#d84b3f]'
}

export function FeesPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const copy = useTuitionMandiCopy()
  const teacherId = session?.user.id ?? ''
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
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
      setErrorMessage(error instanceof Error ? error.message : 'Fee load failed')
    } finally {
      setIsLoading(false)
    }
  }, [selectedMonth, teacherId])

  const processFeeMutation = useCallback(async (mutation: OfflineMutation) => {
    await saveFeeMutation(mutation.payload as FeeMutationPayload)
  }, [])

  const syncQueuedFees = useCallback(async () => {
    if (!navigator.onLine) return
    const count = await flushQueuedMutations('fees', processFeeMutation)
    if (count > 0) {
      setMessage(`${count} fee updates sync ho gaye.`)
      await loadRows()
    }
  }, [loadRows, processFeeMutation])

  useEffect(() => {
    loadRows().catch(() => {})
  }, [loadRows])

  useEffect(() => {
    const listener = () => syncQueuedFees().catch(() => {})
    window.addEventListener('online', listener)
    return () => window.removeEventListener('online', listener)
  }, [syncQueuedFees])

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.due += Math.max(row.amountDue - row.amountPaid, 0)
        acc.collected += row.amountPaid
        return acc
      },
      { due: 0, collected: 0 },
    )
  }, [rows])

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
        setMessage(`${row.fullName} ki fee update ho gayi.`)
      }
      setEditingStudentId(null)
      await loadRows()
    } catch (error) {
      if (isNetworkError(error)) {
        await enqueueMutation('fees', payload)
        setMessage('Network issue. Queue me dala gaya.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : 'Fee save failed')
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-full bg-[#fbf8f1] pb-28">
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        right={
          <input
            className="max-w-[128px] rounded-xl border border-[#eadfcd] bg-white px-2 py-2 text-xs font-bold"
            onChange={(event) => setSelectedMonth(event.target.value)}
            type="month"
            value={selectedMonth}
          />
        }
        subtitle={monthLabel(selectedMonth)}
        title={copy.fees.title}
      />

      <section className="px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-[#ddecdf] bg-[#f4fbf6] p-4">
            <p className="text-[12px] font-bold text-[#746a60]">{copy.fees.collected}</p>
            <p className="mt-2 text-2xl font-black text-[#0d7b51]">₹{summary.collected.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-[18px] border border-[#f1d8d3] bg-[#fff7f4] p-4">
            <p className="text-[12px] font-bold text-[#746a60]">{copy.fees.due}</p>
            <p className="mt-2 text-2xl font-black text-[#d84b3f]">₹{summary.due.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {errorMessage && <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#d84b3f]">{errorMessage}</p>}
        {message && <p className="mt-3 rounded-xl bg-[#eaf7ef] px-3 py-2 text-sm font-bold text-[#0d7b51]">{message}</p>}

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="rounded-[18px] border border-[#eee4d8] bg-white p-4 text-sm font-bold text-[#746a60]">{copy.fees.loading}</div>
          ) : rows.length === 0 ? (
            <div className="rounded-[18px] border border-[#eee4d8] bg-white p-6 text-center text-sm font-bold text-[#746a60]">{copy.fees.empty}</div>
          ) : (
            rows.map((row, index) => {
              const waLink =
                row.guardianPhone && row.status !== 'paid'
                  ? buildFeeReminderLink(row.guardianPhone, row.fullName, row.amountDue - row.amountPaid, selectedMonth)
                  : null
              return (
                <article className="rounded-[18px] border border-[#eee4d8] bg-white p-3 shadow-sm" key={row.studentId}>
                  <div className="flex items-center gap-3">
                    <PersonAvatar name={row.fullName} size="sm" variant={index % 2 ? 'female' : 'student'} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-black text-[#1d1813]">{row.fullName}</p>
                      <p className="text-[11px] font-semibold text-[#746a60]">
                        ₹{row.amountPaid} paid / ₹{Math.max(row.amountDue - row.amountPaid, 0)} pending
                      </p>
                    </div>
                    {waLink && (
                      <a className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf7ef] text-[#0d7b51]" href={waLink} rel="noreferrer" target="_blank">
                        <Icon className="h-5 w-5" name="whatsapp" />
                      </a>
                    )}
                    <button
                      className={cx('rounded-full px-3 py-1 text-[11px] font-black capitalize', statusClass(row.status))}
                      onClick={() => {
                        setEditingStudentId(editingStudentId === row.studentId ? null : row.studentId)
                        setEditAmount(String(row.amountPaid))
                      }}
                      type="button"
                    >
                      {copy.fees[row.status]}
                    </button>
                  </div>
                  {editingStudentId === row.studentId && (
                    <div className="mt-3 flex gap-2">
                      <input
                        className="min-w-0 flex-1 rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                        inputMode="numeric"
                        onChange={(event) => setEditAmount(event.target.value)}
                        placeholder={copy.fees.amountPaid}
                        value={editAmount}
                      />
                      <button className="rounded-xl bg-[#0d7b51] px-4 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={isSaving} onClick={() => onSavePayment(row, Number(editAmount) || 0)} type="button">
                        {copy.fees.save}
                      </button>
                    </div>
                  )}
                </article>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
