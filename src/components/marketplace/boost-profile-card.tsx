import { useCallback, useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/auth-provider'
import { isLocalMode } from '@/lib/env'
import { openRazorpayCheckout } from '@/features/paywall/services/razorpay-service'
import { activateBoost, getActiveBoost } from '@/lib/queries/teachers'
import type { ProfileBoost } from '@/types/marketplace'

interface BoostProfileCardProps {
    onBoostSuccess?: () => void
}

const BOOST_OPTIONS = [
    {
        days: 7,
        labelKey: 'boostProfile.optionWeek',
        amountPaise: 4900, // ₹49
        description: 'Boost for 7 days',
    },
    {
        days: 30,
        labelKey: 'boostProfile.optionMonth',
        amountPaise: 14900, // ₹149
        description: 'Boost for 30 days',
    },
]

export function BoostProfileCard({ onBoostSuccess }: BoostProfileCardProps) {
    const { t } = useTranslation()
    const { session } = useAuth()
    const teacherId = session?.user.id

    const [activeBoost, setActiveBoost] = useState<ProfileBoost | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadBoost = useCallback(async () => {
        if (!teacherId) return
        setLoading(true)
        try {
            const boost = await getActiveBoost(teacherId)
            setActiveBoost(boost)
        } catch (err: unknown) {
            console.error('Failed to load boost', err)
        } finally {
            setLoading(false)
        }
    }, [teacherId])

    useEffect(() => {
        loadBoost()
    }, [loadBoost])

    async function handlePurchase(option: typeof BOOST_OPTIONS[0]) {
        if (!teacherId) return

        setError(null)
        setProcessing(true)

        try {
            if (isLocalMode) {
                // Simulate local mode successful payment
                await activateBoost(teacherId, option.days, 'local_simulated_payment')
            } else {
                // Real razorpay flow
                await openRazorpayCheckout({
                    amountPaise: option.amountPaise,
                    description: option.description,
                    teacherId: session?.user.id,
                    teacherName: session?.user.user_metadata?.full_name as string | undefined,
                    teacherPhone: session?.user.phone,
                    teacherEmail: session?.user.email,
                    onSuccess: async (paymentId) => {
                        await activateBoost(teacherId, option.days, paymentId)
                    },
                })
            }

            await loadBoost()
            if (onBoostSuccess) onBoostSuccess()

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : t('boostProfile.paymentFailed')
            setError(message)
        } finally {
            setProcessing(false)
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-surface p-4 animate-pulse">
                <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                <div className="h-10 bg-slate-100 rounded"></div>
            </div>
        )
    }

    if (activeBoost) {
        const expDate = new Date(activeBoost.expires_at).toLocaleDateString()
        return (
            <section className="rounded-2xl border border-[#dfd4bc] bg-gradient-to-br from-saffron/10 to-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🚀</span>
                    <p className="text-sm font-bold text-saffron uppercase tracking-widest">{t('boostProfile.boostedTitle')}</p>
                </div>
                <p className="text-xs text-ink/80 mb-2">
                    <Trans
                        i18nKey="boostProfile.boostedDescription"
                        values={{ date: expDate }}
                        components={{ strong: <strong /> }}
                    />
                </p>
            </section>
        )
    }

    return (
        <section className="rounded-2xl border border-saffron/30 bg-surface px-4 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🚀</span>
                <p className="text-xs uppercase tracking-[0.16em] text-saffron font-bold">{t('boostProfile.title')}</p>
            </div>

            <p className="text-xs text-muted mb-4">
                {t('boostProfile.description')}
            </p>

            {error && (
                <p className="mb-3 rounded-xl bg-rose/10 px-3 py-2 text-[11px] text-rose">{error}</p>
            )}

            {isLocalMode && (
                <p className="mb-3 rounded-lg border border-yellow-200 bg-yellow-50 px-2 py-1.5 text-[10px] text-yellow-800">
                    {t('boostProfile.localMode')}
                </p>
            )}

            <div className="space-y-2">
                {BOOST_OPTIONS.map(opt => (
                <button
                    key={opt.days}
                    type="button"
                    disabled={processing}
                    onClick={() => handlePurchase(opt)}
                    className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-surface p-3 transition-colors hover:border-saffron hover:bg-saffron/5 disabled:opacity-50"
                >
                    <div className="text-left">
                        <p className="text-sm font-bold text-ink">{t(opt.labelKey)}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                        ₹{opt.amountPaise / 100}
                    </div>
                </button>
                ))}
            </div>
        </section>
    )
}
