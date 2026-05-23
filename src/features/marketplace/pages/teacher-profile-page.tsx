import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { getTeacherPublicProfile, submitInquiry } from '@/lib/queries/teachers'
import { buildWhatsAppLink } from '@/utils/whatsapp'
import { isTeacherSaved, onSavedTeachersChange, toggleSavedTeacher } from '@/lib/saved-teachers'
import type { ParentRating, TeacherOutcome, TeacherProfile } from '@/types/marketplace'
import { useTakhtiCopy } from '@/i18n/takhti-copy'
import {
  Chip,
  Icon,
  IconButton,
  LinkButton,
  PageHeader,
  PageShell,
  PersonAvatar,
  PrimaryButton,
  cx,
} from '@/components/common/takhti-ui'

function avgRating(ratings: ParentRating[] | undefined): number {
  if (!ratings?.length) return 0
  return ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
}

function teacherVariant(name: string) {
  return /anjali|neha|priyanka/i.test(name) ? 'female' : 'male'
}

function reviewAge(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)))
  return days === 1 ? '1 day ago' : `${days} days ago`
}

function resultStats(outcome: TeacherOutcome | undefined, fallbackStudents: number) {
  if (!outcome) {
    return {
      success: fallbackStudents > 0 ? '90%' : 'New',
      students: fallbackStudents > 0 ? `${fallbackStudents}+` : 'New',
      toppers: '3+',
    }
  }

  const success = outcome.total_students
    ? `${Math.round((outcome.students_above_75_percent / outcome.total_students) * 100)}%`
    : 'New'

  return {
    success,
    students: `${outcome.total_students}+`,
    toppers: `${Math.max(outcome.students_above_90_percent, outcome.board_toppers)}+`,
  }
}

export function TeacherProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const copy = useTakhtiCopy()
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [parentName, setParentName] = useState('')
  const [parentPhone, setParentPhone] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState('')
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    setIsSaved(isTeacherSaved(id))
    const unsub = onSavedTeachersChange(() => setIsSaved(isTeacherSaved(id)))
    return () => unsub()
  }, [id])

  useEffect(() => {
    if (!id) return
    let ignore = false

    setLoading(true)
    setError('')
    getTeacherPublicProfile(id)
      .then((data) => {
        if (ignore) return
        setTeacher(data)
        if (data) {
          document.title = `${data.full_name} - ${data.subjects.join(', ')} Teacher in ${data.city} | Takhti`
        }
      })
      .catch((err) => {
        if (!ignore) setError(err instanceof Error ? err.message : 'Profile load nahi ho payi.')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [id])

  const rating = useMemo(() => avgRating(teacher?.parent_ratings), [teacher?.parent_ratings])
  const ratingCount = teacher?.parent_ratings?.length ?? 0
  const outcome = teacher?.teacher_outcomes?.[0]
  const stats = resultStats(outcome, teacher?.total_students_taught ?? 0)
  const profileUrl = teacher ? `${window.location.origin}/profile/${teacher.id}` : ''
  const whatsappUrl = teacher ? buildWhatsAppLink(teacher.phone_e164, teacher.full_name, profileUrl) : null

  const sendInquiry = async (event: FormEvent) => {
    event.preventDefault()
    if (!teacher) return
    setSending(true)
    setFormError('')
    try {
      await submitInquiry({
        teacher_profile_id: teacher.id,
        parent_name: parentName.trim() || undefined,
        parent_phone: parentPhone.trim() || undefined,
        student_class: studentClass,
        subject_needed: subject,
        message,
      })
      setSent(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Inquiry send nahi hui.')
    } finally {
      setSending(false)
    }
  }

  const shareProfile = () => {
    if (!teacher) return
    if (navigator.share) {
      navigator.share({ title: teacher.full_name, text: `${teacher.full_name} on Takhti`, url: profileUrl }).catch(() => {})
      return
    }
    navigator.clipboard.writeText(profileUrl).catch(() => {})
  }

  const onToggleSave = () => {
    if (!teacher) return
    const nowSaved = toggleSavedTeacher(teacher)
    setIsSaved(nowSaved)
  }

  if (loading) {
    return (
      <PageShell>
        <div className="grid min-h-screen place-items-center px-5 text-sm font-bold text-[#746a60]">{copy.profile.loading}</div>
      </PageShell>
    )
  }

  if (error || !teacher) {
    return (
      <PageShell>
        <div className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#fff0ee] text-[#d84b3f]">
            <Icon className="h-8 w-8" name="search" />
          </div>
          <h1 className="mt-5 text-xl font-black text-[#1d1813]">{copy.profile.notFound}</h1>
          <p className="mt-2 text-sm font-semibold text-[#746a60]">{error || copy.profile.notFoundDesc}</p>
          <button className="mt-6 rounded-xl bg-[#4930a8] px-5 py-3 text-sm font-bold text-white" onClick={() => navigate('/search')} type="button">
            {copy.profile.searchTeachers}
          </button>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        right={
          <div className="flex gap-2">
            <IconButton className="h-9 w-9" label="Share profile" onClick={shareProfile}>
              <Icon className="h-4 w-4" name="share" />
            </IconButton>
            <IconButton className="h-9 w-9" label="More options">
              <Icon className="h-4 w-4" name="more" />
            </IconButton>
          </div>
        }
        subtitle={`${teacher.subjects.slice(0, 2).join(' + ')} - ${teacher.area_mohalla || teacher.city}`}
        title={copy.profile.header}
      />

      <section className="px-4 pb-28 pt-4">
        <div className="rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_32px_rgba(53,38,22,0.07)]">
          <div className="flex items-start gap-4">
            <PersonAvatar name={teacher.full_name} size="lg" variant={teacherVariant(teacher.full_name)} />
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-[18px] font-black text-[#1d1813]">{teacher.full_name}</h1>
                {teacher.is_verified && <span className="grid h-5 w-5 place-items-center rounded-full bg-[#0d7b51] text-white"><Icon className="h-3 w-3" name="check" /></span>}
              </div>
              <p className="mt-1 text-[12px] font-semibold text-[#5d544c]">
                {teacher.subjects.join(', ')}
              </p>
              <p className="text-[12px] font-semibold text-[#5d544c]">
                {teacher.classes_taught.join(' & ')} - {teacher.medium}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 text-[12px] font-black text-[#e4a01f]">
                  <Icon className="h-4 w-4" name="star" />
                  {rating > 0 ? rating.toFixed(1) : 'New'} ({ratingCount} Reviews)
                </span>
                <span className="inline-flex items-center gap-1 text-[12px] font-black text-[#5d544c]">
                  <Icon className="h-4 w-4" name="users" />
                  {teacher.total_students_taught}+ Students
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip active>{teacher.experience_years}+ Years Exp.</Chip>
            {teacher.home_tuition && <Chip active>Home Tuition</Chip>}
            {teacher.is_verified && <Chip active>Verified</Chip>}
          </div>
        </div>

        <section className="mt-5">
          <h2 className="text-[13px] font-black text-[#1d1813]">{copy.profile.about}</h2>
          <p className="mt-2 rounded-[18px] border border-[#eee4d8] bg-white p-4 text-[13px] font-semibold leading-6 text-[#4d453d]">
            {teacher.bio || 'Teacher profile details jaldi update honge.'}
          </p>
        </section>

        <section className="mt-5">
          <h2 className="text-[13px] font-black text-[#1d1813]">{copy.profile.results}</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              [copy.profile.successRate, stats.success],
              [copy.profile.studentsTaught, stats.students],
              [copy.profile.topRank, stats.toppers],
            ].map(([label, value]) => (
              <div className="rounded-[16px] border border-[#eee4d8] bg-white p-3 text-center" key={label}>
                <p className="text-[18px] font-black text-[#0d7b51]">{value}</p>
                <p className="mt-1 text-[10px] font-bold text-[#746a60]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-black text-[#1d1813]">{copy.profile.reviews} ({ratingCount})</h2>
            <Link className="text-[12px] font-extrabold text-[#4930a8]" to={`/profile/${teacher.id}/review`}>
              {copy.profile.addReview}
            </Link>
          </div>
          <div className="mt-3 space-y-3">
            {(teacher.parent_ratings ?? []).slice(0, 3).map((review) => (
              <article className="rounded-[18px] border border-[#eee4d8] bg-white p-3" key={review.id}>
                <div className="flex items-start gap-3">
                  <PersonAvatar name={review.parent_name} size="sm" variant="student" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[12px] font-black text-[#1d1813]">{review.parent_name} (Parent)</p>
                      <p className="shrink-0 text-[10px] font-bold text-[#746a60]">{reviewAge(review.created_at)}</p>
                    </div>
                    <div className="mt-1 flex gap-0.5 text-[#e4a01f]">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Icon className="h-3.5 w-3.5" key={index} name="star" />
                      ))}
                    </div>
                    {review.review_text && (
                      <p className="mt-2 text-[12px] font-semibold leading-5 text-[#4d453d]">{review.review_text}</p>
                    )}
                  </div>
                </div>
              </article>
            ))}
            {ratingCount === 0 && (
              <p className="rounded-[18px] border border-[#eee4d8] bg-white p-4 text-center text-sm font-bold text-[#746a60]">
                {copy.profile.noReviews}
              </p>
            )}
          </div>
        </section>

        <section className="mt-5 rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_32px_rgba(53,38,22,0.06)]">
          {sent ? (
            <div className="py-4 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf7ef] text-[#0d7b51]">
                <Icon className="h-7 w-7" name="check" />
              </div>
              <h2 className="mt-4 text-lg font-black text-[#1d1813]">{copy.profile.connected}</h2>
              <p className="mt-2 text-sm font-semibold text-[#5d544c]">
                {copy.profile.connectedNote.replace('{{name}}', teacher.full_name)}
              </p>
              {whatsappUrl && (
                <a className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 py-3 text-sm font-bold text-white" href={whatsappUrl} rel="noreferrer" target="_blank">
                  <Icon className="h-5 w-5" name="whatsapp" />
                  {copy.profile.openWhatsapp}
                </a>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-[15px] font-black text-[#1d1813]">{copy.profile.sendInquiry}</h2>
              <p className="mt-1 text-[12px] font-semibold leading-5 text-[#746a60]">
                {copy.profile.inquiryNote.replace('{{name}}', teacher.full_name)}
              </p>
              <form className="mt-4 space-y-3" onSubmit={sendInquiry}>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className="rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                    onChange={(event) => setStudentClass(event.target.value)}
                    placeholder="Class"
                    value={studentClass}
                  />
                  <input
                    className="rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Subject"
                    value={subject}
                  />
                </div>
                <input
                  className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                  onChange={(event) => setParentName(event.target.value)}
                  placeholder={copy.profile.parentName}
                  value={parentName}
                />
                <input
                  className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                  inputMode="tel"
                  onChange={(event) => setParentPhone(event.target.value)}
                  placeholder={copy.profile.parentPhone}
                  value={parentPhone}
                />
                <textarea
                  className="min-h-[96px] w-full resize-none rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#4930a8]"
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={copy.profile.message}
                  value={message}
                />
                {formError && <p className="rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#d84b3f]">{formError}</p>}
                <PrimaryButton disabled={sending} type="submit">
                  {sending ? copy.profile.sending : copy.profile.sendInquiry}
                </PrimaryButton>
              </form>
            </>
          )}
        </section>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[480px] border-t border-[#eadfcd] bg-white/95 px-4 py-3 backdrop-blur safe-bottom">
        <div className="grid grid-cols-[1fr_0.7fr] gap-2">
          {whatsappUrl ? (
            <LinkButton href={whatsappUrl} rel="noreferrer" target="_blank">
              <Icon className="h-5 w-5" name="whatsapp" />
              WhatsApp
            </LinkButton>
          ) : (
            <button className="rounded-xl bg-[#f4eee5] py-3 text-sm font-bold text-[#9a8f83]" disabled type="button">
              {copy.common.noPhone}
            </button>
          )}
          <button
            className={cx(
              'rounded-xl border py-3 text-sm font-bold',
              isSaved
                ? 'border-[#ded1f7] bg-[#4930a8] text-white'
                : 'border-[#ded1f7] bg-white text-[#4930a8]',
            )}
            onClick={onToggleSave}
            type="button"
          >
            {isSaved ? '★ Saved' : copy.profile.save}
          </button>
        </div>
      </div>
    </PageShell>
  )
}
