import { useNavigate } from 'react-router'
import { Icon, IconButton, PageHeader, PageShell } from '@/components/common/tuition-mandi-ui'
import { SUPPORT_CONFIG, buildSupportWhatsAppLink, buildSupportMailto } from '@/lib/support'

const BUSINESS_NAME = 'TuitionMandi'
const BUSINESS_ADDRESS = 'Gonda, Uttar Pradesh, India'
const GRIEVANCE_EMAIL = 'grievance@tuitionmandi.com'

export function ContactPage() {
  const navigate = useNavigate()

  return (
    <PageShell>
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        subtitle="We're here to help"
        title="Contact Us"
      />

      <section className="px-5 py-5 pb-20 space-y-6">
        {/* Quick contact cards */}
        <div className="grid grid-cols-2 gap-3">
          <a
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#ddecdf] bg-[#f4fbf6] p-5 text-center text-leaf"
            href={buildSupportWhatsAppLink('Contact inquiry', '')}
            rel="noreferrer"
            target="_blank"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface text-leaf shadow-sm">
              <Icon className="h-6 w-6" name="whatsapp" />
            </span>
            <span className="text-[14px] font-black">WhatsApp</span>
            <span className="text-[11px] font-semibold text-ink-2">{SUPPORT_CONFIG.whatsappNumber}</span>
          </a>
          <a
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#fcefd2] bg-marigold-wash p-5 text-center text-marigold-deep"
            href={buildSupportMailto('Contact inquiry', '')}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface text-marigold-deep shadow-sm">
              <Icon className="h-6 w-6" name="message" />
            </span>
            <span className="text-[14px] font-black">Email</span>
            <span className="text-[11px] font-semibold text-ink-2">{SUPPORT_CONFIG.email}</span>
          </a>
        </div>

        <p className="rounded-xl border border-line bg-surface px-3 py-2 text-center text-[11px] font-semibold text-ink-soft">
          Support hours: {SUPPORT_CONFIG.hours}
        </p>

        {/* Business details */}
        <section className="rounded-[18px] border border-line bg-surface p-4 shadow-sm">
          <h2 className="text-[14px] font-black text-ink">Business Details</h2>
          <div className="mt-3 space-y-3 text-[12px] font-semibold leading-6 text-ink-2">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper text-ink-2">
                <Icon className="h-4 w-4" name="layout" />
              </span>
              <div>
                <p className="font-black text-ink">{BUSINESS_NAME}</p>
                <p>{BUSINESS_ADDRESS}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper text-ink-2">
                <Icon className="h-4 w-4" name="message" />
              </span>
              <div>
                <p className="font-black text-ink">General Support</p>
                <a className="text-marigold-deep underline" href={`mailto:${SUPPORT_CONFIG.email}`}>{SUPPORT_CONFIG.email}</a>
              </div>
            </div>
          </div>
        </section>

        {/* Grievance Officer - IT Rules 2021 */}
        <section className="rounded-[18px] border border-[#fcefd2] bg-marigold-wash p-4 shadow-sm">
          <h2 className="text-[14px] font-black text-marigold-deep">Grievance Officer</h2>
          <p className="mt-1 text-[11px] font-semibold text-ink-soft">
            As per IT (Intermediary Guidelines) Rules, 2021
          </p>
          <div className="mt-3 space-y-2 text-[12px] font-semibold leading-6 text-ink-2">
            <p><strong>Name:</strong> TuitionMandi Support Team</p>
            <p><strong>Email:</strong>{' '}
              <a className="text-marigold-deep underline" href={`mailto:${GRIEVANCE_EMAIL}`}>{GRIEVANCE_EMAIL}</a>
            </p>
            <p><strong>Address:</strong> {BUSINESS_ADDRESS}</p>
            <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-[11px] text-ink-soft">
              We acknowledge all grievances within 24 hours and resolve within 15 days as mandated by law.
            </p>
          </div>
        </section>

        {/* Quick links */}
        <section className="rounded-[18px] border border-line bg-surface p-4 shadow-sm">
          <h2 className="text-[14px] font-black text-ink">Quick Links</h2>
          <div className="mt-3 space-y-1">
            <QuickLink label="Help & FAQ" onClick={() => navigate('/help')} />
            <QuickLink label="Privacy Policy" onClick={() => navigate('/privacy')} />
            <QuickLink label="Terms & Conditions" onClick={() => navigate('/terms')} />
            <QuickLink label="Refund & Cancellation Policy" onClick={() => navigate('/refund')} />
          </div>
        </section>
      </section>
    </PageShell>
  )
}

function QuickLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      className="flex w-full items-center justify-between rounded-xl px-2 py-3 text-left text-[13px] font-bold text-ink hover:bg-paper"
      onClick={onClick}
      type="button"
    >
      {label}
      <Icon className="h-4 w-4 text-ink-soft" name="chevron-right" />
    </button>
  )
}
