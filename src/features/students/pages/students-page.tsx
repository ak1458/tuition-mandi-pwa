import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { createStudent, listStudents } from '@/features/students/services/students-service'
import type { Student } from '@/types/domain'
import { Icon, IconButton, PageHeader, PersonAvatar, PrimaryButton } from '@/components/common/takhti-ui'
import { useTakhtiCopy } from '@/i18n/takhti-copy'

export function StudentsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const copy = useTakhtiCopy()
  const teacherId = session?.user.id ?? ''

  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fullName, setFullName] = useState('')
  const [classLabel, setClassLabel] = useState('')
  const [subject, setSubject] = useState('')
  const [monthlyFee, setMonthlyFee] = useState('')
  const [guardianPhone, setGuardianPhone] = useState('')

  const loadStudents = useCallback(async () => {
    if (!teacherId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const data = await listStudents(teacherId)
      setStudents(data)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Students load failed')
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    loadStudents().catch(() => {})
  }, [loadStudents])

  const onCreateStudent = async (event: FormEvent) => {
    event.preventDefault()
    if (!teacherId || !fullName.trim()) return

    setIsSubmitting(true)
    setErrorMessage('')
    try {
      await createStudent({
        teacherId,
        fullName: fullName.trim(),
        classLabel: classLabel.trim(),
        subject: subject.trim(),
        monthlyFee: Number(monthlyFee) || 0,
        guardianPhone: guardianPhone.trim(),
      })
      setFullName('')
      setClassLabel('')
      setSubject('')
      setMonthlyFee('')
      setGuardianPhone('')
      setShowForm(false)
      await loadStudents()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Student create failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = searchQuery
    ? students.filter(
        (student) =>
          student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.class_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.subject.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : students

  return (
    <div className="min-h-full bg-[#fbf8f1] pb-28">
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        right={
          <IconButton className="h-9 w-9" label="Add student" onClick={() => setShowForm((value) => !value)}>
            <Icon className="h-4 w-4 text-[#0d7b51]" name="plus" />
          </IconButton>
        }
        subtitle={`${filtered.length || students.length} students`}
        title={copy.students.title}
      />

      <section className="px-4 py-4">
        <div className="rounded-2xl border border-[#eadfcd] bg-white p-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Icon className="ml-2 h-5 w-5 text-[#82786d]" name="search" />
            <input
              className="min-w-0 flex-1 bg-transparent py-3 text-sm font-semibold outline-none placeholder:text-[#9a8f83]"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={copy.students.search}
              value={searchQuery}
            />
          </div>
        </div>

        {errorMessage && <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#d84b3f]">{errorMessage}</p>}

        {showForm && (
          <form className="mt-4 space-y-2 rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_30px_rgba(53,38,22,0.07)]" onSubmit={onCreateStudent}>
            <p className="text-[13px] font-black text-[#1d1813]">{copy.students.add}</p>
            <input className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]" onChange={(event) => setFullName(event.target.value)} placeholder={copy.students.name} required value={fullName} />
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]" onChange={(event) => setClassLabel(event.target.value)} placeholder={copy.students.class} value={classLabel} />
              <input className="rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]" onChange={(event) => setSubject(event.target.value)} placeholder={copy.students.subject} value={subject} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]" inputMode="numeric" onChange={(event) => setMonthlyFee(event.target.value)} placeholder={copy.students.monthlyFee} value={monthlyFee} />
              <input className="rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]" inputMode="tel" onChange={(event) => setGuardianPhone(event.target.value)} placeholder={copy.students.parentPhone} value={guardianPhone} />
            </div>
            <PrimaryButton disabled={isSubmitting} type="submit">
              {isSubmitting ? copy.students.saving : copy.students.save}
            </PrimaryButton>
          </form>
        )}

        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="rounded-[18px] border border-[#eee4d8] bg-white p-4 text-sm font-bold text-[#746a60]">{copy.students.loading}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[18px] border border-[#eee4d8] bg-white p-6 text-center text-sm font-bold text-[#746a60]">
              {searchQuery ? copy.students.noResult : copy.students.empty}
            </div>
          ) : (
            filtered.map((student, index) => (
              <article className="flex items-center gap-3 rounded-[18px] border border-[#eee4d8] bg-white p-3 shadow-sm" key={student.id}>
                <PersonAvatar name={student.full_name} size="sm" variant={index % 2 ? 'female' : 'student'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-black text-[#1d1813]">{student.full_name}</p>
                  <p className="truncate text-[11px] font-semibold text-[#746a60]">{student.class_label} - {student.subject}</p>
                </div>
                <span className="rounded-full bg-[#eaf7ef] px-2.5 py-1 text-[10px] font-black text-[#0d7b51]">
                  {copy.common.present}
                </span>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-16 z-30 mx-auto max-w-[480px] bg-gradient-to-t from-[#fbf8f1] to-transparent px-4 py-3">
        <button className="w-full rounded-xl bg-[#4930a8] py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)]" onClick={() => setShowForm(true)} type="button">
          {copy.students.add}
        </button>
      </div>
    </div>
  )
}
