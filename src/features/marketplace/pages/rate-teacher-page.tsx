import { useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { submitRating } from '@/lib/queries/teachers'
import { AnimatedLogo } from '@/components/common/animated-logo'

export function RateTeacherPage() {
    const { id } = useParams<{ id: string }>()
    const [form, setForm] = useState({
        parent_name: '',
        parent_phone: '',
        student_class: '',
        subject_taught: '',
        rating: 0,
        review_text: '',
    })
    const [saving, setSaving] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const canSubmit = form.parent_name.trim() && form.parent_phone.trim() &&
        form.student_class.trim() && form.subject_taught.trim() && form.rating > 0

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!id || !canSubmit) return

        setSaving(true)
        setError(null)

        try {
            await submitRating({
                teacher_profile_id: id,
                parent_name: form.parent_name.trim(),
                parent_phone: form.parent_phone.trim(),
                student_class: form.student_class.trim(),
                subject_taught: form.subject_taught.trim(),
                rating: form.rating,
                review_text: form.review_text.trim() || undefined,
            })
            setSubmitted(true)
        } catch (err: any) {
            setError(err?.message || 'Review submit nahi ho payi. Dobara try karein.')
        } finally {
            setSaving(false)
        }
    }

    // Success state
    if (submitted) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(180deg,#f6f0e6_0%,#fefcf8_35%,#ffffff_100%)] px-5 text-center">
                <p className="text-5xl mb-4">🙏</p>
                <h2 className="font-display text-xl font-semibold text-ink mb-2">Shukriya!</h2>
                <p className="text-sm text-muted mb-6">
                    Aapki review verify hone ke baad dikhegi.
                </p>
                <Link
                    to={`/profile/${id}`}
                    className="rounded-xl bg-saffron px-6 py-2.5 text-sm font-bold text-white shadow-sm"
                >
                    ← Profile pe jaayein
                </Link>
            </main>
        )
    }

    return (
        <main className="flex min-h-screen w-full flex-col bg-[linear-gradient(180deg,#f6f0e6_0%,#fefcf8_35%,#ffffff_100%)] text-ink">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AnimatedLogo />
                        <span className="font-display text-sm font-semibold text-ink">Review Likhein</span>
                    </div>
                    <Link
                        to={`/profile/${id}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-muted hover:border-saffron/40 transition-colors"
                    >
                        ← Profile
                    </Link>
                </div>
            </header>

            <section className="flex-1 px-5 py-6 pb-20">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Star rating */}
                    <div className="text-center mb-6">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Rating dein</p>
                        <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setForm({ ...form, rating: star })}
                                    className={`text-3xl transition-transform hover:scale-110 ${star <= form.rating ? 'grayscale-0' : 'grayscale opacity-30'
                                        }`}
                                >
                                    ⭐
                                </button>
                            ))}
                        </div>
                        {form.rating > 0 && (
                            <p className="text-xs text-saffron font-semibold mt-1">{form.rating}/5</p>
                        )}
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Aapka Naam *
                        </label>
                        <input
                            type="text"
                            value={form.parent_name}
                            onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                            placeholder="Aapka poora naam"
                            required
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/20 transition-all"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Phone Number * <span className="text-muted font-normal">(verify ke liye, show nahi hoga)</span>
                        </label>
                        <input
                            type="tel"
                            value={form.parent_phone}
                            onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                            placeholder="9876543210"
                            required
                            maxLength={10}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/20 transition-all"
                        />
                    </div>

                    {/* Class */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Bachche ki Class *
                        </label>
                        <input
                            type="text"
                            value={form.student_class}
                            onChange={(e) => setForm({ ...form, student_class: e.target.value })}
                            placeholder="Class 10"
                            required
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/20 transition-all"
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Subject *
                        </label>
                        <input
                            type="text"
                            value={form.subject_taught}
                            onChange={(e) => setForm({ ...form, subject_taught: e.target.value })}
                            placeholder="Mathematics"
                            required
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/20 transition-all"
                        />
                    </div>

                    {/* Review text */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Review <span className="text-muted font-normal">(optional — 300 chars)</span>
                        </label>
                        <textarea
                            value={form.review_text}
                            onChange={(e) => setForm({ ...form, review_text: e.target.value.slice(0, 300) })}
                            placeholder="Apna anubhav likhein..."
                            maxLength={300}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/20 transition-all resize-none"
                        />
                        <p className="text-[10px] text-muted mt-1 text-right">{300 - form.review_text.length} chars left</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={!canSubmit || saving}
                        className="w-full rounded-2xl bg-saffron py-3.5 text-sm font-bold text-white shadow-[0_8px_16px_rgba(224,122,47,0.35)] transition-all hover:shadow-[0_12px_24px_rgba(224,122,47,0.45)] disabled:opacity-40 disabled:shadow-none"
                    >
                        {saving ? 'Submit ho raha hai...' : '✍️ Review Submit karein'}
                    </button>
                </form>
            </section>
        </main>
    )
}
