import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/auth-provider'
import { getDashboardSummary } from '@/features/dashboard/services/dashboard-service'
import { listStudents } from '@/features/students/services/students-service'
import type { DashboardSummary, Student } from '@/types/domain'
import { Icon, PageHeader, PersonAvatar, cx } from '@/components/common/takhti-ui'
import { NotificationsBell, NotificationsPanel } from '@/components/common/notifications-panel'
import { useTakhtiCopy } from '@/i18n/takhti-copy'
import { useLocalInquiries } from '@/hooks/use-local-inquiries'
import { countActiveDemoTrials } from '@/lib/demo-trial'

const defaultSummary: DashboardSummary = {
  teacher_id: '',
  month_start: '',
  total_students: 0,
  present_today: 0,
  fees_collected: 0,
  fee_pending_count: 0,
}

const quickActions = [
  { label: 'Attendance', copyKey: 'attendance', icon: 'clipboard', path: '/attendance', tone: 'green' },
  { label: 'Students', copyKey: 'students', icon: 'users', path: '/students', tone: 'orange' },
  { label: 'Reports', copyKey: 'reports', icon: 'report', path: '/reports', tone: 'purple' },
  { label: 'Fees', copyKey: 'fees', icon: 'rupee', path: '/fees', tone: 'paper' },
  { label: 'Reminders', copyKey: 'reminders', icon: 'bell', path: '/fees', tone: 'green' },
  { label: 'WhatsApp', copyKey: 'whatsapp', icon: 'whatsapp', path: '/inquiries', tone: 'green' },
  { label: 'Post Vacancy', copyKey: 'postVacancy', icon: 'send', path: '/profile/setup', tone: 'orange' },
  { label: 'More', copyKey: 'more', icon: 'dots', path: '/more', tone: 'paper' },
] as const

function actionTone(tone: (typeof quickActions)[number]['tone']) {
  if (tone === 'green') return 'bg-[#eaf7ef] text-[#0d7b51]'
  if (tone === 'orange') return 'bg-[#fff4df] text-[#c87b22]'
  if (tone === 'purple') return 'bg-[#f1edff] text-[#4930a8]'
  return 'bg-[#fffaf1] text-[#5d544c]'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.floor(hours / 24)} d ago`
}

export function DashboardPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const teacherId = session?.user.id ?? ''
  const { t } = useTranslation()
  const copy = useTakhtiCopy()
  const teacherName =
    (session?.user?.user_metadata?.full_name as string | undefined) || t('common.teacher')

  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary)
  const [isLoading, setIsLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const allInquiries = useLocalInquiries()
  const recentInquiries = allInquiries.slice(0, 3)
  const [showNotifications, setShowNotifications] = useState(false)

  const loadSummary = useCallback(async () => {
    if (!teacherId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const [data, list] = await Promise.all([
        getDashboardSummary(teacherId),
        listStudents(teacherId).catch(() => [] as Student[]),
      ])
      setSummary(data)
      setStudents(list)
    } catch {
      setSummary(defaultSummary)
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    loadSummary().catch(() => {})
  }, [loadSummary])

  const totalStudents = summary.total_students
  const presentToday = summary.present_today
  const feePendingCount = summary.fee_pending_count
  const inquiryCount = allInquiries.length
  const activeTrialCount = countActiveDemoTrials(students)

  return (
    <div className="min-h-full bg-[#fbf8f1] pb-24">
      <PageHeader
        right={<NotificationsBell userId={teacherId} onOpen={() => setShowNotifications(true)} />}
        subtitle={copy.dashboard.title}
        title={copy.dashboard.greeting.replace('{{name}}', teacherName.split(' ')[0] || 'Teacher')}
      />

      <NotificationsPanel
        onClose={() => setShowNotifications(false)}
        open={showNotifications}
        userId={teacherId}
      />

      <section className="px-4 py-4">
        <div className="rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_30px_rgba(53,38,22,0.07)]">
          <div className="flex items-center gap-3">
            <PersonAvatar name={teacherName} size="sm" variant="male" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-black text-[#1d1813]">
                {copy.dashboard.greeting.replace('{{name}}', teacherName.split(' ')[0] || 'Teacher')}
              </p>
              <p className="text-[12px] font-semibold text-[#746a60]">{copy.dashboard.subtitle}</p>
            </div>
            <span className="rounded-full bg-[#eaf7ef] px-3 py-1 text-[11px] font-black text-[#0d7b51]">Online</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              [copy.dashboard.students, totalStudents],
              [copy.dashboard.classes, totalStudents > 0 ? Math.max(1, Math.ceil(totalStudents / 5)) : 0],
              [copy.dashboard.inquiries, inquiryCount],
            ].map(([label, value]) => (
              <div className="rounded-[16px] bg-[#fbf8f1] p-3 text-center" key={label}>
                <p className="text-[22px] font-black text-[#0d7b51]">{value}</p>
                <p className="mt-1 text-[10px] font-bold text-[#746a60]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {isLoading && (
          <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#746a60]">{copy.common.loading}</p>
        )}

        <section className="mt-5">
          <h2 className="text-[13px] font-black text-[#1d1813]">{copy.dashboard.quickActions}</h2>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {quickActions.map((action) => (
              <button
                className="min-h-[76px] rounded-[16px] border border-[#eee4d8] bg-white p-2 text-center shadow-[0_8px_18px_rgba(53,38,22,0.05)] active:scale-[0.98]"
                key={action.label}
                onClick={() => navigate(action.path)}
                type="button"
              >
                <span className={cx('mx-auto grid h-9 w-9 place-items-center rounded-xl', actionTone(action.tone))}>
                  <Icon className="h-5 w-5" name={action.icon} />
                </span>
                <span className="mt-2 block text-[10px] font-black leading-3 text-[#4d453d]">
                  {copy.actions[action.copyKey]}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-black text-[#1d1813]">{copy.dashboard.todayStatus}</h2>
            <button className="text-[12px] font-black text-[#4930a8]" onClick={() => navigate('/attendance')} type="button">
              {copy.dashboard.view}
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <button className="rounded-[18px] border border-[#ddecdf] bg-[#f4fbf6] p-4 text-left" onClick={() => navigate('/attendance')} type="button">
              <p className="text-[12px] font-bold text-[#746a60]">{copy.dashboard.presentToday}</p>
              <p className="mt-2 text-3xl font-black text-[#0d7b51]">{presentToday}</p>
            </button>
            <button className="rounded-[18px] border border-[#f0dfc2] bg-[#fff8e8] p-4 text-left" onClick={() => navigate('/fees')} type="button">
              <p className="text-[12px] font-bold text-[#746a60]">{copy.dashboard.feePending}</p>
              <p className="mt-2 text-3xl font-black text-[#c87b22]">{feePendingCount}</p>
            </button>
          </div>
          {activeTrialCount > 0 && (
            <button
              className="mt-3 flex w-full items-center gap-3 rounded-[18px] border border-[#f0dfc2] bg-gradient-to-br from-[#fff8e8] to-[#fff4df] p-4 text-left shadow-[0_8px_18px_rgba(200,123,34,0.06)]"
              onClick={() => navigate('/students')}
              type="button"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#c87b22] shadow-sm">
                <Icon className="h-5 w-5" name="star" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#9a5a14]">
                  {copy.demo.dashboardCard}
                </p>
                <p className="mt-0.5 text-[18px] font-black leading-tight text-[#1d1813]">
                  {activeTrialCount} {activeTrialCount === 1 ? 'student' : 'students'}
                </p>
                <p className="mt-0.5 truncate text-[11px] font-semibold text-[#7a5d2c]">
                  {copy.demo.dashboardHint.replace('{{count}}', String(activeTrialCount))}
                </p>
              </div>
              <Icon className="h-4 w-4 shrink-0 text-[#9a5a14]" name="chevron-right" />
            </button>
          )}
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-black text-[#1d1813]">{copy.dashboard.recentInquiries}</h2>
            <button className="text-[12px] font-black text-[#0d7b51]" onClick={() => navigate('/inquiries')} type="button">
              {copy.dashboard.viewAll}
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {recentInquiries.length === 0 ? (
              <article className="rounded-[18px] border border-[#eee4d8] bg-white p-5 text-center text-sm font-semibold text-[#746a60]">
                Abhi koi parent inquiry nahi aayi.
                <p className="mt-1 text-[11px] font-medium text-[#9a8f83]">
                  Apni profile share karein taaki parents reach kar sakein.
                </p>
              </article>
            ) : (
              recentInquiries.map((inquiry, index) => (
                <article
                  className="flex items-center gap-3 rounded-[18px] border border-[#eee4d8] bg-white p-3 shadow-sm"
                  key={inquiry.id}
                >
                  <PersonAvatar
                    name={inquiry.parent_name || 'Parent'}
                    size="sm"
                    variant={index % 2 ? 'female' : 'student'}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-black text-[#1d1813]">
                      {inquiry.parent_name || 'Unknown Parent'}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-[#746a60]">
                      {inquiry.student_class || 'Class'} - {inquiry.subject_needed || 'Subject'} - {timeAgo(inquiry.created_at)}
                    </p>
                  </div>
                  <button
                    className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf7ef] text-[#0d7b51]"
                    onClick={() => navigate('/inquiries')}
                    type="button"
                  >
                    <Icon className="h-5 w-5" name="whatsapp" />
                  </button>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </div>
  )
}
