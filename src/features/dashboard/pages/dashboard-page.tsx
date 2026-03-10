import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { UpgradeModal } from '@/components/common/upgrade-modal'
import { BoostProfileCard } from '@/components/marketplace/boost-profile-card'
import { createBatch, listBatches } from '@/features/batches/services/batches-service'
import { getDashboardSummary } from '@/features/dashboard/services/dashboard-service'
import { assignStudentToBatch, createStudent, listStudents } from '@/features/students/services/students-service'
import { usePlan } from '@/hooks/use-plan'
import { useStudentCount } from '@/hooks/use-student-count'
import { isLocalMode } from '@/lib/env'
import type { UpgradeReason } from '@/types/plan'
import type { Batch, DashboardSummary, Student } from '@/types/domain'

const defaultSummary: DashboardSummary = {
  teacher_id: '',
  month_start: new Date().toISOString().slice(0, 10),
  total_students: 0,
  present_today: 0,
  fees_collected: 0,
  fee_pending_count: 0,
}
const FREE_PLAN_STUDENT_LIMIT = 15

interface BatchFormState {
  name: string
  classLabel: string
  subject: string
}

interface StudentFormState {
  fullName: string
  classLabel: string
  subject: string
  monthlyFee: string
  guardianPhone: string
  batchId: string
}

export function DashboardPage() {
  const { session } = useAuth()
  const { isFree, isPro, isLoading: isPlanLoading, refreshPlan } = usePlan()
  const teacherId = session?.user.id ?? ''
  const { count: studentCount, refresh: refreshStudentCount } = useStudentCount(teacherId)

  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary)
  const [batches, setBatches] = useState<Batch[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason | null>(null)
  const [batchForm, setBatchForm] = useState<BatchFormState>({
    name: '',
    classLabel: '',
    subject: '',
  })
  const [studentForm, setStudentForm] = useState<StudentFormState>({
    fullName: '',
    classLabel: '',
    subject: '',
    monthlyFee: '',
    guardianPhone: '',
    batchId: '',
  })

  const summaryCards = useMemo(
    () => [
      { label: 'Total Students', value: summary.total_students, tone: 'bg-ink text-white' },
      { label: 'Present Today', value: summary.present_today, tone: 'bg-sage text-white' },
      { label: 'Fees Collected', value: `Rs ${summary.fees_collected}`, tone: 'bg-saffron text-white' },
      { label: 'Fee Pending', value: summary.fee_pending_count, tone: 'bg-rose text-white' },
    ],
    [summary],
  )

  const loadDashboard = useCallback(async () => {
    if (!teacherId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const [summaryResult, batchesResult, studentsResult] = await Promise.all([
        getDashboardSummary(teacherId),
        listBatches(teacherId),
        listStudents(teacherId),
      ])

      setSummary(summaryResult)
      setBatches(batchesResult)
      setStudents(studentsResult)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Dashboard load failed')
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    loadDashboard().catch(() => { })
  }, [loadDashboard])

  const onCreateBatch = async (event: FormEvent) => {
    event.preventDefault()
    if (!teacherId) return
    setIsSubmitting(true)
    setErrorMessage('')

    try {
      await createBatch({
        teacherId,
        name: batchForm.name.trim(),
        classLabel: batchForm.classLabel.trim(),
        subject: batchForm.subject.trim(),
      })

      setBatchForm({ name: '', classLabel: '', subject: '' })
      await loadDashboard()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Batch create failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onCreateStudent = async (event: FormEvent) => {
    event.preventDefault()
    if (!teacherId) return

    if (isFree && studentCount >= FREE_PLAN_STUDENT_LIMIT) {
      setUpgradeReason('student_limit')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const created = await createStudent({
        teacherId,
        fullName: studentForm.fullName.trim(),
        classLabel: studentForm.classLabel.trim(),
        subject: studentForm.subject.trim(),
        monthlyFee: Number(studentForm.monthlyFee || '0'),
        guardianPhone: studentForm.guardianPhone.trim(),
      })

      if (studentForm.batchId) {
        await assignStudentToBatch(teacherId, studentForm.batchId, created.id)
      }

      setStudentForm({
        fullName: '',
        classLabel: '',
        subject: '',
        monthlyFee: '',
        guardianPhone: '',
        batchId: '',
      })
      await loadDashboard()
      await refreshStudentCount()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Student create failed'
      if (message.includes('UPGRADE_REQUIRED_STUDENT_LIMIT')) {
        setUpgradeReason('student_limit')
      } else {
        setErrorMessage(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-5 text-sm text-muted">
        Dashboard data load ho raha hai...
      </section>
    )
  }

  return (
    <div className="space-y-4">
      {isLocalMode && (
        <p className="rounded-xl bg-saffron/15 px-3 py-2 text-sm text-ink">
          Local demo mode active. Data local storage me chal raha hai.
        </p>
      )}
      {errorMessage && <p className="rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">{errorMessage}</p>}

      <section className="grid grid-cols-2 gap-3">
        {summaryCards.map((card) => (
          <article className={`rounded-2xl px-4 py-4 ${card.tone}`} key={card.label}>
            <p className="text-xs uppercase tracking-[0.12em] opacity-80">{card.label}</p>
            <p className="mt-2 font-display text-2xl">{card.value}</p>
          </article>
        ))}
      </section>

      {/* Boost Profile Section */}
      <div className="mt-4">
        <BoostProfileCard />
      </div>

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-4 mt-4">
        <p className="text-xs uppercase tracking-[0.16em] text-saffron">Create Batch</p>
        <form className="mt-3 grid gap-2" onSubmit={onCreateBatch}>
          <input
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setBatchForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="Batch name"
            value={batchForm.name}
          />
          <input
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setBatchForm((prev) => ({ ...prev, classLabel: event.target.value }))}
            placeholder="Class label"
            value={batchForm.classLabel}
          />
          <input
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setBatchForm((prev) => ({ ...prev, subject: event.target.value }))}
            placeholder="Subject"
            value={batchForm.subject}
          />
          <button
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            Add Batch
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-saffron">Create Student</p>
        <div className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs text-muted">
          {isPlanLoading
            ? 'Plan check ho raha hai...'
            : isPro
              ? 'Plan: Pro (unlimited students)'
              : `Free plan usage: ${studentCount}/${FREE_PLAN_STUDENT_LIMIT} students`}
        </div>
        <form className="mt-3 grid gap-2" onSubmit={onCreateStudent}>
          <input
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setStudentForm((prev) => ({ ...prev, fullName: event.target.value }))}
            placeholder="Student full name"
            value={studentForm.fullName}
          />
          <input
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setStudentForm((prev) => ({ ...prev, classLabel: event.target.value }))}
            placeholder="Class label"
            value={studentForm.classLabel}
          />
          <input
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setStudentForm((prev) => ({ ...prev, subject: event.target.value }))}
            placeholder="Subject"
            value={studentForm.subject}
          />
          <input
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setStudentForm((prev) => ({ ...prev, monthlyFee: event.target.value }))}
            placeholder="Monthly fee (number)"
            type="number"
            value={studentForm.monthlyFee}
          />
          <input
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setStudentForm((prev) => ({ ...prev, guardianPhone: event.target.value }))}
            placeholder="Guardian phone (optional)"
            value={studentForm.guardianPhone}
          />
          <select
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setStudentForm((prev) => ({ ...prev, batchId: event.target.value }))}
            value={studentForm.batchId}
          >
            <option value="">Assign batch later</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name} - {batch.class_label}
              </option>
            ))}
          </select>
          <button
            className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={isSubmitting || isPlanLoading}
            type="submit"
          >
            Add Student
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-saffron">Batches</p>
        {batches.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No batches yet. Create your first batch above.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-ink">
            {batches.map((batch) => (
              <li className="rounded-xl bg-cream px-3 py-2" key={batch.id}>
                {batch.name} • {batch.class_label} • {batch.subject}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-saffron">Students</p>
        {students.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No students yet. Add students from the form above.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm text-ink">
            {students.map((student) => (
              <li className="rounded-xl bg-cream px-3 py-2" key={student.id}>
                {student.full_name} • {student.class_label} • Rs {student.monthly_fee}
              </li>
            ))}
          </ul>
        )}
      </section>

      {upgradeReason && (
        <UpgradeModal
          onClose={() => setUpgradeReason(null)}
          onUpgradeSuccess={() => {
            refreshPlan().catch(() => { })
            refreshStudentCount().catch(() => { })
            setErrorMessage('Plan successfully upgraded to Pro.')
          }}
          reason={upgradeReason}
        />
      )}
    </div>
  )
}
