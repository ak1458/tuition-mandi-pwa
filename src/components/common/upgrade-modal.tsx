import { useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { usePlan } from '@/hooks/use-plan'
import { isLocalMode } from '@/lib/env'
import { openRazorpayCheckout } from '@/features/paywall/services/razorpay-service'
import type { UpgradeReason } from '@/types/plan'

interface UpgradeModalProps {
  reason: UpgradeReason
  onClose: () => void
  onUpgradeSuccess?: () => void
}

type BillingCycle = 'monthly' | 'yearly'

const REASONS: Record<UpgradeReason, { title: string; message: string }> = {
  student_limit: {
    title: '15 students ho gaye!',
    message: 'Pro plan pe unlimited students add karo aur apni tuition grow karo.',
  },
  ai_report: {
    title: 'AI Reports Pro Feature',
    message: 'Parents ko professional report bhejne ke liye Pro unlock karo.',
  },
}

const BILLING_OPTIONS: Array<{
  cycle: BillingCycle
  label: string
  amountPaise: number
  description: string
}> = [
  {
    cycle: 'monthly',
    label: 'Pro Monthly - Rs 199',
    amountPaise: 19900,
    description: 'Pro Plan - 1 Mahina',
  },
  {
    cycle: 'yearly',
    label: 'Pro Yearly - Rs 1499',
    amountPaise: 149900,
    description: 'Pro Plan - 1 Saal',
  },
]

export function UpgradeModal({ reason, onClose, onUpgradeSuccess }: UpgradeModalProps) {
  const { session } = useAuth()
  const { upgradeToPro } = usePlan()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const teacherName = useMemo(() => {
    const metadata = session?.user.user_metadata as Record<string, unknown> | undefined
    const fullName = metadata?.full_name
    if (typeof fullName === 'string' && fullName.trim()) {
      return fullName.trim()
    }
    return 'Takhti Teacher'
  }, [session?.user.user_metadata])

  const teacherPhone = session?.user.phone
  const teacherEmail = session?.user.email

  const handleUpgrade = async (cycle: BillingCycle, amountPaise: number, description: string) => {
    setErrorMessage('')
    setIsProcessing(true)

    try {
      if (isLocalMode) {
        await upgradeToPro(cycle)
      } else {
        await openRazorpayCheckout({
          amountPaise,
          description,
          teacherId: session?.user.id,
          teacherName,
          teacherPhone,
          teacherEmail,
          onSuccess: async (paymentId) => {
            await upgradeToPro(cycle, paymentId)
          },
        })
      }

      onUpgradeSuccess?.()
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upgrade failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 px-4 py-6 md:items-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-[0_30px_60px_rgba(28,27,53,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">{REASONS[reason].title}</h2>
            <p className="mt-2 text-sm text-muted">{REASONS[reason].message}</p>
          </div>
          <button
            className="rounded-full border border-[#dfd4bc] px-2 py-1 text-xs font-semibold text-muted"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-cream px-3 py-3 text-sm text-ink">
          <p className="font-semibold">Rs 199/month</p>
          <p className="mt-1 text-muted">ya Rs 1499/year (4 mahine free)</p>
        </div>

        <div className="mt-4 space-y-2">
          {BILLING_OPTIONS.map((option) => (
            <button
              className="w-full rounded-xl bg-saffron px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              disabled={isProcessing}
              key={option.cycle}
              onClick={() => {
                handleUpgrade(option.cycle, option.amountPaise, option.description).catch(() => {})
              }}
              type="button"
            >
              {isProcessing ? 'Processing...' : option.label}
            </button>
          ))}
          <button
            className="w-full rounded-xl border border-[#dfd4bc] bg-white px-4 py-3 text-sm font-semibold text-muted"
            disabled={isProcessing}
            onClick={onClose}
            type="button"
          >
            Baad mein
          </button>
        </div>

        {errorMessage && <p className="mt-3 rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">{errorMessage}</p>}
        {isLocalMode && (
          <p className="mt-3 rounded-xl bg-saffron/10 px-3 py-2 text-xs text-muted">
            Local mode: payment simulate hoga aur plan direct pro banega.
          </p>
        )}
      </div>
    </div>
  )
}
