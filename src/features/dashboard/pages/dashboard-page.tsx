import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { getDashboardSummary } from '@/features/dashboard/services/dashboard-service'
import type { DashboardSummary } from '@/types/domain'
import { colors } from '@/styles/design-tokens'
import { useTranslation } from 'react-i18next'

const defaultSummary: DashboardSummary = {
  teacher_id: '',
  month_start: '',
  total_students: 0,
  present_today: 0,
  fees_collected: 0,
  fee_pending_count: 0,
}

export function DashboardPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const teacherId = session?.user.id ?? ''
  const { t } = useTranslation()
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
      // Silent fail — show defaults
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    loadSummary().catch(() => {})
  }, [loadSummary])

  const absentCount = summary.total_students - summary.present_today
  const pendingFees = summary.fee_pending_count
  const feesCollected = summary.fees_collected

  // Build initials from teacher name
  const initials = teacherName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="rounded-xl bg-white p-4 text-sm text-[#757575]">
          {t('dashboard.loading')}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-bold"
            style={{ backgroundColor: colors.primary }}
          >
            {initials}
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#1A1A1A]">
              {t('dashboard.greeting', { name: teacherName })}
            </h1>
            <p className="text-xs text-[#757575]">{t('dashboard.subtitle')}</p>
          </div>
        </div>
        {/* Bell icon */}
        <button type="button" className="p-2">
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
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>

      {/* ── Absent Students Card ── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3E0]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E65100"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#757575]">{t('dashboard.cards.absentStudents')}</p>
            {absentCount > 0 ? (
              <p className="text-2xl font-bold text-[#E53935]">{absentCount}</p>
            ) : (
              <p className="text-sm font-semibold text-[#1B8A3E]">
                {t('dashboard.cards.allPresent')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Pending Fees Card ── */}
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3E0]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#E65100"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#757575]">{t('dashboard.cards.pendingFees')}</p>
            {pendingFees > 0 ? (
              <p className="text-2xl font-bold text-[#E53935]">
                ₹{feesCollected.toLocaleString('en-IN')}
              </p>
            ) : (
              <p className="text-sm font-semibold text-[#1B8A3E]">
                {t('dashboard.cards.allFeesClear')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-[#E0E0E0]" />

      {/* ── Aaj ka kaam ── */}
      <div>
        <p className="text-xs text-[#757575] mb-3">{t('dashboard.todaysTask')}</p>
        <button
          type="button"
          onClick={() => navigate('/attendance')}
          className="bg-[#1B8A3E] text-white rounded-xl py-3 w-full font-semibold text-sm active:bg-[#15732F]"
        >
          {t('dashboard.markAttendance')}
        </button>
      </div>
    </div>
  )
}
