import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { supabase } from '@/lib/supabase-client'
import type { ParentInquiry } from '@/types/marketplace'
import { Icon } from '@/components/common/tuition-mandi-ui'
import { Avatar, Btn, Card, EmptyState, IconBtn, Pill, Segmented, TopBar } from '@/components/common/tm-kit'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'

type StatusKey = 'new' | 'contacted' | 'enrolled' | 'not_interested'
const statusOptions: StatusKey[] = ['new', 'contacted', 'enrolled', 'not_interested']

function pillTone(status: string): 'gold' | 'sky' | 'leaf' | 'soft' {
  if (status === 'enrolled') return 'leaf'
  if (status === 'contacted') return 'sky'
  if (status === 'not_interested') return 'soft'
  return 'gold'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(mins, 1)} min pehle`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ghante pehle`
  return `${Math.floor(hours / 24)} din pehle`
}

export function InquiriesPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const copy = useTuitionMandiCopy()
  const [inquiries, setInquiries] = useState<ParentInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | StatusKey>('all')

  const loadInquiries = useCallback(async () => {
    if (!session?.user?.id) return
    setLoading(true)
    setError('')
    try {
      const { data: profiles, error: profileErr } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('teacher_id', session.user.id)
      if (profileErr) throw profileErr
      const profileIds = (profiles ?? []).map((row) => row.id as string)
      if (profileIds.length === 0) {
        setInquiries([])
        return
      }
      const { data, error: err } = await supabase
        .from('parent_inquiries')
        .select('*')
        .in('teacher_profile_id', profileIds)
        .order('created_at', { ascending: false })
      if (err) throw err
      setInquiries((data || []) as ParentInquiry[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inquiries load nahi ho payein.')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    loadInquiries().catch(() => {})
  }, [loadInquiries])

  async function updateStatus(inquiryId: string, newStatus: StatusKey) {
    const { error: err } = await supabase.from('parent_inquiries').update({ status: newStatus }).eq('id', inquiryId)
    if (err) {
      setError(err.message)
      return
    }
    setInquiries((current) =>
      current.map((q) => (q.id === inquiryId ? { ...q, status: newStatus as ParentInquiry['status'] } : q)),
    )
  }

  function replyLink(inquiry: ParentInquiry) {
    if (!inquiry.parent_phone) return null
    const cleanPhone = inquiry.parent_phone.replace(/\D/g, '')
    const text = `Namaste ${inquiry.parent_name || ''} Ji,\n\nAapki TuitionMandi inquiry mili. ${inquiry.subject_needed || 'Tuition'} ke liye baat kar sakte hain.`
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: inquiries.length, new: 0, contacted: 0, enrolled: 0, not_interested: 0 }
    for (const q of inquiries) c[q.status] = (c[q.status] || 0) + 1
    return c
  }, [inquiries])

  const filtered = filter === 'all' ? inquiries : inquiries.filter((q) => q.status === filter)

  const segs = [
    { value: 'all' as const, label: `Sab ${counts.all}` },
    { value: 'new' as const, label: `${copy.inquiries.statuses.new} ${counts.new}` },
    { value: 'contacted' as const, label: `${copy.inquiries.statuses.contacted} ${counts.contacted}` },
    { value: 'enrolled' as const, label: `${copy.inquiries.statuses.enrolled} ${counts.enrolled}` },
  ]

  return (
    <div className="tm-noscroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--paper)' }}>
      <TopBar
        title={copy.inquiries.title}
        subtitle={`${counts.new} ${copy.inquiries.subtitle}`}
        onBack={() => navigate(-1)}
        right={<IconBtn name="filter" label="Filter" />}
      />
      <div style={{ padding: '12px 18px 100px' }}>
        <Segmented options={segs} value={filter} onChange={setFilter} style={{ marginBottom: 16 }} />

        {/* helpful tip — no fabricated metrics */}
        <Card pad={13} style={{ marginBottom: 14, background: 'var(--marigold-wash)', border: 'none', display: 'flex', gap: 11 }}>
          <Icon name="sparkle" style={{ width: 20, height: 20, color: 'var(--marigold-deep)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
            <b style={{ color: 'var(--ink)' }}>Tip:</b> Jaldi reply karne wale tutors ko zyada response milta hai. Naye leads ko turant WhatsApp karein.
          </div>
        </Card>

        {error && (
          <Card pad={12} style={{ marginBottom: 12, background: 'var(--coral-wash)', border: 'none' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--coral-deep)' }}>{error}</span>
          </Card>
        )}

        {loading ? (
          <Card pad={16}><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>{copy.inquiries.loading}</span></Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="message"
            title={copy.inquiries.emptyTitle}
            body={copy.inquiries.emptySubtitle}
            action={<Btn variant="ink" icon="share" onClick={() => navigate('/profile/setup')}>Profile share karein</Btn>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {filtered.map((q) => {
              const waLink = replyLink(q)
              return (
                <Card key={q.id} pad={14}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Avatar name={q.parent_name || 'Parent'} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span className="font-display" style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{q.subject_needed || 'Tuition'}</span>
                        <Pill tone={pillTone(q.status)} style={{ fontSize: 10 }}>{copy.inquiries.statuses[q.status] || q.status}</Pill>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>
                        {q.parent_name || copy.inquiries.unknownParent} · {q.student_class || copy.inquiries.classLabel}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 9, fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="clock" style={{ width: 13, height: 13, color: 'var(--ink-soft)' }} />{timeAgo(q.created_at)}
                        </span>
                      </div>
                      {q.message && (
                        <p style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'var(--surface-2)', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>"{q.message}"</p>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 13, alignItems: 'center' }}>
                    {waLink ? (
                      <a className="tm-btn" href={waLink} rel="noreferrer" target="_blank" style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 'var(--radius-btn)', padding: '11px 16px', fontWeight: 700, fontSize: 13.5, textDecoration: 'none' }}>
                        <Icon name="whatsapp" style={{ width: 17, height: 17 }} />{copy.common.reply}
                      </a>
                    ) : (
                      <span style={{ flex: 1, textAlign: 'center', borderRadius: 'var(--radius-btn)', padding: '11px 16px', background: 'var(--surface-2)', color: 'var(--ink-soft)', fontWeight: 700, fontSize: 13 }}>No phone</span>
                    )}
                    <select
                      value={q.status}
                      onChange={(e) => updateStatus(q.id, e.target.value as StatusKey)}
                      style={{ flex: 1, borderRadius: 'var(--radius-btn)', border: '1px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)', padding: '11px 12px', fontWeight: 700, fontSize: 13, fontFamily: 'var(--font-stack-latin)' }}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{copy.inquiries.statuses[s]}</option>
                      ))}
                    </select>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
