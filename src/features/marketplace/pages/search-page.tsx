import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { searchTeachersWithAi } from '@/features/marketplace/services/ai-search-service'
import { buildWhatsAppLink } from '@/utils/whatsapp'
import type { ParentRating, TeacherProfile } from '@/types/marketplace'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'
import { useAuth } from '@/app/providers/auth-provider'
import { NotificationsBell, NotificationsPanel } from '@/components/common/notifications-panel'
import {
  Icon,
  IconButton,
  PageHeader,
  PageShell,
  PersonAvatar,
  TuitionMandiLogo,
} from '@/components/common/tuition-mandi-ui'

const QUICK_SEARCHES = [
  { label: 'Class 10 Maths', queryText: 'Class 10 Mathematics Gonda' },
  { label: 'Class 9 Science', queryText: 'Class 9 Science Civil Lines' },
  { label: 'English Speaking', queryText: 'English Speaking Course' },
  { label: 'Home Tuition', queryText: 'Home Tuition near me' },
]

function avgRating(ratings: ParentRating[] | undefined): number {
  if (!ratings?.length) return 0
  return ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
}

function teacherVariant(name: string) {
  return /anjali|neha|priyanka/i.test(name) ? 'female' : 'male'
}

function TeacherResultCard({
  teacher,
  profileLabel,
  noPhoneLabel,
}: {
  teacher: TeacherProfile
  profileLabel: string
  noPhoneLabel: string
}) {
  const rating = avgRating(teacher.parent_ratings)
  const ratingCount = teacher.parent_ratings?.length ?? 0
  const profileUrl = `${window.location.origin}/profile/${teacher.id}`
  const whatsappUrl = buildWhatsAppLink(teacher.phone_e164, teacher.full_name, profileUrl)

  return (
    <article className="rounded-[18px] border border-[#eee4d8] bg-white p-3 shadow-[0_10px_24px_rgba(53,38,22,0.06)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(53,38,22,0.1)]">
      <div className="flex items-start gap-3">
        <PersonAvatar name={teacher.full_name} size="sm" variant={teacherVariant(teacher.full_name)} />
        <Link className="min-w-0 flex-1" to={`/profile/${teacher.id}`}>
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-[13px] font-extrabold text-[#1d1813]">{teacher.full_name}</h2>
            {teacher.is_verified && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-[#0d7b51] text-white">
                <Icon className="h-2.5 w-2.5" name="check" />
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-[#5d544c]">
            {teacher.subjects.slice(0, 2).join(' + ')} - {teacher.classes_taught.slice(0, 2).join(', ')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#5d544c]">
            <span className="inline-flex items-center gap-1 text-[#e4a01f]">
              <Icon className="h-3.5 w-3.5 fill-current" name="star" />
              {rating > 0 ? rating.toFixed(1) : 'New'} {ratingCount > 0 && `(${ratingCount})`}
            </span>
            {teacher.area_mohalla && (
              <>
                <span className="text-[#9a8f83]">-</span>
                <span className="truncate text-[#746a60] max-w-[120px]">{teacher.area_mohalla}</span>
              </>
            )}
          </div>
        </Link>
        <IconButton className="h-9 w-9 border-transparent shadow-none" label="Save teacher">
          <Icon className="h-5 w-5 text-[#4930a8]" name="heart" />
        </IconButton>
      </div>
      <div className="mt-3 flex gap-2">
        <Link
          className="flex-1 rounded-xl border border-[#ded1f7] bg-[#f7f3ff] px-3 py-2 text-center text-[12px] font-extrabold text-[#4930a8]"
          to={`/profile/${teacher.id}`}
        >
          {profileLabel}
        </Link>
        {whatsappUrl ? (
          <a
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#0d7b51] px-3 py-2 text-[12px] font-extrabold text-white"
            href={whatsappUrl}
            rel="noreferrer"
            target="_blank"
          >
            <Icon className="h-4 w-4" name="whatsapp" />
            WhatsApp
          </a>
        ) : (
          <span className="flex-1 rounded-xl bg-[#f4eee5] px-3 py-2 text-center text-[12px] font-extrabold text-[#9a8f83]">
            {noPhoneLabel}
          </span>
        )}
      </div>
    </article>
  )
}

export function SearchPage() {
  const navigate = useNavigate()
  const copy = useTuitionMandiCopy()
  const { session } = useAuth()
  const userId = session?.user.id ?? 'parent'

  const [query, setQuery] = useState('')
  const [teachers, setTeachers] = useState<TeacherProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [aiResponseText, setAiResponseText] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isFallback, setIsFallback] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const loadTeachers = useCallback(async (textToSearch: string) => {
    setLoading(true)
    setError('')
    setSearched(true)

    try {
      const result = await searchTeachersWithAi(textToSearch)
      setTeachers(result.teachers)
      setAiResponseText(result.responseText)
      setSuggestions(result.suggestions)
      setIsFallback(result.isFallback)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Search karne mein thodi dikkat aayi. Kripya network connection check karke dobara try karein.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    searchTeachersWithAi('')
      .then((result) => {
        if (!ignore) {
          setTeachers(result.teachers)
          setAiResponseText('')
          setSuggestions(result.suggestions)
          setIsFallback(false)
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(
            err instanceof Error ? err.message : 'Tutors list dhoondhne mein dikkat aayi.',
          )
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  const onSearch = (event: FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return
    loadTeachers(query).catch(() => {})
  }

  const onQuick = (queryText: string) => {
    setQuery(queryText)
    loadTeachers(queryText).catch(() => {})
  }

  const title = searched ? 'Searched Teachers' : copy.search.nearby

  return (
    <PageShell>
      <PageHeader
        left={
          <IconButton className="h-9 w-9 border-transparent bg-transparent shadow-none" label="Back" onClick={() => navigate('/')}>
            <Icon name="arrow-left" />
          </IconButton>
        }
        right={<NotificationsBell userId={userId} onOpen={() => setShowNotifications(true)} />}
        subtitle={copy.search.subtitle}
        title={copy.search.title}
      />

      <NotificationsPanel
        onClose={() => setShowNotifications(false)}
        open={showNotifications}
        userId={userId}
      />

      <section className="px-4 pb-24 pt-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <TuitionMandiLogo compact />
          <button
            className="inline-flex items-center gap-1 rounded-full border border-[#eadfcd] bg-white px-3 py-2 text-[12px] font-extrabold text-[#0d7b51]"
            onClick={() => navigate('/login')}
            type="button"
          >
            {copy.search.teacherCta}
          </button>
        </div>

        <h1 className="text-[22px] font-black leading-tight text-[#1d1813]">
          Aapko kaunsa tutor chahiye?
        </h1>

        <form className="mt-4 rounded-2xl border border-[#eadfcd] bg-white p-2 shadow-[0_12px_24px_rgba(53,38,22,0.05)]" onSubmit={onSearch}>
          <div className="flex items-center gap-2">
            <Icon className="ml-2 h-5 w-5 text-[#82786d]" name="search" />
            <input
              className="min-w-0 flex-1 bg-transparent py-3 text-[14px] font-semibold text-[#1d1813] outline-none placeholder:text-[#9a8f83]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. Class 10 Maths tutor near Civil Lines"
              value={query}
            />
            <IconButton className="h-10 w-10 border-transparent bg-[#fbf8f1] shadow-none" label="Voice search">
              <Icon className="h-4 w-4 text-[#4930a8]" name="mic" />
            </IconButton>
          </div>
        </form>

        <div className="mt-5">
          <p className="text-[12px] font-black text-[#1d1813]">{copy.search.popular}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_SEARCHES.map((item) => (
              <button
                className="rounded-xl bg-[#f7f3ff] px-3 py-2 text-[12px] font-extrabold text-[#4930a8] transition-all hover:bg-[#4930a8] hover:text-white"
                key={item.label}
                onClick={() => onQuick(item.queryText)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Assistant response card */}
        {searched && !loading && (aiResponseText || isFallback) && (
          <div className="mt-6 rounded-[22px] border border-[#d9eee2] bg-gradient-to-br from-[#f4fbf6] to-[#eaf7ef] p-4 shadow-[0_12px_28px_rgba(13,123,81,0.06)] animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-[#0d7b51] text-white">
                <Icon className="h-4 w-4" name="star" />
              </span>
              <h3 className="text-[13px] font-black text-[#0d7b51]">TuitionMandi AI Assistant</h3>
              {isFallback && (
                <span className="rounded-full bg-[#c87b22]/10 px-2 py-0.5 text-[9px] font-black text-[#c87b22]">
                  Suggested recommendations
                </span>
              )}
            </div>
            <p className="mt-3 text-[12.5px] font-bold leading-relaxed text-[#235840]">
              {aiResponseText}
            </p>
            {suggestions.length > 0 && (
              <div className="mt-4 border-t border-[#d2eadb]/50 pt-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-[#528f73]">Try related searches:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestions.map((item) => (
                    <button
                      className="rounded-lg bg-white/70 px-2.5 py-1 text-[11px] font-black text-[#235840] border border-[#d2eadb] hover:bg-white"
                      key={item}
                      onClick={() => onQuick(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-black text-[#1d1813]">{title}</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-[#746a60]">
              {copy.search.resultSubtitle}
            </p>
          </div>
        </div>

        {/* Dynamic premium error boundary */}
        {error && (
          <div className="mt-6 rounded-[22px] border border-[#ffd5cc] bg-[#fff3f0] p-5 text-center shadow-[0_12px_24px_rgba(216,75,63,0.06)] animate-in fade-in duration-300">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#ffd5cc] text-[#d84b3f] shadow-sm">
              <Icon className="h-6 w-6" name="report" />
            </span>
            <h3 className="mt-4 text-[14px] font-black text-[#1d1813]">Aapka offline status / issue lag raha hai</h3>
            <p className="mt-2 text-[12px] font-bold leading-5 text-[#746a60]">{error}</p>
            <button
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d84b3f] px-6 py-3 text-sm font-black text-white hover:bg-[#c23f33] active:scale-[0.98] transition-all shadow-[0_8px_16px_rgba(216,75,63,0.2)]"
              onClick={() => loadTeachers(query || 'Mathematics')}
              type="button"
            >
              <Icon className="h-4 w-4" name="sort" />
              Try Again
            </button>
          </div>
        )}

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-[18px] border border-[#eee4d8] bg-white p-5 text-sm font-bold text-[#746a60] animate-pulse">
              Matching tutors dhoondh rahe hain...
            </div>
          ) : teachers.length === 0 ? (
            <div className="rounded-[18px] border border-[#eee4d8] bg-white p-5 text-center">
              <p className="text-sm font-black text-[#1d1813]">{copy.search.emptyTitle}</p>
              <p className="mt-1 text-xs font-semibold text-[#746a60]">{copy.search.emptySubtitle}</p>
              <button
                className="mt-4 rounded-xl bg-[#0d7b51] px-5 py-3 text-sm font-bold text-white"
                onClick={() => navigate('/profile/setup')}
                type="button"
              >
                {copy.search.createProfile}
              </button>
            </div>
          ) : (
            teachers.map((teacher) => (
              <TeacherResultCard
                key={teacher.id}
                noPhoneLabel={copy.search.noPhone}
                profileLabel={copy.search.profile}
                teacher={teacher}
              />
            ))
          )}
        </div>
      </section>
    </PageShell>
  )
}
