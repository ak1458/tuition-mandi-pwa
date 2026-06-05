import { useNavigate } from 'react-router'
import { Icon, IconButton, PageHeader, PageShell } from '@/components/common/tuition-mandi-ui'

const LAST_UPDATED = '23 May 2026'
const SUPPORT_EMAIL = 'support@tuitionmandi.com'

export function RefundPolicyPage() {
  const navigate = useNavigate()

  return (
    <PageShell>
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        subtitle={`Last updated: ${LAST_UPDATED}`}
        title="Refund & Cancellation Policy"
      />

      <article className="px-5 py-5 pb-20 space-y-6">
        {/* Summary card */}
        <section className="rounded-[18px] border border-[#ddecdf] bg-[#f4fbf6] p-4">
          <h2 className="text-[14px] font-black text-leaf">📋 Quick Summary</h2>
          <ul className="mt-2 text-[12px] font-semibold leading-6 text-ink-2 list-disc pl-4 space-y-1">
            <li>Full refund within 7 days of purchase if unused.</li>
            <li>Pro-rated refund within 7-30 days based on usage.</li>
            <li>No refund after 30 days.</li>
            <li>Refunds processed within 5-7 business days.</li>
          </ul>
        </section>

        <Section title="1. Scope">
          <p>
            This Refund & Cancellation Policy applies to paid Pro Plan subscriptions purchased through the
            TuitionMandi App via Razorpay. The Free Plan has no charges and is not subject to this policy.
          </p>
        </Section>

        <Section title="2. Pro Plan Pricing">
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>Monthly Plan:</strong> ₹199/month</li>
            <li><strong>Yearly Plan:</strong> ₹1,499/year</li>
          </ul>
          <p className="mt-2">
            All prices are in Indian Rupees (INR) and inclusive of applicable taxes.
          </p>
        </Section>

        <Section title="3. Cancellation">
          <ul className="list-disc pl-4 space-y-2">
            <li>You may cancel your Pro Plan at any time.</li>
            <li>Upon cancellation, your Pro features will remain active until the end of your current billing period.</li>
            <li>After expiry, your account will revert to the Free Plan automatically.</li>
            <li>No data is lost upon downgrade — your students, attendance, and fee records are preserved.</li>
          </ul>
        </Section>

        <Section title="4. Refund Eligibility">
          <div className="space-y-3 mt-2">
            <div className="rounded-xl border border-[#ddecdf] bg-[#f9fdf9] p-3">
              <p className="text-[13px] font-black text-leaf">Within 7 days of purchase</p>
              <p className="mt-1">Full refund if no AI reports have been generated during the subscription period.</p>
            </div>
            <div className="rounded-xl border border-[#fff4df] bg-[#fffdf5] p-3">
              <p className="text-[13px] font-black text-[#c87b22]">7 to 30 days after purchase</p>
              <p className="mt-1">Pro-rated refund based on unused days, minus any AI report generation costs.</p>
            </div>
            <div className="rounded-xl border border-[#fbe6e1] bg-[#fffbfa] p-3">
              <p className="text-[13px] font-black text-coral">After 30 days</p>
              <p className="mt-1">No refund will be issued. You may continue using Pro features until the subscription expires.</p>
            </div>
          </div>
        </Section>

        <Section title="5. How to Request a Refund">
          <ol className="list-decimal pl-4 space-y-2">
            <li>
              Email us at <a className="text-marigold-deep underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with
              subject line &quot;Refund Request&quot;.
            </li>
            <li>Include your registered phone number or email address.</li>
            <li>Include the Razorpay payment ID (found in your payment confirmation).</li>
            <li>Briefly explain the reason for your refund request.</li>
          </ol>
          <p className="mt-2">
            You can also request a refund via our{' '}
            <button className="text-marigold-deep underline font-bold" onClick={() => navigate('/help')} type="button">Help & Support</button> page
            or WhatsApp support.
          </p>
        </Section>

        <Section title="6. Refund Processing">
          <ul className="list-disc pl-4 space-y-2">
            <li>Approved refunds will be processed within <strong>5-7 business days</strong>.</li>
            <li>Refunds will be credited to the original payment method (bank account, UPI, or card).</li>
            <li>Razorpay processing times may add an additional 3-5 business days depending on your bank.</li>
          </ul>
        </Section>

        <Section title="7. Non-Refundable Cases">
          <ul className="list-disc pl-4 space-y-2">
            <li>Violation of our <button className="text-marigold-deep underline font-bold" onClick={() => navigate('/terms')} type="button">Terms & Conditions</button> leading to account suspension.</li>
            <li>Requests made after 30 days from purchase date.</li>
            <li>Duplicate payment issues should be reported within 48 hours.</li>
          </ul>
        </Section>

        <Section title="8. Contact">
          <p>
            For refund inquiries, contact us at{' '}
            <a className="text-marigold-deep underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            {' '}or visit our <button className="text-marigold-deep underline font-bold" onClick={() => navigate('/contact')} type="button">Contact</button> page.
          </p>
        </Section>
      </article>
    </PageShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-line bg-surface p-4 shadow-sm">
      <h2 className="text-[14px] font-black text-ink">{title}</h2>
      <div className="mt-2 text-[12px] font-semibold leading-6 text-ink-2">{children}</div>
    </section>
  )
}
