import { useNavigate } from 'react-router'
import { Icon, IconButton, PageHeader, PageShell, TakhtiLogo } from '@/components/common/takhti-ui'

export function HelpPage() {
  const navigate = useNavigate()

  return (
    <PageShell>
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        title="Help & Support"
      />
      
      <section className="px-5 py-6">
        <TakhtiLogo tagline="How Takhti Works" />

        <div className="mt-8 space-y-6">
          <article className="rounded-[18px] border border-[#eee4d8] bg-white p-5 shadow-sm">
            <h2 className="text-base font-extrabold text-[#1d1813]">For Parents</h2>
            <p className="mt-2 text-[13px] font-semibold leading-relaxed text-[#5e554c]">
              Search for trusted teachers in your local area. View their profiles, see student results, read reviews, and connect directly via WhatsApp.
            </p>
          </article>

          <article className="rounded-[18px] border border-[#eee4d8] bg-white p-5 shadow-sm">
            <h2 className="text-base font-extrabold text-[#1d1813]">For Teachers</h2>
            <p className="mt-2 text-[13px] font-semibold leading-relaxed text-[#5e554c]">
              Create a free profile to get discovered by local students. Manage your students, take attendance, track fee payments, and generate monthly progress reports to send to parents automatically.
            </p>
          </article>
        </div>

        <button 
          className="mt-8 w-full rounded-xl bg-[#4930a8] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)] active:scale-[0.99]"
          onClick={() => navigate('/search')}
          type="button"
        >
          Find a Teacher Now
        </button>
      </section>
    </PageShell>
  )
}
