import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/auth-provider'
import { getDashboardSummary } from '@/features/dashboard/services/dashboard-service'
import { listStudents } from '@/features/students/services/students-service'
import type { DashboardSummary, Student } from '@/types/domain'
import { Icon } from '@/components/common/tuition-mandi-ui'
import { Avatar, Btn, Card, IconBtn, Pill, SectionLabel, StatTile, Verified } from '@/components/common/tm-kit'
import { NotificationsPanel } from '@/components/common/notifications-panel'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'
import { useLocalInquiries } from '@/hooks/use-local-inquiries'
import { useTheme } from '@/hooks/use-theme'

const defaultSummary: DashboardSummary = {
  teacher_id: '',
  month_start: '',
  total_students: 0,
  present_today: 0,
  fees_collected: 0,
  fee_pending_count: 0,
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins} min pehle`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} ghante pehle`
  return `${Math.floor(hours / 24)} din pehle`
}

const inr = (n: number) => '₹' + (n || 0).toLocaleString('en-IN')

export function DashboardPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const teacherId = session?.user.id ?? ''
  const { t } = useTranslation()
  const copy = useTuitionMandiCopy()
  const { theme, toggle: toggleTheme } = useTheme()
  const teacherName =
    (session?.user?.user_metadata?.full_name as string | undefined) || t('common.teacher')

  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary)
  const [students, setStudents] = useState<Student[]>([])
  const allInquiries = useLocalInquiries()
  const recentInquiries = allInquiries.slice(0, 2)
  const [showNotifications, setShowNotifications] = useState(false)

  const loadSummary = useCallback(async () => {
    if (!teacherId) return
    try {
      const [data, list] = await Promise.all([
        getDashboardSummary(teacherId),
        listStudents(teacherId).catch(() => [] as Student[]),
      ])
      setSummary(data)
      setStudents(list)
    } catch {
      setSummary(defaultSummary)
    }
  }, [teacherId])

  useEffect(() => {
    loadSummary().catch(() => {})
  }, [loadSummary])

  const totalStudents = summary.total_students
  const presentToday = summary.present_today
  const feePendingCount = summary.fee_pending_count
  const feesCollected = summary.fees_collected
  const inquiryCount = allInquiries.length
  void students

  return (
    <div className="tm-noscroll min-h-full" style={{ background: 'var(--paper)', overflowY: 'auto', paddingBottom: 96 }}>
      {/* header */}
      <div style={{ padding: '14px 18px 6px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={teacherName} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>{copy.dashboard.subtitle} 👋</div>
          <div className="font-display" style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teacherName}</div>
        </div>
        <button onClick={toggleTheme} aria-label="Toggle theme" className="tm-btn" style={{ width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', cursor: 'pointer', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} style={{ width: 19, height: 19 }} />
        </button>
        <IconBtn name="bell" label="Notifications" badge={inquiryCount || undefined} onClick={() => setShowNotifications(true)} />
      </div>

      <NotificationsPanel onClose={() => setShowNotifications(false)} open={showNotifications} userId={teacherId} />

      <div style={{ padding: '8px 18px 0' }}>
        {/* ink hero — today's teaching at a glance */}
        <Card pad={0} style={{ overflow: 'hidden', background: 'var(--ink)', border: 'none', boxShadow: 'var(--shadow-ink)' }}>
          <div style={{ padding: 18, position: 'relative' }}>
            <div style={{ position: 'absolute', right: -20, top: -20, width: 130, height: 130, borderRadius: 999, background: 'radial-gradient(circle, rgba(242,161,20,.26), transparent 70%)' }} />
            <div style={{ display: 'flex', gap: 16 }}>
              <div>
                <div className="font-mono" style={{ fontSize: 30, fontWeight: 700, color: 'var(--on-ink)', lineHeight: 1 }}>{presentToday}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(251,247,238,.66)', fontWeight: 600, marginTop: 4 }}>{copy.dashboard.presentToday}</div>
              </div>
              <div style={{ width: 1, background: 'rgba(255,255,255,.14)' }} />
              <div>
                <div className="font-mono" style={{ fontSize: 30, fontWeight: 700, color: '#F7AE2C', lineHeight: 1 }}>{inquiryCount}</div>
                <div style={{ fontSize: 11.5, color: 'rgba(251,247,238,.66)', fontWeight: 600, marginTop: 4 }}>{copy.dashboard.inquiries}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, padding: '11px 13px', borderRadius: 13, background: 'rgba(255,255,255,.08)' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(247,174,44,.18)', color: '#F7AE2C', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="clock" style={{ width: 18, height: 18 }} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, color: 'rgba(251,247,238,.6)', fontWeight: 600 }}>{feePendingCount > 0 ? copy.dashboard.feePending : copy.dashboard.todayStatus}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--on-ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {feePendingCount > 0 ? `${feePendingCount} ${feePendingCount === 1 ? 'student' : 'students'}` : `${totalStudents} ${totalStudents === 1 ? 'student' : 'students'}`}
                </div>
              </div>
              <button onClick={() => navigate(feePendingCount > 0 ? '/fees' : '/attendance')} className="tm-btn" style={{ padding: '8px 13px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'var(--marigold)', color: 'var(--on-marigold)', fontWeight: 800, fontSize: 12.5, flexShrink: 0 }}>{copy.dashboard.view}</button>
            </div>
          </div>
        </Card>

        {/* quick stats */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <StatTile value={totalStudents} label={copy.dashboard.students} tone="var(--marigold-deep)" icon="users" onClick={() => navigate('/students')} />
          <StatTile value={presentToday} label={copy.dashboard.presentToday} tone="var(--leaf)" icon="check-circle" onClick={() => navigate('/attendance')} />
          <StatTile value={inquiryCount} label={copy.dashboard.inquiries} tone="var(--sky)" icon="message" onClick={() => navigate('/inquiries')} />
        </div>

        {/* profile / verification CTA */}
        <Card pad={13} onClick={() => navigate('/profile/setup')} style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--leaf-wash)', border: 'none' }}>
          <Verified size={26} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--leaf-deep)' }}>Profile complete karein</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 1 }}>Verified tutor banein, zyada leads payein</div>
          </div>
          <Icon name="chevron" style={{ width: 18, height: 18, color: 'var(--leaf-deep)' }} />
        </Card>

        {/* new leads (real parent inquiries) */}
        <div style={{ marginTop: 22 }}>
          <SectionLabel action={copy.dashboard.viewAll} onAction={() => navigate('/inquiries')}>{copy.dashboard.recentInquiries}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentInquiries.length === 0 ? (
              <Card pad={18} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink-2)' }}>Abhi koi lead nahi</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 4 }}>Apni profile share karein taaki parents reach kar sakein.</div>
              </Card>
            ) : (
              recentInquiries.map((q) => (
                <Card key={q.id} pad={14} onClick={() => navigate('/inquiries')}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <Avatar name={q.parent_name || 'Parent'} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span className="font-display" style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>{q.subject_needed || 'Tuition'}</span>
                        <Pill tone="gold" style={{ fontSize: 10 }}>Naya</Pill>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 3 }}>{q.parent_name || 'Parent'} · {q.student_class || 'Class'}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 9, fontSize: 11.5, fontWeight: 600, color: 'var(--ink-2)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="clock" style={{ width: 13, height: 13, color: 'var(--ink-soft)' }} />{timeAgo(q.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* earnings — secondary card (real fees collected this month) */}
        <Card pad={15} style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 13 }} onClick={() => navigate('/fees')}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--leaf-wash)', color: 'var(--leaf-deep)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="wallet" style={{ width: 22, height: 22 }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 600 }}>{copy.fees.collected}</div>
            <div className="font-mono" style={{ fontSize: 19, fontWeight: 700, color: 'var(--ink)' }}>{inr(feesCollected)}</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: 'var(--marigold-deep)' }}>{copy.dashboard.view}<Icon name="chevron" style={{ width: 15, height: 15 }} /></span>
        </Card>

        {/* share profile prompt */}
        <Card pad={15} soft style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--marigold-wash)', color: 'var(--marigold-deep)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="gift" style={{ width: 22, height: 22 }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ink)' }}>Apna profile share karein</div>
            <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 1 }}>Zyada parents tak pahunchein</div>
          </div>
          <Btn variant="ink" size="sm" onClick={() => navigate('/profile/setup')}>Share</Btn>
        </Card>
      </div>
    </div>
  )
}
