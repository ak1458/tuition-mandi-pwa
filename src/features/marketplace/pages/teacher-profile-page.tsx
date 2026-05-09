import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { getTeacherPublicProfile } from '@/lib/queries/teachers'
import { buildWhatsAppLink } from '@/utils/whatsapp'
import { ShareProfileButton } from '@/components/marketplace/share-profile'
import { AnimatedLogo } from '@/components/common/animated-logo'
import type { TeacherProfile, ParentRating, TeacherOutcome } from '@/types/marketplace'

// ------- Helper -------
function avgRating(ratings: ParentRating[] | undefined): number {
    if (!ratings?.length) return 0
    return ratings.reduce((sum: number, r: ParentRating) => sum + r.rating, 0) / ratings.length
}

function StarDisplay({ rating }: { rating: number }) {
    return (
        <span className="text-sm">
            {'⭐'.repeat(Math.round(rating))}
        </span>
    )
}

// ------- Main Page -------
export function TeacherProfilePage() {
    const { t } = useTranslation()
    const { id } = useParams<{ id: string }>()
    const [teacher, setTeacher] = useState<TeacherProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!id) return

        const load = async () => {
            setLoading(true)
            setError(null)
            try {
                const data = await getTeacherPublicProfile(id)
                setTeacher(data)

                // SEO meta tags
                if (data) {
                    const avg = avgRating(data.parent_ratings)
                    document.title = `${data.full_name} — ${data.subjects?.join(', ')} Teacher in ${data.city} | Takhti`

                    const meta = document.querySelector('meta[name="description"]')
                        || document.createElement('meta')
                    meta.setAttribute('name', 'description')
                    meta.setAttribute('content',
                        `${data.full_name} — Experienced ${data.subjects?.join(' and ')} teacher in ${data.area_mohalla ? data.area_mohalla + ', ' : ''}${data.city}. ${data.experience_years} years experience. Fees: ₹${data.fee_min || '?'}-${data.fee_max || '?'}/month. Parent ratings: ${avg > 0 ? avg.toFixed(1) : 'N/A'}/5.`
                    )
                    if (!document.querySelector('meta[name="description"]')) {
                        document.head.appendChild(meta)
                    }
                }
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Profile load nahi ho payi.'
                setError(message)
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [id])

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f6f0e6_0%,#fefcf8_35%,#ffffff_100%)]">
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-saffron border-t-transparent" />
            </main>
        )
    }

    if (error || !teacher) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center bg-[linear-gradient(180deg,#f6f0e6_0%,#fefcf8_35%,#ffffff_100%)] px-5 text-center">
                <p className="text-4xl mb-4">😕</p>
                <p className="text-sm font-semibold text-ink mb-1">Profile nahi mili</p>
                <p className="text-xs text-muted mb-4">{error || 'Ye teacher profile available nahi hai.'}</p>
                <Link to="/search" className="rounded-xl bg-saffron px-6 py-2.5 text-sm font-bold text-white">
                    Teachers Search karein
                </Link>
            </main>
        )
    }

    const rating = avgRating(teacher.parent_ratings)
    const ratingCount = teacher.parent_ratings?.length || 0
    const profileUrl = `${window.location.origin}/profile/${teacher.id}`
    const whatsappUrl = buildWhatsAppLink(teacher.phone_e164, teacher.full_name, profileUrl)

    return (
        <main className="flex min-h-screen w-full flex-col bg-[linear-gradient(180deg,#f6f0e6_0%,#fefcf8_35%,#ffffff_100%)] text-ink pb-20">
            {/* Header bar */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AnimatedLogo />
                        <span className="font-display text-sm font-semibold text-ink">Takhti</span>
                    </div>
                    <Link
                        to="/search"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-muted hover:border-saffron/40 transition-colors"
                    >
                        ← Search
                    </Link>
                </div>
            </header>

            <div className="px-5 py-6 space-y-6">
                {/* ------- SECTION 1: HEADER ------- */}
                <section className="text-center">
                    {/* Avatar */}
                    <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-saffron/20 to-orange-100 text-3xl font-bold text-saffron shadow-md">
                        {teacher.profile_photo_url ? (
                            <img
                                src={teacher.profile_photo_url}
                                alt={teacher.full_name}
                                className="h-20 w-20 rounded-full object-cover"
                            />
                        ) : (
                            teacher.full_name?.charAt(0)?.toUpperCase() || 'T'
                        )}
                    </div>

                    {/* Name + badge */}
                    <h1 className="font-display text-2xl font-semibold text-ink">
                        {teacher.full_name}
                    </h1>
                    {teacher.is_verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-3 py-0.5 text-[10px] font-bold text-green-700 mt-1">
                            ✅ Verified Teacher
                        </span>
                    )}

                    {/* Location */}
                    <p className="text-sm text-muted mt-1">
                        {teacher.area_mohalla ? `${teacher.area_mohalla}, ` : ''}{teacher.city}
                    </p>

                    {/* Experience badge */}
                    {teacher.experience_years > 0 && (
                        <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600 mt-2">
                            🎓 {teacher.experience_years} saal ka anubhav
                        </span>
                    )}

                    {/* WhatsApp CTA */}
                    {whatsappUrl ? (
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-saffron py-3.5 text-sm font-bold text-white shadow-[0_8px_16px_rgba(224,122,47,0.35)] transition-all hover:shadow-[0_12px_24px_rgba(224,122,47,0.45)]"
                        >
                            {t('teacherProfile.whatsappContact')}
                        </a>
                    ) : (
                        <p className="mt-4 rounded-2xl bg-slate-100 py-3.5 text-center text-sm font-semibold text-slate-400">
                            {t('teacherProfile.noPhone')}
                        </p>
                    )}
                </section>

                {/* ------- SECTION 2: QUICK INFO CHIPS ------- */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Teaching Details</h2>

                    {/* Subjects */}
                    <div className="mb-3">
                        <p className="text-[10px] font-semibold text-muted mb-1">Subjects</p>
                        <div className="flex flex-wrap gap-1.5">
                            {teacher.subjects?.map((s: string) => (
                                <span key={s} className="rounded-lg bg-saffron/10 px-2.5 py-1 text-[11px] font-semibold text-saffron">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Classes */}
                    <div className="mb-3">
                        <p className="text-[10px] font-semibold text-muted mb-1">Classes</p>
                        <div className="flex flex-wrap gap-1.5">
                            {teacher.classes_taught?.map((c: string) => (
                                <span key={c} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    {c}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Medium + Tuition type */}
                    <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                            📖 {teacher.medium} Medium
                        </span>
                        {teacher.home_tuition && (
                            <span className="rounded-lg bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600">
                                🏠 Home Tuition
                            </span>
                        )}
                        {teacher.online_tuition && (
                            <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-600">
                                💻 Online
                            </span>
                        )}
                    </div>
                </section>

                {/* ------- SECTION 3: FEES ------- */}
                {(teacher.fee_min || teacher.fee_max) && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Fees</h2>
                        <p className="text-xl font-bold text-ink">
                            ₹{teacher.fee_min || '?'} - ₹{teacher.fee_max || '?'}/month
                        </p>
                        {teacher.fee_negotiable && (
                            <p className="text-xs text-muted mt-1">💬 Fees mein baat ho sakti hai</p>
                        )}
                    </section>
                )}

                {/* ------- SECTION 4: TIMING ------- */}
                {teacher.time_slots?.length > 0 && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Available Timings</h2>
                        <div className="flex flex-wrap gap-1.5">
                            {teacher.time_slots.map((slot: string) => (
                                <span key={slot} className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    🕐 {slot}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {/* ------- SECTION 5: RESULTS / OUTCOMES ------- */}
                {(teacher.teacher_outcomes?.length ?? 0) > 0 && (
                    <section className="rounded-2xl border border-green-200 bg-green-50/50 p-4 shadow-sm">
                        <h2 className="text-[10px] font-bold uppercase tracking-wider text-green-600 mb-3">
                            ✅ Takhti Verified Results
                        </h2>
                        {teacher.teacher_outcomes?.map((outcome: TeacherOutcome) => (
                            <div key={outcome.id} className="rounded-xl bg-white border border-green-100 p-3 mb-2 last:mb-0">
                                <p className="text-[10px] font-semibold text-muted mb-1">
                                    {outcome.academic_year} • {outcome.subject} • {outcome.class_level}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                    <span className="text-ink font-medium">
                                        📚 {outcome.total_students} students padhaye
                                    </span>
                                    <span className="text-green-600 font-medium">
                                        ✅ {outcome.students_above_75_percent} ne 75%+ kiya
                                    </span>
                                    {outcome.students_above_90_percent > 0 && (
                                        <span className="text-saffron font-medium">
                                            🌟 {outcome.students_above_90_percent} ne 90%+ kiya
                                        </span>
                                    )}
                                    {outcome.board_toppers > 0 && (
                                        <span className="text-ink font-medium">
                                            🏆 {outcome.board_toppers} topper
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* ------- SECTION 6: RATINGS ------- */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Ratings & Reviews</h2>

                    {ratingCount > 0 ? (
                        <>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-3xl font-bold text-ink">{rating.toFixed(1)}</span>
                                <div>
                                    <StarDisplay rating={rating} />
                                    <p className="text-[11px] text-muted">{ratingCount} rating{ratingCount > 1 ? 's' : ''}</p>
                                </div>
                            </div>

                            {/* Reviews list */}
                            <div className="space-y-3">
                                {teacher.parent_ratings?.map((review: ParentRating) => (
                                    <div key={review.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-semibold text-ink">{review.parent_name}</span>
                                            <StarDisplay rating={review.rating} />
                                        </div>
                                        <p className="text-[10px] text-muted mb-1">
                                            {review.student_class} • {review.subject_taught}
                                        </p>
                                        {review.review_text && (
                                            <p className="text-xs text-ink/80 italic">"{review.review_text}"</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-muted text-center py-4">Abhi koi review nahi hai</p>
                    )}
                </section>

                {/* ------- SECTION 7: WRITE REVIEW ------- */}
                <Link
                    to={`/profile/${teacher.id}/review`}
                    className="block rounded-2xl border border-saffron/30 bg-saffron/5 py-3.5 text-center text-sm font-bold text-saffron transition-all hover:bg-saffron/10"
                >
                    ✍️ Apna anubhav share karein
                </Link>

                {/* ------- SECTION 8: SHARE ------- */}
                <section>
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Is profile ko share karein</h2>
                    <ShareProfileButton
                        profileId={teacher.id}
                        teacherName={teacher.full_name}
                        city={teacher.city}
                    />
                </section>

                {/* Bio */}
                {teacher.bio && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">About</h2>
                        <p className="text-sm text-ink/80">{teacher.bio}</p>
                    </section>
                )}
            </div>
        </main>
    )
}
