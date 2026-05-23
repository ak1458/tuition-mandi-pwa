import { useNavigate } from 'react-router'
import { Icon, IconButton, PageHeader, PageShell } from '@/components/common/takhti-ui'

const LAST_UPDATED = '23 May 2026'
const BUSINESS_NAME = 'Takhti'
const BUSINESS_ADDRESS = 'Gonda, Uttar Pradesh, India'
const GRIEVANCE_EMAIL = 'grievance@takhti.app'
const SUPPORT_EMAIL = 'support@takhti.app'

export function PrivacyPolicyPage() {
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
        title="Privacy Policy"
      />

      <article className="px-5 py-5 pb-20 space-y-6">
        {/* Consent Notice - DPDP Act 2023 */}
        <section className="rounded-[18px] border border-[#ded1f7] bg-[#f7f3ff] p-4">
          <h2 className="text-[14px] font-black text-[#4930a8]">🔒 Your Data, Your Choice</h2>
          <p className="mt-2 text-[12px] font-semibold leading-6 text-[#5d544c]">
            By using Takhti, you consent to the collection and processing of your personal data as described
            in this Privacy Policy, in accordance with the Digital Personal Data Protection (DPDP) Act, 2023
            and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
            You may withdraw consent at any time by deleting your account.
          </p>
        </section>

        <Section title="1. Who We Are">
          <p>
            {BUSINESS_NAME} (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a digital platform that connects tuition teachers with
            parents and students. Our application is operated from {BUSINESS_ADDRESS}.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>Account data:</strong> Phone number (for OTP login), email address (if email login is used), name.</li>
            <li><strong>Teacher profile data:</strong> Full name, city, area, subjects, classes taught, bio, profile photo URL, teaching experience, fees.</li>
            <li><strong>Student records:</strong> Student names, class labels, subjects, attendance records, fee records, assessment scores — stored locally on your device or in your Supabase-encrypted cloud account.</li>
            <li><strong>AI-generated reports:</strong> Progress report text generated using Google Gemini AI based on your student&apos;s anonymised attendance/score data.</li>
            <li><strong>Payment data:</strong> Razorpay payment IDs, transaction amounts, billing cycle. We do NOT store your card/UPI details — Razorpay handles payment processing.</li>
            <li><strong>Parent inquiries:</strong> Parent name, phone, message text, and subject interest submitted through teacher profiles.</li>
            <li><strong>Device data:</strong> Browser type, language preference, notification preferences — stored locally.</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="list-disc pl-4 space-y-2">
            <li>To provide and maintain the Takhti service (attendance, fees, reports, marketplace).</li>
            <li>To authenticate you via phone OTP or email/password login.</li>
            <li>To process Pro plan payments through Razorpay.</li>
            <li>To generate AI progress reports for your students.</li>
            <li>To display your teacher profile on the public marketplace (only if you opt in by creating a profile).</li>
            <li>To deliver parent inquiries to your dashboard.</li>
            <li>To send you notifications (in-app, WhatsApp, or email) based on your preferences.</li>
          </ul>
        </Section>

        <Section title="4. Third-Party Services">
          <ul className="list-disc pl-4 space-y-2">
            <li><strong>Supabase (Austria/US):</strong> Cloud database and authentication. Your data is encrypted at rest and in transit.</li>
            <li><strong>Razorpay (India):</strong> Payment processing for Pro plan subscriptions. Subject to <a className="text-[#4930a8] underline" href="https://razorpay.com/privacy/" target="_blank" rel="noreferrer">Razorpay&apos;s Privacy Policy</a>.</li>
            <li><strong>Google Gemini AI (US):</strong> Generates progress report text. Only anonymised student performance data (attendance %, average score) is sent — no personal identifiers.</li>
            <li><strong>Google Fonts:</strong> Typography loaded from Google&apos;s CDN.</li>
            <li><strong>Vercel (US):</strong> Application hosting and edge function execution.</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>
            Your data is retained as long as your account is active. When you delete your account
            (More → Your Data → Delete account & data), all your locally stored data is permanently erased.
            Cloud-stored data is also removed upon account deletion.
          </p>
          <p className="mt-2">
            Payment receipts may be retained for up to 8 years for tax and legal compliance as per Indian tax law.
          </p>
        </Section>

        <Section title="6. Your Rights (DPDP Act 2023)">
          <p>As a Data Principal under the DPDP Act 2023, you have the right to:</p>
          <ul className="list-disc pl-4 space-y-2 mt-2">
            <li><strong>Access:</strong> View all data we hold about you (export via More → Your Data → Export).</li>
            <li><strong>Correction:</strong> Update your profile and student records at any time.</li>
            <li><strong>Erasure:</strong> Delete your account and all associated data.</li>
            <li><strong>Withdraw consent:</strong> Stop using the service and delete your account.</li>
            <li><strong>Grievance redressal:</strong> Contact our Grievance Officer (see below).</li>
          </ul>
        </Section>

        <Section title="7. Data Security">
          <p>
            We implement industry-standard security measures including HTTPS encryption, Row Level Security
            (RLS) on all database tables, HMAC signature verification for payment webhooks, Content Security
            Policy headers, and secure authentication via Supabase Auth. No service-role keys or secrets
            are exposed in the client-side application.
          </p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>
            Takhti is designed for teachers and parents. Student data is entered by teachers — we do not
            directly collect data from children under 18. Teachers are responsible for obtaining appropriate
            consent from parents/guardians before entering student information.
          </p>
        </Section>

        <Section title="9. Grievance Officer (IT Rules 2021)">
          <div className="rounded-xl border border-[#eee4d8] bg-[#fffdf8] p-3 mt-2">
            <p><strong>Grievance Officer:</strong> Takhti Support Team</p>
            <p><strong>Email:</strong> <a className="text-[#4930a8] underline" href={`mailto:${GRIEVANCE_EMAIL}`}>{GRIEVANCE_EMAIL}</a></p>
            <p><strong>Address:</strong> {BUSINESS_ADDRESS}</p>
            <p className="mt-2 text-[11px] text-[#9a8f83]">
              Response time: Within 24 hours of receipt. Resolution within 15 days as per IT Rules 2021.
            </p>
          </div>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with
            an updated date. Continued use of Takhti after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            For any questions about this Privacy Policy, contact us at{' '}
            <a className="text-[#4930a8] underline" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            {' '}or via our <button className="text-[#4930a8] underline font-bold" onClick={() => navigate('/help')} type="button">Help & Support</button> page.
          </p>
        </Section>
      </article>
    </PageShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-[#eee4d8] bg-white p-4 shadow-sm">
      <h2 className="text-[14px] font-black text-[#1d1813]">{title}</h2>
      <div className="mt-2 text-[12px] font-semibold leading-6 text-[#5d544c]">{children}</div>
    </section>
  )
}
