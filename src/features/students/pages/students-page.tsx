import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { createStudent, listStudents } from '@/features/students/services/students-service'
import type { Student } from '@/types/domain'
import { Icon } from '@/components/common/tuition-mandi-ui'
import { Avatar, Btn, Card, EmptyState, IconBtn, Pill, TopBar } from '@/components/common/tm-kit'
import { DemoTrialBadge } from '@/components/common/demo-trial-badge'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'
import { countActiveDemoTrials, isInDemoTrial } from '@/lib/demo-trial'

const fieldStyle: React.CSSProperties = {
  width: '100%', border: '1.5px solid var(--line)', background: 'var(--surface-2)', color: 'var(--ink)',
  borderRadius: 'var(--radius-field)', padding: '12px 14px', fontSize: 15, fontWeight: 500,
  fontFamily: 'var(--font-stack-latin)', outline: 'none',
}

export function StudentsPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const copy = useTuitionMandiCopy()
  const teacherId = session?.user.id ?? ''

  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [toast, setToast] = useState<string | null>(null)
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
      const created = await createStudent({
        teacherId,
        fullName: fullName.trim(),
        classLabel: classLabel.trim(),
        subject: subject.trim(),
        monthlyFee: Number(monthlyFee) || 0,
        guardianPhone: guardianPhone.trim(),
      })
      setFullName(''); setClassLabel(''); setSubject(''); setMonthlyFee(''); setGuardianPhone('')
      setShowForm(false)
      setToast(copy.demo.activatedToast.replace('{{name}}', created.full_name))
      window.setTimeout(() => setToast(null), 4000)
      await loadStudents()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Student create failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = searchQuery
    ? students.filter(
        (s) =>
          s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.class_label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.subject.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : students

  const trialCount = countActiveDemoTrials(students)
  const inr = (n: number) => '₹' + (n || 0).toLocaleString('en-IN')

  return (
    <div className="tm-noscroll" style={{ height: '100%', overflowY: 'auto', background: 'var(--paper)' }}>
      <TopBar
        title={copy.students.title}
        subtitle={`${students.length} students`}
        onBack={() => navigate(-1)}
        right={<IconBtn name="plus" label="Add student" active={showForm} onClick={() => setShowForm((v) => !v)} />}
      />

      <div style={{ padding: '12px 18px 110px' }}>
        {trialCount > 0 && (
          <Card pad={13} style={{ marginBottom: 14, background: 'var(--marigold-wash)', border: 'none', display: 'flex', gap: 11 }}>
            <Icon name="star" style={{ width: 20, height: 20, color: 'var(--marigold-deep)', flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>{copy.demo.bannerTitle}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 1 }}>{copy.demo.dashboardHint.replace('{{count}}', String(trialCount))}</div>
            </div>
          </Card>
        )}

        {/* search */}
        <Card pad={4} style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px' }}>
            <Icon name="search" style={{ width: 18, height: 18, color: 'var(--ink-soft)' }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.students.search}
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', fontSize: 15, fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--font-stack-latin)' }}
            />
          </div>
        </Card>

        {errorMessage && (
          <Card pad={12} style={{ marginBottom: 12, background: 'var(--coral-wash)', border: 'none' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--coral-deep)' }}>{errorMessage}</span>
          </Card>
        )}
        {toast && (
          <Card pad={12} style={{ marginBottom: 12, background: 'var(--marigold-wash)', border: 'none' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--marigold-deep)' }}>🎁 {toast}</span>
          </Card>
        )}

        {showForm && (
          <Card pad={15} style={{ marginBottom: 14 }}>
            <form onSubmit={onCreateStudent} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="font-display" style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{copy.students.add}</div>
              <input style={fieldStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={copy.students.name} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input style={fieldStyle} value={classLabel} onChange={(e) => setClassLabel(e.target.value)} placeholder={copy.students.class} />
                <input style={fieldStyle} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={copy.students.subject} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input style={fieldStyle} inputMode="numeric" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} placeholder={copy.students.monthlyFee} />
                <input style={fieldStyle} inputMode="tel" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder={copy.students.parentPhone} />
              </div>
              <Btn variant="ink" full disabled={isSubmitting} onClick={() => {}} style={{ marginTop: 2 }}>
                {isSubmitting ? copy.students.saving : copy.students.save}
              </Btn>
            </form>
          </Card>
        )}

        {isLoading ? (
          <Card pad={16}><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>{copy.students.loading}</span></Card>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={searchQuery ? 'search' : 'users'}
            title={searchQuery ? copy.students.noResult : copy.students.empty}
            body={searchQuery ? '' : copy.welcome.teacherSubtitle}
            action={!searchQuery ? <Btn variant="ink" icon="plus" onClick={() => setShowForm(true)}>{copy.students.add}</Btn> : undefined}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {filtered.map((s) => {
              const inTrial = isInDemoTrial(s.created_at)
              return (
                <Card key={s.id} pad={14}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Avatar name={s.full_name} size={46} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-display" style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>{s.class_label || '—'}{s.subject ? ` · ${s.subject}` : ''}</div>
                    </div>
                    {inTrial ? (
                      <DemoTrialBadge createdAt={s.created_at} label={copy.demo.label} variant="full" />
                    ) : (
                      <Pill tone="leaf">{copy.common.present}</Pill>
                    )}
                  </div>
                  {s.monthly_fee > 0 && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--ink-2)', fontWeight: 600 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="rupee" style={{ width: 13, height: 13, color: 'var(--leaf)' }} /><b className="font-mono">{inr(s.monthly_fee)}</b>/mo
                      </span>
                      {s.guardian_phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <Icon name="phone" style={{ width: 13, height: 13, color: 'var(--ink-soft)' }} />{s.guardian_phone}
                        </span>
                      )}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* sticky add */}
      <div style={{ position: 'absolute', insetInline: 0, bottom: 64, padding: '12px 18px', background: 'linear-gradient(to top, var(--paper), transparent)' }}>
        <Btn variant="gold" full icon="plus" onClick={() => setShowForm(true)}>{copy.students.add}</Btn>
      </div>
    </div>
  )
}
