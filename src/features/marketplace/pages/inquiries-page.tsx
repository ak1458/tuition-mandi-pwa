import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { supabase } from '@/lib/supabase-client'
import type { ParentInquiry } from '@/types/marketplace'
import { Icon, IconButton, PageHeader, PersonAvatar, cx } from '@/components/common/tuition-mandi-ui'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'
import { ProfessorIllustration } from '@/components/common/illustrations'

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  enrolled: 'Enrolled',
  not_interested: 'Not Interested',
}

const statusOptions = ['new', 'contacted', 'enrolled', 'not_interested'] as const

function statusClass(status: string) {
  if (status === 'enrolled') return 'bg-[#eaf7ef] text-[#0d7b51]'
  if (status === 'contacted') return 'bg-[#fff4df] text-[#c87b22]'
  if (status === 'not_interested') return 'bg-[#f4eee5] text-[#746a60]'
  return 'bg-[#f1edff] text-[#4930a8]'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${Math.max(mins, 1)} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.floor(hours / 24)} days ago`
}

export function InquiriesPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const copy = useTuitionMandiCopy()
  const [inquiries, setInquiries] = useState<ParentInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadInquiries = useCallback(async () => {
    if (!session?.user?.id) return
    setLoading(true)
    setError('')

    try {
      // First fetch the teacher's own teacher_profiles row(s), then fetch
      // inquiries scoped to those profile IDs. RLS already enforces this on
      // the server, but the explicit filter is defense-in-depth and also
      // avoids a "select * across all rows" round-trip if RLS were ever
      // mis-configured.
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

  async function updateStatus(inquiryId: string, newStatus: string) {
    const { error: err } = await supabase.from('parent_inquiries').update({ status: newStatus }).eq('id', inquiryId)
    if (err) {
      setError(err.message)
      return
    }
    setInquiries((current) =>
      current.map((inquiry) =>
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus as ParentInquiry['status'] } : inquiry,
      ),
    )
  }

  function replyLink(inquiry: ParentInquiry) {
    if (!inquiry.parent_phone) return null
    const cleanPhone = inquiry.parent_phone.replace(/\D/g, '')
    const text = `Namaste ${inquiry.parent_name || ''} Ji,\n\nAapki TuitionMandi inquiry mili. ${inquiry.subject_needed || 'Tuition'} ke liye baat kar sakte hain.`
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="min-h-full bg-[#fbf8f1] pb-24">
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        subtitle={copy.inquiries.subtitle}
        title={copy.inquiries.title}
      />

      <section className="px-4 py-4">
        {error && <p className="rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#d84b3f]">{error}</p>}

        {loading ? (
          <div className="rounded-[18px] border border-[#eee4d8] bg-white p-4 text-sm font-bold text-[#746a60]">{copy.inquiries.loading}</div>
        ) : inquiries.length === 0 ? (
          <div className="py-8 text-center">
            <ProfessorIllustration className="mx-auto w-full max-w-[200px] h-auto" />
            <h3 className="mt-6 text-[16px] font-black text-[#1d1813]">{copy.inquiries.emptyTitle}</h3>
            <p className="mx-auto mt-2 max-w-[280px] text-[12.5px] font-semibold leading-relaxed text-[#746a60]">
              {copy.inquiries.emptySubtitle}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry, index) => {
              const waLink = replyLink(inquiry)
              return (
                <article className="rounded-[20px] border border-[#eee4d8] bg-white p-4 shadow-[0_12px_26px_rgba(53,38,22,0.06)]" key={inquiry.id}>
                  <div className="flex items-start gap-3">
                    <PersonAvatar name={inquiry.parent_name || 'Parent'} size="sm" variant={index % 2 ? 'female' : 'student'} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[13px] font-black text-[#1d1813]">{inquiry.parent_name || copy.inquiries.unknownParent}</p>
                        <span className={cx('shrink-0 rounded-full px-2 py-1 text-[10px] font-black', statusClass(inquiry.status))}>
                          {copy.inquiries.statuses[inquiry.status] || statusLabels[inquiry.status] || inquiry.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-semibold text-[#746a60]">
                        {inquiry.student_class || copy.inquiries.classLabel} - {inquiry.subject_needed || copy.inquiries.subjectLabel} - {timeAgo(inquiry.created_at)}
                      </p>
                      {inquiry.message && (
                        <p className="mt-3 rounded-[14px] bg-[#fff8ec] p-3 text-[12px] font-semibold leading-5 text-[#4d453d]">{inquiry.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {waLink && (
                      <a className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#25d366] px-3 py-2 text-[12px] font-black text-white" href={waLink} rel="noreferrer" target="_blank">
                        <Icon className="h-4 w-4" name="whatsapp" />
                        {copy.common.reply}
                      </a>
                    )}
                    <select
                      className="flex-1 rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-2 text-[12px] font-black text-[#1d1813]"
                      onChange={(event) => updateStatus(inquiry.id, event.target.value)}
                      value={inquiry.status}
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {copy.inquiries.statuses[status]}
                        </option>
                      ))}
                    </select>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
