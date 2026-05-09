import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { searchTeachers } from '@/lib/queries/teachers'
import { buildWhatsAppLink } from '@/utils/whatsapp'
import type { ParentRating, SearchFilters, TeacherProfile } from '@/types/marketplace'
import { useTakhtiCopy } from '@/i18n/takhti-copy'
import {
  Chip,
  Icon,
  IconButton,
  PageHeader,
  PageShell,
  PersonAvatar,
  TakhtiLogo,
  cx,
} from '@/components/common/takhti-ui'

const QUICK_SEARCHES = [
  { label: 'Class 10 Maths', subject: 'Maths', classLevel: 'Class 10' },
  { label: 'Class 9 Science', subject: 'Science', classLevel: 'Class 9' },
  { label: 'English Speaking', subject: 'English', classLevel: undefined },
  { label: 'Home Tuition', subject: undefined, classLevel: undefined, homeTuition: true },
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
  index,
  profileLabel,
  noPhoneLabel,
}: {
  teacher: TeacherProfile
  index: number
  profileLabel: string
  noPhoneLabel: string
}) {
  const rating = avgRating(teacher.parent_ratings)
  const ratingCount = teacher.parent_ratings?.length ?? 0
  const profileUrl = `${window.location.origin}/profile/${teacher.id}`
  const whatsappUrl = buildWhatsAppLink(teacher.phone_e164, teacher.full_name, profileUrl)
  const distance = ['1.2 km away', '1.5 km away', '1.8 km away', '2.1 km away'][index % 4]

  return (
    <article className="rounded-[18px] border border-[#eee4d8] bg-white p-3 shadow-[0_10px_24px_rgba(53,38,22,0.06)]">
      <div className="flex items-start gap-3">
        <PersonAvatar name={teacher.full_name} size="sm" variant={teacherVariant(teacher.full_name)} />
        <Link className="min-w-0 flex-1" to={`/profile/${teacher.id}`}>
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-[13px] font-extrabold text-[#1d1813]">{teacher.full_name}</h2>
            {teacher.is_verified && <span className="grid h-4 w-4 place-items-center rounded-full bg-[#0d7b51] text-white"><Icon className="h-2.5 w-2.5" name="check" /></span>}
          </div>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-[#5d544c]">
            {teacher.subjects.slice(0, 2).join(' + ')} - {teacher.classes_taught.slice(0, 2).join(', ')}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-[#5d544c]">
            <span className="inline-flex items-center gap-1 text-[#e4a01f]">
              <Icon className="h-3.5 w-3.5 fill-current" name="star" />
              {rating > 0 ? rating.toFixed(1) : 'New'} {ratingCount > 0 && `(${ratingCount})`}
            </span>
            <span className="text-[#9a8f83]">-</span>
            <span>{distance}</span>
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
  const copy = useTakhtiCopy()
  const [query, setQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string | undefined>()
  const [selectedClass, setSelectedClass] = useState<string | undefined>()
  const [homeTuition, setHomeTuition] = useState(false)
  const [teachers, setTeachers] = useState<TeacherProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const loadTeachers = useCallback(
    async (overrides?: Partial<SearchFilters> & { markSearched?: boolean }) => {
      const rawArea = query.trim() || 'Gonda Civil Lines'
      const city = /lucknow/i.test(rawArea) ? 'Lucknow' : 'Gonda'
      const filters: SearchFilters = {
        city,
        subject: overrides?.subject ?? selectedSubject,
        class_level: overrides?.class_level ?? selectedClass,
        home_tuition: overrides?.home_tuition ?? (homeTuition || undefined),
      }

      setLoading(true)
      setError('')
      if (overrides?.markSearched) setSearched(true)

      try {
        const results = await searchTeachers(filters)
        setTeachers(results)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search mein dikkat aayi.')
      } finally {
        setLoading(false)
      }
    },
    [homeTuition, query, selectedClass, selectedSubject],
  )

  useEffect(() => {
    let ignore = false
    setLoading(true)
    searchTeachers({ city: 'Gonda' })
      .then((results) => {
        if (!ignore) setTeachers(results)
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : 'Search mein dikkat aayi.')
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
    setSearched(true)
    loadTeachers({ markSearched: true }).catch(() => {})
  }

  const onQuick = (item: (typeof QUICK_SEARCHES)[number]) => {
    setQuery('Gonda, Civil Lines')
    setSelectedSubject(item.subject)
    setSelectedClass(item.classLevel)
    setHomeTuition(Boolean(item.homeTuition))
    setSearched(true)
    loadTeachers({
      subject: item.subject,
      class_level: item.classLevel,
      home_tuition: item.homeTuition,
      markSearched: true,
    }).catch(() => {})
  }

  const title = searched && selectedSubject ? copy.search.resultTitle.replace('{{subject}}', selectedSubject) : copy.search.nearby

  return (
    <PageShell>
      <PageHeader
        left={
          <IconButton className="h-9 w-9 border-transparent bg-transparent shadow-none" label="Back" onClick={() => navigate('/')}>
            <Icon name="arrow-left" />
          </IconButton>
        }
        right={
          <IconButton className="h-9 w-9" label="Notifications">
            <Icon className="h-4 w-4" name="bell" />
          </IconButton>
        }
        subtitle={copy.search.subtitle}
        title={copy.search.title}
      />

      <section className="px-4 pb-24 pt-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <TakhtiLogo compact />
          <button
            className="inline-flex items-center gap-1 rounded-full border border-[#eadfcd] bg-white px-3 py-2 text-[12px] font-extrabold text-[#0d7b51]"
            onClick={() => navigate('/login')}
            type="button"
          >
            {copy.search.teacherCta}
          </button>
        </div>

        <h1 className="text-[22px] font-black leading-tight text-[#1d1813]">
          {copy.search.question}
        </h1>

        <form className="mt-4 rounded-2xl border border-[#eadfcd] bg-white p-2 shadow-[0_12px_24px_rgba(53,38,22,0.05)]" onSubmit={onSearch}>
          <div className="flex items-center gap-2">
            <Icon className="ml-2 h-5 w-5 text-[#82786d]" name="search" />
            <input
              className="min-w-0 flex-1 bg-transparent py-3 text-[14px] font-semibold text-[#1d1813] outline-none placeholder:text-[#9a8f83]"
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search.placeholder}
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
                className={cx(
                  'rounded-xl px-3 py-2 text-[12px] font-extrabold',
                  selectedSubject === item.subject && selectedClass === item.classLevel
                    ? 'bg-[#4930a8] text-white'
                    : 'bg-[#f7f3ff] text-[#4930a8]',
                )}
                key={item.label}
                onClick={() => onQuick(item)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-black text-[#1d1813]">{title}</h2>
            <p className="mt-0.5 text-[11px] font-semibold text-[#746a60]">
              {copy.search.resultSubtitle}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className={cx(
                'inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-[12px] font-extrabold',
                homeTuition ? 'border-[#ccebdd] bg-[#eaf7ef] text-[#0d7b51]' : 'border-[#eadfcd] bg-white text-[#5d544c]',
              )}
              onClick={() => {
                const next = !homeTuition
                setHomeTuition(next)
                setSearched(true)
                loadTeachers({ home_tuition: next || undefined, markSearched: true }).catch(() => {})
              }}
              type="button"
            >
              <Icon className="h-4 w-4" name="filter" />
              {copy.search.filter}
            </button>
            <button className="inline-flex items-center gap-1 rounded-xl border border-[#eadfcd] bg-white px-3 py-2 text-[12px] font-extrabold text-[#5d544c]" type="button">
              <Icon className="h-4 w-4" name="sort" />
              {copy.search.sort}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {selectedSubject && <Chip active>{selectedSubject}</Chip>}
          {selectedClass && <Chip active>{selectedClass}</Chip>}
          {homeTuition && <Chip active>{copy.search.homeTuition}</Chip>}
          {!selectedSubject && !selectedClass && !homeTuition && <Chip>{copy.search.trusted}</Chip>}
        </div>

        {error && <p className="mt-4 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#d84b3f]">{error}</p>}

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="rounded-[18px] border border-[#eee4d8] bg-white p-5 text-sm font-bold text-[#746a60]">
              {copy.search.loading}
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
            teachers.map((teacher, index) => (
              <TeacherResultCard index={index} key={teacher.id} noPhoneLabel={copy.search.noPhone} profileLabel={copy.search.profile} teacher={teacher} />
            ))
          )}
        </div>
      </section>
    </PageShell>
  )
}
