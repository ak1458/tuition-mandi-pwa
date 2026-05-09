import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { searchTeachers } from '@/lib/queries/teachers'
import { buildWhatsAppLink } from '@/utils/whatsapp'
import { AnimatedLogo } from '@/components/common/animated-logo'
import type { SearchFilters, TeacherProfile, ParentRating, ProfileBoost, TeachingMedium } from '@/types/marketplace'

// ------- Constants -------
const POPULAR_SUBJECTS = [
    'Mathematics', 'Science', 'English', 'Hindi',
    'Physics', 'Chemistry', 'Biology',
    'Social Science', 'Accountancy', 'Economics',
]

const CLASS_OPTIONS = [
    'Class 1-5', 'Class 6', 'Class 7', 'Class 8',
    'Class 9', 'Class 10', 'Class 11', 'Class 12',
]

const MEDIUM_OPTIONS = ['Hindi', 'English', 'Both'] as const

// ------- Helper -------
function avgRating(ratings: ParentRating[] | undefined): number {
    if (!ratings?.length) return 0
    return ratings.reduce((sum: number, r: ParentRating) => sum + r.rating, 0) / ratings.length
}

function isBoosted(teacher: TeacherProfile): boolean {
    return teacher.profile_boosts?.some(
        (b: ProfileBoost) => b.is_active && new Date(b.expires_at) > new Date()
    ) ?? false
}

// ------- Teacher Card -------
function TeacherCard({ teacher }: { teacher: TeacherProfile }) {
    const { t } = useTranslation()
    const rating = avgRating(teacher.parent_ratings)
    const ratingCount = teacher.parent_ratings?.length || 0
    const boosted = isBoosted(teacher)
    const profileUrl = `${window.location.origin}/profile/${teacher.id}`
    const whatsappUrl = buildWhatsAppLink(teacher.phone_e164, teacher.full_name, profileUrl)

    return (
        <div
            className={`relative rounded-2xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${boosted
                    ? 'border-saffron/40 bg-gradient-to-br from-white to-orange-50/40'
                    : 'border-slate-200'
                }`}
        >
            {/* Featured badge */}
            {boosted && (
                <span className="absolute -top-2.5 right-3 rounded-full bg-saffron/90 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                    Featured
                </span>
            )}

            {/* Header: Photo + Name */}
            <div className="flex items-start gap-3 mb-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron/20 to-orange-100 text-lg font-bold text-saffron">
                    {teacher.full_name?.charAt(0)?.toUpperCase() || 'T'}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                        <h3 className="font-display text-sm font-semibold text-ink truncate">
                            {teacher.full_name}
                        </h3>
                        {teacher.is_verified && (
                            <span className="text-[11px]" title="Verified">✅</span>
                        )}
                    </div>
                    <p className="text-[11px] text-muted truncate">
                        {teacher.area_mohalla ? `${teacher.area_mohalla}, ` : ''}{teacher.city}
                    </p>
                </div>
            </div>

            {/* Subject chips */}
            <div className="flex flex-wrap gap-1 mb-2">
                {teacher.subjects?.slice(0, 3).map((s: string) => (
                    <span
                        key={s}
                        className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                    >
                        {s}
                    </span>
                ))}
                {teacher.subjects?.length > 3 && (
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                        +{teacher.subjects.length - 3}
                    </span>
                )}
            </div>

            {/* Class chips */}
            <div className="flex flex-wrap gap-1 mb-3">
                {teacher.classes_taught?.slice(0, 3).map((c: string) => (
                    <span
                        key={c}
                        className="rounded-lg bg-saffron/10 px-2 py-0.5 text-[10px] font-semibold text-saffron"
                    >
                        {c}
                    </span>
                ))}
                {teacher.classes_taught?.length > 3 && (
                    <span className="rounded-lg bg-saffron/10 px-2 py-0.5 text-[10px] font-semibold text-saffron/60">
                        +{teacher.classes_taught.length - 3}
                    </span>
                )}
            </div>

            {/* Rating + Fee */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1">
                    <span className="text-sm">⭐</span>
                    <span className="text-xs font-bold text-ink">
                        {rating > 0 ? rating.toFixed(1) : '—'}
                    </span>
                    {ratingCount > 0 && (
                        <span className="text-[10px] text-muted">({ratingCount})</span>
                    )}
                </div>
                {(teacher.fee_min || teacher.fee_max) && (
                    <span className="text-xs font-semibold text-ink">
                        ₹{teacher.fee_min || '?'} - ₹{teacher.fee_max || '?'}/mo
                    </span>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
                {whatsappUrl ? (
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 rounded-xl bg-green-500 py-2.5 text-center text-[11px] font-bold text-white shadow-sm transition-all hover:bg-green-600 hover:shadow-md"
                    >
                        💬 WhatsApp
                    </a>
                ) : (
                    <span className="flex-1 rounded-xl bg-gray-200 py-2.5 text-center text-[11px] font-bold text-gray-400">
                        {t('search.noPhone', '📞 Phone Nahi Hai')}
                    </span>
                )}
                <Link
                    to={`/profile/${teacher.id}`}
                    className="flex-1 rounded-xl border border-saffron bg-saffron/5 py-2.5 text-center text-[11px] font-bold text-saffron transition-all hover:bg-saffron hover:text-white"
                >
                    {t('search.viewProfile')}
                </Link>
            </div>
        </div>
    )
}

// ------- Filter Chip -------
function FilterChip({
    label,
    active,
    onClick,
}: {
    label: string
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-all ${active
                    ? 'border-saffron bg-saffron text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-saffron/40'
                }`}
        >
            {label}
        </button>
    )
}

// ------- Main Page -------
export function SearchPage() {
    const { t } = useTranslation()
    const [city, setCity] = useState('')
    const [selectedSubject, setSelectedSubject] = useState<string | undefined>()
    const [selectedClass, setSelectedClass] = useState<string | undefined>()
    const [selectedMedium, setSelectedMedium] = useState<string | undefined>()
    const [homeTuition, setHomeTuition] = useState(false)
    const [onlineTuition, setOnlineTuition] = useState(false)
    const [teachers, setTeachers] = useState<TeacherProfile[]>([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filter drawer state
    const [showFilters, setShowFilters] = useState(false)

    const handleSearch = useCallback(async (e?: FormEvent) => {
        e?.preventDefault()
        if (!city.trim()) return

        setLoading(true)
        setError(null)
        setSearched(true)

        try {
            const filters: SearchFilters = {
                city: city.trim(),
                subject: selectedSubject,
                class_level: selectedClass,
                medium: selectedMedium as TeachingMedium,
                home_tuition: homeTuition || undefined,
                online_tuition: onlineTuition || undefined,
            }
            const results = await searchTeachers(filters)
            setTeachers(results)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Search mein dikkat aayi. Dobara try karein.'
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [city, selectedSubject, selectedClass, selectedMedium, homeTuition, onlineTuition])

    // Re-search when filters change (if already searched)
    useEffect(() => {
        if (searched && city.trim()) {
            handleSearch()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubject, selectedClass, selectedMedium, homeTuition, onlineTuition])

    return (
        <main className="flex min-h-screen w-full flex-col bg-[linear-gradient(180deg,#f6f0e6_0%,#fefcf8_35%,#ffffff_100%)] text-ink">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md">
                <div className="flex items-center gap-3 mb-3">
                    <AnimatedLogo />
                    <div>
                        <h1 className="font-display text-xl font-semibold text-ink">Takhti Search</h1>
                        <p className="text-[11px] text-muted">Apne area ka best teacher dhundhein</p>
                    </div>
                </div>

                {/* Search bar */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City daalein — Gonda, Lucknow..."
                        className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/20 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!city.trim() || loading}
                        className="rounded-xl bg-saffron px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md disabled:opacity-40"
                    >
                        🔍
                    </button>
                </form>

                {/* Filter toggle */}
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="mt-2 text-[11px] font-semibold text-saffron underline underline-offset-2"
                >
                    {showFilters ? 'Filters band karo ▲' : 'Filters dikhao ▼'}
                </button>

                {/* Filter chips */}
                {showFilters && (
                    <div className="mt-3 space-y-3 animate-in fade-in">
                        {/* Subject filter */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Subject</p>
                            <div className="flex flex-wrap gap-1.5">
                                {POPULAR_SUBJECTS.map((s) => (
                                    <FilterChip
                                        key={s}
                                        label={s}
                                        active={selectedSubject === s}
                                        onClick={() => setSelectedSubject(selectedSubject === s ? undefined : s)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Class filter */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Class</p>
                            <div className="flex flex-wrap gap-1.5">
                                {CLASS_OPTIONS.map((c) => (
                                    <FilterChip
                                        key={c}
                                        label={c}
                                        active={selectedClass === c}
                                        onClick={() => setSelectedClass(selectedClass === c ? undefined : c)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Medium filter */}
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Medium</p>
                            <div className="flex flex-wrap gap-1.5">
                                {MEDIUM_OPTIONS.map((m) => (
                                    <FilterChip
                                        key={m}
                                        label={m}
                                        active={selectedMedium === m}
                                        onClick={() => setSelectedMedium(selectedMedium === m ? undefined : m)}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Toggles */}
                        <div className="flex gap-2">
                            <FilterChip
                                label="🏠 Home Tuition"
                                active={homeTuition}
                                onClick={() => setHomeTuition(!homeTuition)}
                            />
                            <FilterChip
                                label="💻 Online"
                                active={onlineTuition}
                                onClick={() => setOnlineTuition(!onlineTuition)}
                            />
                        </div>
                    </div>
                )}
            </header>

            {/* Results */}
            <section className="flex-1 px-4 py-5 pb-20">
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-3 border-saffron border-t-transparent" />
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading && searched && teachers.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-4xl mb-3">🔍</p>
                        <p className="text-sm font-semibold text-ink mb-1">Is area mein abhi teachers nahi hain</p>
                        <p className="text-xs text-muted">Kya aap ek teacher hain? Free mein profile banayein.</p>
                        <Link
                            to="/profile/setup"
                            className="mt-4 inline-block rounded-xl bg-saffron px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
                        >
                            Profile Banayein
                        </Link>
                    </div>
                )}

                {!loading && teachers.length > 0 && (
                    <>
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {teachers.length} teacher{teachers.length > 1 ? 's' : ''} in {city}
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {teachers.map((t) => (
                                <TeacherCard key={t.id} teacher={t} />
                            ))}
                        </div>
                    </>
                )}

                {!searched && !loading && (
                    <div className="text-center py-12">
                        <p className="text-4xl mb-3">🎓</p>
                        <p className="text-sm font-semibold text-ink mb-1">{t('search.initialTitle')}</p>
                        <p className="text-xs text-muted mb-5">{t('search.initialSubtitle2', 'Ya neeche se jaldi search karein')}</p>

                        {/* Quick pill buttons */}
                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedSubject('Mathematics')
                                    setCity(city || 'Gonda')
                                    setSearched(true)
                                    handleSearch()
                                }}
                                className="rounded-full border border-[#1B8A3E] bg-[#E8F5E9] px-4 py-2 text-xs font-semibold text-[#1B8A3E]"
                            >
                                {t('search.quick.maths', '📐 Maths Teacher')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedClass('Class 10')
                                    setCity(city || 'Gonda')
                                    setSearched(true)
                                    handleSearch()
                                }}
                                className="rounded-full border border-[#1B8A3E] bg-[#E8F5E9] px-4 py-2 text-xs font-semibold text-[#1B8A3E]"
                            >
                                {t('search.quick.class10', '🏫 Class 10')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if ('geolocation' in navigator) {
                                        navigator.geolocation.getCurrentPosition(
                                            () => {
                                                // For now, set a default city since we don't have geocoding
                                                setCity('Gonda')
                                                setSearched(true)
                                                handleSearch()
                                            },
                                            () => {
                                                setCity('Gonda')
                                                setSearched(true)
                                                handleSearch()
                                            }
                                        )
                                    } else {
                                        setCity('Gonda')
                                        setSearched(true)
                                        handleSearch()
                                    }
                                }}
                                className="rounded-full border border-[#1B8A3E] bg-[#E8F5E9] px-4 py-2 text-xs font-semibold text-[#1B8A3E]"
                            >
                                {t('search.quick.nearMe', '📍 Near Me')}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    )
}
