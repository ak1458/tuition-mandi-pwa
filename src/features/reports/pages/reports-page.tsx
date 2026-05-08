import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/auth-provider'
import { UpgradeModal } from '@/components/common/upgrade-modal'
import { isLocalMode } from '@/lib/env'
import { useAiReportCount } from '@/hooks/use-ai-report-count'
import { usePlan } from '@/hooks/use-plan'
import type { UpgradeReason } from '@/types/plan'
import {
  fetchLatestReport,
  generateManualTemplate,
  getReportMetrics,
  invokeAiReport,
  listReportStudents,
  saveManualReport,
  type GeneratedReportResponse,
  type ReportMetrics,
  type ReportStudent,
} from '@/features/reports/services/reports-service'

interface ErrorState {
  code: GeneratedReportResponse['error_code'] | null
  message: string
  retryAfterSeconds: number
}

const defaultMetrics: ReportMetrics = {
  attendancePercent: 0,
  avgScore: 0,
  testsDone: 0,
}
const FREE_PLAN_AI_REPORT_LIMIT = 1

export function ReportsPage() {
  const { i18n } = useTranslation()
  const { session } = useAuth()
  const { isFree, isPro, isLoading: isPlanLoading, refreshPlan } = usePlan()
  const teacherId = session?.user.id ?? ''
  const { count: aiReportCount, isLoading: isAiCountLoading, refresh: refreshAiReportCount } = useAiReportCount(teacherId)
  const [students, setStudents] = useState<ReportStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [metrics, setMetrics] = useState<ReportMetrics>(defaultMetrics)
  const [generatedText, setGeneratedText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')
  const [errorState, setErrorState] = useState<ErrorState>({
    code: null,
    message: '',
    retryAfterSeconds: 0,
  })
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason | null>(null)

  const selectedStudent = useMemo(
    () => students.find((student) => student.id === selectedStudentId) ?? null,
    [selectedStudentId, students],
  )

  const monthStart = `${selectedMonth}-01`

  useEffect(() => {
    if (!errorState.retryAfterSeconds) return
    const intervalId = window.setInterval(() => {
      setErrorState((prev) => ({
        ...prev,
        retryAfterSeconds: Math.max(prev.retryAfterSeconds - 1, 0),
      }))
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [errorState.retryAfterSeconds])

  const loadStudents = useCallback(async () => {
    if (!teacherId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const rows = await listReportStudents(teacherId)
      setStudents(rows)
      if (rows.length > 0) {
        setSelectedStudentId((current) => current || rows[0].id)
      }
    } catch (error) {
      setErrorState({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Students load failed',
        retryAfterSeconds: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  const loadMetricsAndLatest = useCallback(async () => {
    if (!teacherId || !selectedStudentId) {
      setMetrics(defaultMetrics)
      setGeneratedText('')
      return
    }

    setIsLoading(true)
    setInfoMessage('')
    try {
      const [metricsValue, latestReport] = await Promise.all([
        getReportMetrics(teacherId, selectedStudentId, monthStart),
        fetchLatestReport(teacherId, selectedStudentId, monthStart),
      ])
      setMetrics(metricsValue)
      setGeneratedText(latestReport ?? '')
    } catch (error) {
      setErrorState({
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Metrics load failed',
        retryAfterSeconds: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }, [monthStart, selectedStudentId, teacherId])

  useEffect(() => {
    loadStudents().catch(() => { })
  }, [loadStudents])

  useEffect(() => {
    loadMetricsAndLatest().catch(() => { })
  }, [loadMetricsAndLatest])

  const generateManual = useCallback(async () => {
    if (!selectedStudent || !teacherId) return
    const text = generateManualTemplate(selectedStudent.full_name, metrics)
    setGeneratedText(text)
    setInfoMessage('Manual template report ready hai.')
    setErrorState({
      code: null,
      message: '',
      retryAfterSeconds: 0,
    })
    await saveManualReport(teacherId, selectedStudent.id, monthStart, metrics, text)
  }, [metrics, monthStart, selectedStudent, teacherId])

  const generateAiReport = async () => {
    if (!selectedStudent) return
    if (isFree && aiReportCount >= FREE_PLAN_AI_REPORT_LIMIT) {
      setUpgradeReason('ai_report')
      return
    }

    setIsGenerating(true)
    setInfoMessage('')
    setErrorState({
      code: null,
      message: '',
      retryAfterSeconds: 0,
    })

    try {
      const currentLanguage = (i18n.language === 'en' || i18n.language === 'hi' || i18n.language === 'hi-roman')
        ? i18n.language
        : 'hi-roman'

      const response = await invokeAiReport({
        teacherId,
        studentId: selectedStudent.id,
        reportMonth: monthStart,
        studentName: selectedStudent.full_name,
        classLabel: selectedStudent.class_label,
        subject: selectedStudent.subject,
        metrics,
        language: currentLanguage as 'en' | 'hi' | 'hi-roman',
      })

      if (response.status === 'ok' && response.report_text) {
        setGeneratedText(response.report_text)
        setInfoMessage('AI report successfully generate ho gaya.')
        await refreshAiReportCount()
        await loadMetricsAndLatest()
        return
      }

      if (response.error_code === 'UPGRADE_REQUIRED') {
        setUpgradeReason('ai_report')
      }

      const message =
        response.user_message_hi ?? 'Abhi report generate nahi ho pa rahi, thodi der mein try karein.'
      setErrorState({
        code: response.error_code ?? 'NETWORK_ERROR',
        message,
        retryAfterSeconds: response.retry_after_seconds ?? 0,
      })
    } catch {
      setErrorState({
        code: 'NETWORK_ERROR',
        message: 'Internet connection weak hai. Connection check karke phir try karein.',
        retryAfterSeconds: 0,
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const shareOnWhatsapp = () => {
    if (!generatedText) return
    const encoded = encodeURIComponent(generatedText)
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="space-y-4">
      {isLocalMode && (
        <p className="rounded-xl bg-saffron/15 px-3 py-2 text-sm text-ink">
          Local demo mode active. AI reports OpenRouter key se direct generate ho rahe hain.
        </p>
      )}
      {infoMessage && <p className="rounded-xl bg-sage/10 px-3 py-2 text-sm text-sage">{infoMessage}</p>}

      {errorState.message && (
        <section className="rounded-2xl border border-rose/30 bg-rose/10 px-4 py-4">
          <p className="text-sm text-rose">{errorState.message}</p>
          {errorState.code === 'AI_RATE_LIMIT' && errorState.retryAfterSeconds > 0 && (
            <p className="mt-2 text-xs text-rose">Retry in {errorState.retryAfterSeconds}s</p>
          )}
          {errorState.code === 'AI_PROVIDER_DOWN' && (
            <button
              className="mt-3 rounded-xl border border-[#dfd4bc] bg-white px-3 py-2 text-sm font-semibold text-ink"
              onClick={() => {
                generateManual().catch(() => { })
              }}
              type="button"
            >
              Use Manual Template
            </button>
          )}
          {errorState.code === 'NETWORK_ERROR' && (
            <button
              className="mt-3 rounded-xl border border-[#dfd4bc] bg-white px-3 py-2 text-sm font-semibold text-ink"
              onClick={generateAiReport}
              type="button"
            >
              Retry
            </button>
          )}
          {errorState.code === 'VALIDATION_ERROR' && (
            <Link className="mt-3 inline-block rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink" to="/dashboard">
              Student details update karein
            </Link>
          )}
          {errorState.code === 'UPGRADE_REQUIRED' && (
            <button
              className="mt-3 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink"
              onClick={() => setUpgradeReason('ai_report')}
              type="button"
            >
              Pro Lo
            </button>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-saffron">Report Target</p>
        <div className="mt-3 grid gap-2">
          <select
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setSelectedStudentId(event.target.value)}
            value={selectedStudentId}
          >
            <option value="">Select student</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name} - {student.class_label}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-[#dfd4bc] px-3 py-2 text-sm"
            onChange={(event) => setSelectedMonth(event.target.value)}
            type="month"
            value={selectedMonth}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-saffron">Metrics</p>
        {isLoading ? (
          <p className="mt-2 text-sm text-muted">Metrics load ho rahe hain...</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl bg-cream px-3 py-2 text-center">
              <p className="font-display text-xl text-sage">{metrics.attendancePercent}%</p>
              <p className="text-xs text-muted">Attendance</p>
            </div>
            <div className="rounded-xl bg-cream px-3 py-2 text-center">
              <p className="font-display text-xl text-saffron">{metrics.avgScore}%</p>
              <p className="text-xs text-muted">Avg Score</p>
            </div>
            <div className="rounded-xl bg-cream px-3 py-2 text-center">
              <p className="font-display text-xl text-rose">{metrics.testsDone}</p>
              <p className="text-xs text-muted">Tests Done</p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-3 text-xs text-muted">
        {isPlanLoading || isAiCountLoading
          ? 'Plan check ho raha hai...'
          : isPro
            ? 'Plan: Pro (AI reports unlimited)'
            : `Free plan usage: ${aiReportCount}/${FREE_PLAN_AI_REPORT_LIMIT} AI reports used`}
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button
          className="rounded-xl bg-saffron px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={
            isGenerating || !selectedStudent || errorState.retryAfterSeconds > 0 || isPlanLoading || isAiCountLoading
          }
          onClick={generateAiReport}
          type="button"
        >
          {isGenerating ? 'Generating...' : 'Generate AI Report'}
        </button>
        <button
          className="rounded-xl border border-[#dfd4bc] bg-white px-4 py-3 text-sm font-semibold text-ink disabled:opacity-60"
          disabled={!selectedStudent}
          onClick={() => {
            generateManual().catch(() => { })
          }}
          type="button"
        >
          Manual Template
        </button>
      </div>

      <section className="rounded-2xl border border-[#dfd4bc] bg-white px-4 py-4">
        <p className="text-xs uppercase tracking-[0.16em] text-saffron">Report Text</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink">
          {generatedText || 'Abhi koi report available nahi hai.'}
        </p>
        <button
          className="mt-4 w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={!generatedText}
          onClick={shareOnWhatsapp}
          type="button"
        >
          Share on WhatsApp
        </button>
      </section>

      {upgradeReason && (
        <UpgradeModal
          onClose={() => setUpgradeReason(null)}
          onUpgradeSuccess={() => {
            refreshPlan().catch(() => {})
            refreshAiReportCount().catch(() => {})
            setInfoMessage('Plan successfully upgraded to Pro.')
          }}
          reason={upgradeReason}
        />
      )}
    </div>
  )
}
