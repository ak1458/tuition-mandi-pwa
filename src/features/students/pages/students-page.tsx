import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import {
  listStudents,
  createStudent,
} from '@/features/students/services/students-service'
import type { Student } from '@/types/domain'
import { getAvatarColor } from '@/styles/design-tokens'

export function StudentsPage() {
  const { session } = useAuth()
  const teacherId = session?.user.id ?? ''

  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Form state
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
      setErrorMessage(
        error instanceof Error ? error.message : 'Students load failed'
      )
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    loadStudents().catch(() => {})
  }, [loadStudents])

  const onCreateStudent = async (e: FormEvent) => {
    e.preventDefault()
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
      setErrorMessage(
        error instanceof Error ? error.message : 'Student create failed'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = searchQuery
    ? students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.class_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-[#F5F5F5] px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1A1A1A]">Students</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="p-2"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#757575"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="p-2"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1B8A3E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#E0E0E0] bg-white px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-[#9E9E9E] outline-none focus:border-[#1B8A3E] focus:ring-1 focus:ring-[#1B8A3E]"
            />
          </div>
        )}
      </div>

      {/* ── Error message ── */}
      {errorMessage && (
        <div className="mx-4 mb-3 rounded-xl bg-[#FFEBEE] px-4 py-2 text-sm text-[#E53935]">
          {errorMessage}
        </div>
      )}

      {/* ── Create Student Form ── */}
      {showForm && (
        <div className="mx-4 mb-3 rounded-xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-[#757575] uppercase mb-3">
            Naya Student Jodein
          </p>
          <form className="grid gap-2" onSubmit={onCreateStudent}>
            <input
              type="text"
              placeholder="Student ka naam"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm outline-none focus:border-[#1B8A3E]"
              required
            />
            <input
              type="text"
              placeholder="Class (e.g. Class 8)"
              value={classLabel}
              onChange={(e) => setClassLabel(e.target.value)}
              className="rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm outline-none focus:border-[#1B8A3E]"
            />
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm outline-none focus:border-[#1B8A3E]"
            />
            <input
              type="number"
              placeholder="Monthly fee"
              value={monthlyFee}
              onChange={(e) => setMonthlyFee(e.target.value)}
              className="rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm outline-none focus:border-[#1B8A3E]"
            />
            <input
              type="tel"
              placeholder="Guardian phone (optional)"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              className="rounded-lg border border-[#E0E0E0] px-3 py-2 text-sm outline-none focus:border-[#1B8A3E]"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1B8A3E] text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      )}

      {/* ── Student List ── */}
      <div className="flex-1 px-4 space-y-2 pb-24">
        {isLoading ? (
          <div className="rounded-xl bg-white p-4 text-sm text-[#757575]">
            Loading students...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-center text-sm text-[#757575]">
            {searchQuery
              ? 'Koi student nahi mila.'
              : 'Abhi koi student nahi hai. Upar + button se jodein.'}
          </div>
        ) : (
          filtered.map((student, index) => {
            const initial = student.full_name.charAt(0).toUpperCase()
            const bgColor = getAvatarColor(index)

            return (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
                  style={{ backgroundColor: bgColor }}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                    {student.full_name}
                  </p>
                  <p className="text-xs text-[#757575] truncate">
                    {student.class_label} • {student.subject}
                  </p>
                </div>
                <p className="text-xs text-[#757575] shrink-0">
                  ₹{student.monthly_fee} / month
                </p>
              </div>
            )
          })
        )}
      </div>

      {/* ── Fixed bottom button ── */}
      <div className="fixed bottom-16 inset-x-0 px-4 py-3 bg-gradient-to-t from-[#F5F5F5] to-transparent z-30">
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="bg-[#1B8A3E] text-white rounded-xl py-3 w-full font-semibold text-sm active:bg-[#15732F]"
        >
          + Student Jodein
        </button>
      </div>
    </div>
  )
}
