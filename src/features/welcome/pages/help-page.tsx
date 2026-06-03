import { useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { Icon, IconButton, PageHeader, PageShell, cx } from '@/components/common/tuition-mandi-ui'
import {
  SUPPORT_CONFIG,
  buildSupportMailto,
  buildSupportWhatsAppLink,
  recordSupportTicket,
} from '@/lib/support'
import { pushNotification } from '@/lib/notifications'

interface FAQItem {
  q: string
  a: string
}

const FAQS: FAQItem[] = [
  {
    q: 'TuitionMandi kaise kaam karta hai?',
    a: 'Teachers students add karein, attendance lagayein, fees track karein. Parents apne shahar ke teachers search karein aur WhatsApp se baat karein.',
  },
  {
    q: 'Mera data secure hai?',
    a: 'Haan. Local mode mein data sirf aapke device par hai. Cloud sync ke saath Supabase encryption use karta hai aur aapka data sirf aapko dikhta hai.',
  },
  {
    q: 'Pro plan mein kya milta hai?',
    a: 'Pro plan unlock karta hai unlimited students, unlimited AI progress reports, parent inquiries dashboard aur priority support.',
  },
  {
    q: 'Mein account aur data kaise delete karu?',
    a: 'More -> Your Data -> Delete account & data. Yeh permanently sab kuch hata dega.',
  },
  {
    q: 'OTP nahi aaya, kya karein?',
    a: 'Network check karein. 30 sec ke baad Resend OTP par tap karein. Phir bhi nahi aaya to support ko WhatsApp karein.',
  },
  {
    q: 'AI report Hindi mein generate hoti hai?',
    a: 'Haan. Aap Hindi (Devanagari), Roman Hindi ya English chun sakte hain - report uss language mein parents ko WhatsApp ho jaati hai.',
  },
]

export function HelpPage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const userId = session?.user.id ?? 'guest'
  const userPhone = session?.user.phone ?? ''
  const userEmail = session?.user.email ?? ''
  const userName = (session?.user?.user_metadata?.full_name as string | undefined) ?? ''

  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState(userPhone || userEmail)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fullPayload = useMemo(() => {
    const lines = [
      `From: ${userName || 'TuitionMandi user'}`,
      contact ? `Contact: ${contact}` : null,
      session?.user.id ? `User ID: ${session.user.id}` : null,
      '',
      message,
    ].filter(Boolean)
    return lines.join('\n')
  }, [contact, message, session?.user.id, userName])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    if (!subject.trim() || !message.trim()) {
      setErrorMessage('Subject aur message dono fill karein.')
      return
    }
    setSubmitting(true)
    try {
      recordSupportTicket({
        user_id: userId,
        subject: subject.trim(),
        message: message.trim(),
        contact: contact.trim(),
        contact_method: 'app',
      })
      pushNotification(userId, {
        type: 'system',
        title: 'Support request submitted',
        body: `"${subject.trim()}" — TuitionMandi team aapko jaldi reply karegi.`,
        link: '/help',
      })
      setSubmitted(true)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Submit nahi ho paya.')
    } finally {
      setSubmitting(false)
    }
  }

  const sendOnWhatsApp = () => {
    const finalSubject = subject.trim() || 'Help request'
    const finalMessage = message.trim() || 'Mujhe TuitionMandi use karne mein madad chahiye.'
    recordSupportTicket({
      user_id: userId,
      subject: finalSubject,
      message: finalMessage,
      contact: contact.trim(),
      contact_method: 'whatsapp',
    })
    window.open(buildSupportWhatsAppLink(finalSubject, fullPayload), '_blank', 'noreferrer')
  }

  const sendOverEmail = () => {
    const finalSubject = subject.trim() || 'Help request'
    const finalMessage = message.trim() || 'Mujhe TuitionMandi use karne mein madad chahiye.'
    recordSupportTicket({
      user_id: userId,
      subject: finalSubject,
      message: finalMessage,
      contact: contact.trim(),
      contact_method: 'email',
    })
    window.location.href = buildSupportMailto(finalSubject, fullPayload)
  }

  return (
    <PageShell>
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        subtitle="We are here to help"
        title="Help & Support"
      />

      <section className="px-5 py-5 pb-20">
        {/* Quick contact strip */}
        <div className="grid grid-cols-2 gap-3">
          <a
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#ddecdf] bg-[#f4fbf6] p-4 text-center text-[#0d7b51]"
            href={buildSupportWhatsAppLink('Help request', `From: ${userName || 'TuitionMandi user'}\nContact: ${contact}`)}
            rel="noreferrer"
            target="_blank"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#0d7b51]">
              <Icon className="h-5 w-5" name="whatsapp" />
            </span>
            <span className="text-[13px] font-black">WhatsApp Support</span>
            <span className="text-[10px] font-semibold text-[#5d544c]">{SUPPORT_CONFIG.whatsappNumber}</span>
          </a>
          <a
            className="flex flex-col items-center gap-2 rounded-2xl border border-[#ded1f7] bg-[#f7f3ff] p-4 text-center text-[#4930a8]"
            href={buildSupportMailto('Help request', `From: ${userName || 'TuitionMandi user'}\nContact: ${contact}`)}
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#4930a8]">
              <Icon className="h-5 w-5" name="message" />
            </span>
            <span className="text-[13px] font-black">Email Support</span>
            <span className="text-[10px] font-semibold text-[#5d544c]">{SUPPORT_CONFIG.email}</span>
          </a>
        </div>

        <p className="mt-2 rounded-xl border border-[#eee4d8] bg-white px-3 py-2 text-center text-[11px] font-semibold text-[#746a60]">
          Support hours: {SUPPORT_CONFIG.hours}
        </p>

        {/* Contact form */}
        <section className="mt-6 rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_30px_rgba(53,38,22,0.07)]">
          <h2 className="text-[15px] font-black text-[#1d1813]">Send us a message</h2>
          <p className="mt-1 text-[12px] font-semibold text-[#746a60]">Aap form bharein — humein 24 hr mein reply mil jayega.</p>

          {submitted ? (
            <div className="mt-5 rounded-[18px] bg-[#eaf7ef] p-5 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-[#0d7b51]">
                <Icon className="h-7 w-7" name="check" />
              </div>
              <p className="mt-3 text-base font-black text-[#0d7b51]">Shukriya! Aapka message bhej diya gaya.</p>
              <p className="mt-1 text-[12px] font-semibold text-[#5d544c]">TuitionMandi team jaldi se aapko contact karegi.</p>
              <button
                className="mt-4 rounded-xl border border-[#ddecdf] bg-white px-4 py-2 text-sm font-bold text-[#0d7b51]"
                onClick={() => {
                  setSubmitted(false)
                  setSubject('')
                  setMessage('')
                }}
                type="button"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <input
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject (e.g., Pro plan upgrade issue)"
                value={subject}
              />
              <input
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                onChange={(event) => setContact(event.target.value)}
                placeholder="Phone or email for reply"
                value={contact}
              />
              <textarea
                className="min-h-[120px] w-full resize-none rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#4930a8]"
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Apni problem detail mein likhein..."
                value={message}
              />
              {errorMessage && <p className="rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#d84b3f]">{errorMessage}</p>}
              <button
                className="w-full rounded-xl bg-[#4930a8] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)] disabled:opacity-60"
                disabled={submitting}
                type="submit"
              >
                {submitting ? 'Bhej rahe hain...' : 'Submit Request'}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-xl border border-[#ddecdf] bg-[#f4fbf6] px-3 py-3 text-sm font-bold text-[#0d7b51]"
                  onClick={sendOnWhatsApp}
                  type="button"
                >
                  Send on WhatsApp
                </button>
                <button
                  className="rounded-xl border border-[#ded1f7] bg-[#f7f3ff] px-3 py-3 text-sm font-bold text-[#4930a8]"
                  onClick={sendOverEmail}
                  type="button"
                >
                  Send via Email
                </button>
              </div>
            </form>
          )}
        </section>

        {/* FAQ */}
        <section className="mt-6">
          <h2 className="text-[15px] font-black text-[#1d1813]">Frequently asked questions</h2>
          <div className="mt-3 space-y-2">
            {FAQS.map((faq, index) => {
              const expanded = openFaq === index
              return (
                <article
                  className={cx(
                    'overflow-hidden rounded-[16px] border bg-white shadow-sm transition',
                    expanded ? 'border-[#ded1f7] bg-[#fcfaff]' : 'border-[#eee4d8]',
                  )}
                  key={faq.q}
                >
                  <button
                    aria-expanded={expanded}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    onClick={() => setOpenFaq(expanded ? null : index)}
                    type="button"
                  >
                    <span className="text-[13px] font-black text-[#1d1813]">{faq.q}</span>
                    <Icon
                      className={cx('h-4 w-4 shrink-0 text-[#9a8f83] transition-transform', expanded && 'rotate-90')}
                      name="chevron-right"
                    />
                  </button>
                  {expanded && (
                    <p className="border-t border-[#f3eadc] px-4 py-3 text-[12px] font-semibold leading-6 text-[#5d544c]">
                      {faq.a}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <button
          className="mt-7 w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-bold text-[#4930a8]"
          onClick={() => navigate('/search')}
          type="button"
        >
          Find a Teacher Now
        </button>
      </section>
    </PageShell>
  )
}
