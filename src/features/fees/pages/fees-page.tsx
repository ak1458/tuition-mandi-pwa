import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { getFeeRows, saveFeeMutation, toMonthStart, type FeeMutationPayload, type FeeRow } from '@/features/fees/services/fees-service'
import { enqueueMutation, flushQueuedMutations, type OfflineMutation } from '@/lib/offline/mutation-queue'
import { buildFeeReminderLink } from '@/utils/whatsapp'
import { Icon } from '@/components/common/tuition-mandi-ui'
import { Avatar, Btn, Card, Pill, TopBar } from '@/components/common/tm-kit'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'

function isNetworkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  return message.includes('network') || message.includes('fetch')
}

function monthLabel(monthStr: string): string {
  return new Date(`${monthStr}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function pillTone(status: string): 'leaf' | 'gold' | 'coral' {
  if (status === 'paid') return 'leaf'
  if (status === 'partial') return 'gold'
  return 'coral'
}

const inr = (n: number) => '₹' + (n || 0).toLocaleString('en-IN')

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

  const pendingCount = rows.filter((r) => r.status !== 'paid').length

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
    <div className="tm-noscroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--paper)' }}>
      <TopBar
        title={copy.fees.title}
        subtitle={monthLabel(selectedMonth)}
        onBack={() => navigate(-1)}
        right={
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ maxWidth: 132, borderRadius: 12, border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', padding: '8px 10px', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-stack-latin)' }}
          />
        }
      />

      <div style={{ padding: '14px 18px 100px' }}>
        {/* leaf balance card — collected this month (real) */}
        <Card pad={0} style={{ overflow: 'hidden', background: 'var(--leaf)', border: 'none', boxShadow: '0 16px 34px rgba(19,138,94,.32)' }}>
          <div style={{ padding: 20, position: 'relative' }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: 999, background: 'rgba(255,255,255,.12)' }} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', fontWeight: 600 }}>{copy.fees.collected} · {monthLabel(selectedMonth)}</div>
            <div className="font-mono" style={{ fontSize: 36, fontWeight: 700, color: '#fff', marginTop: 4, lineHeight: 1 }}>{inr(summary.collected)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, fontSize: 13, color: 'rgba(255,255,255,.92)', fontWeight: 600 }}>
              <Icon name="clock" style={{ width: 16, height: 16 }} />{copy.fees.due}: <b className="font-mono">{inr(summary.due)}</b>
            </div>
          </div>
        </Card>

        {/* pending summary */}
        {pendingCount > 0 && (
          <Card pad={14} style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--marigold-wash)', border: 'none' }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--marigold)', color: 'var(--on-marigold)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="clock" style={{ width: 20, height: 20 }} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{inr(summary.due)} pending</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{pendingCount} {pendingCount === 1 ? 'student' : 'students'} se baaki · WhatsApp reminder bhejein</div>
            </div>
          </Card>
        )}

        {errorMessage && <Card pad={12} style={{ marginTop: 12, background: 'var(--coral-wash)', border: 'none' }}><span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--coral-deep)' }}>{errorMessage}</span></Card>}
        {message && <Card pad={12} style={{ marginTop: 12, background: 'var(--leaf-wash)', border: 'none' }}><span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--leaf-deep)' }}>{message}</span></Card>}

        {/* per-student rows */}
        <div style={{ marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 12px' }}>
            <h3 className="font-display" style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Students</h3>
          </div>
          {isLoading ? (
            <Card pad={16}><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>{copy.fees.loading}</span></Card>
          ) : rows.length === 0 ? (
            <Card pad={18} style={{ textAlign: 'center' }}><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>{copy.fees.empty}</span></Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {rows.map((row) => {
                const pending = Math.max(row.amountDue - row.amountPaid, 0)
                const waLink = row.guardianPhone && row.status !== 'paid'
                  ? buildFeeReminderLink(row.guardianPhone, row.fullName, pending, selectedMonth)
                  : null
                return (
                  <Card key={row.studentId} pad={14}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar name={row.fullName} size={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-display" style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.fullName}</div>
                        <div className="font-mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>{inr(row.amountPaid)} paid · {inr(pending)} due</div>
                      </div>
                      {waLink && (
                        <a className="tm-btn" href={waLink} rel="noreferrer" target="_blank" aria-label="WhatsApp reminder" style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--leaf-wash)', color: 'var(--leaf-deep)', flexShrink: 0 }}>
                          <Icon name="whatsapp" style={{ width: 19, height: 19 }} />
                        </a>
                      )}
                      <button onClick={() => { setEditingStudentId(editingStudentId === row.studentId ? null : row.studentId); setEditAmount(String(row.amountPaid)) }} className="tm-btn" style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>
                        <Pill tone={pillTone(row.status)}>{copy.fees[row.status as 'paid' | 'partial' | 'pending']}</Pill>
                      </button>
                    </div>
                    {editingStudentId === row.studentId && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <input
                          inputMode="numeric"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder={copy.fees.amountPaid}
                          style={{ flex: 1, minWidth: 0, borderRadius: 'var(--radius-field)', border: '1.5px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', padding: '11px 14px', fontSize: 15, fontWeight: 500, outline: 'none', fontFamily: 'var(--font-stack-latin)' }}
                        />
                        <Btn variant="leaf" disabled={isSaving} onClick={() => onSavePayment(row, Number(editAmount) || 0)}>{copy.fees.save}</Btn>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
