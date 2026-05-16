import { useNavigate } from 'react-router'
import { Icon, IconButton, PageHeader, PageShell, PersonAvatar } from '@/components/common/takhti-ui'
import { useLocalInquiries } from '@/hooks/use-local-inquiries'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.floor(hours / 24)} d ago`
}

function teacherVariant(index: number) {
  return index % 2 ? 'female' : 'student'
}

export function MessagesPage() {
  const navigate = useNavigate()
  const items = useLocalInquiries()

  return (
    <PageShell>
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        subtitle={`${items.length} message${items.length === 1 ? '' : 's'}`}
        title="My Inquiries"
      />

      <section className="px-4 py-4 pb-24">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-[#fbf8f1] text-[#9a8f83]">
              <Icon className="h-10 w-10" name="message" />
            </div>
            <h2 className="mt-6 text-lg font-black text-[#1d1813]">No inquiries yet</h2>
            <p className="mt-2 text-sm font-semibold text-[#746a60]">
              Teachers ke profile pe Send Inquiry tap karein - aapke messages yahan dikhenge.
            </p>
            <button
              className="mt-5 rounded-xl bg-[#0d7b51] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,123,81,0.18)]"
              onClick={() => navigate('/search')}
              type="button"
            >
              Find Teachers
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((inquiry, index) => (
              <article
                className="rounded-[18px] border border-[#eee4d8] bg-white p-3 shadow-[0_10px_24px_rgba(53,38,22,0.06)]"
                key={inquiry.id}
              >
                <div className="flex items-start gap-3">
                  <PersonAvatar
                    name={inquiry.parent_name || 'Parent'}
                    size="sm"
                    variant={teacherVariant(index)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-black text-[#1d1813]">
                        {inquiry.subject_needed || 'Tuition'} - {inquiry.student_class || 'Class'}
                      </p>
                      <span className="shrink-0 text-[10px] font-bold text-[#9a8f83]">
                        {timeAgo(inquiry.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-[#746a60]">
                      Status: {inquiry.status}
                    </p>
                    {inquiry.message && (
                      <p className="mt-2 line-clamp-3 rounded-[12px] bg-[#fff8ec] p-2 text-[12px] font-semibold leading-5 text-[#4d453d]">
                        {inquiry.message}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}
