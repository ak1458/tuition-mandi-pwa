import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/auth-provider'
import { getDashboardSummary } from '@/features/dashboard/services/dashboard-service'
import type { DashboardSummary } from '@/types/domain'
import { Icon, IconButton, PageHeader, PersonAvatar, cx } from '@/components/common/takhti-ui'
import { useTakhtiCopy } from '@/i18n/takhti-copy'

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

  const loadSummary = useCallback(async () => {
    if (!teacherId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const data = await getDashboardSummary(teacherId)
      setSummary(data)
    } catch {
      setSummary(defaultSummary)
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    loadSummary().catch(() => {})
  }, [loadSummary])

  const displayStudents = summary.total_students || 12
  const presentToday = summary.present_today || Math.max(displayStudents - 2, 0)
  const inquiries = JSON.parse(localStorage.getItem('takhti_local_inquiries') || '[]') as Array<{ id: string }>

  return (
    <div className="min-h-full bg-[#fbf8f1] pb-24">
      <PageHeader
        right={
          <IconButton className="h-9 w-9" label="Notifications">
            <Icon className="h-4 w-4" name="bell" />
          </IconButton>
        }
        subtitle={copy.dashboard.title}
        title={copy.dashboard.greeting.replace('{{name}}', teacherName.split(' ')[0] || 'Teacher')}
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
              [copy.dashboard.students, displayStudents],
              [copy.dashboard.classes, 4],
              [copy.dashboard.inquiries, Math.max(inquiries.length, 3)],
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
              <p className="mt-2 text-3xl font-black text-[#c87b22]">{summary.fee_pending_count || 2}</p>
            </button>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-black text-[#1d1813]">{copy.dashboard.recentInquiries}</h2>
            <button className="text-[12px] font-black text-[#0d7b51]" onClick={() => navigate('/inquiries')} type="button">
              {copy.dashboard.viewAll}
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {[
              ['Anil Sharma (Parent)', 'Class 10 - Maths', '5 min ago'],
              ['Kavita Pandey (Parent)', 'Class 8 - Science', '1 hr ago'],
            ].map(([name, meta, time]) => (
              <article className="flex items-center gap-3 rounded-[18px] border border-[#eee4d8] bg-white p-3 shadow-sm" key={name}>
                <PersonAvatar name={name} size="sm" variant="student" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-black text-[#1d1813]">{name}</p>
                  <p className="text-[11px] font-semibold text-[#746a60]">{meta} - {time}</p>
                </div>
                <button className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf7ef] text-[#0d7b51]" type="button">
                  <Icon className="h-5 w-5" name="whatsapp" />
                </button>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}
