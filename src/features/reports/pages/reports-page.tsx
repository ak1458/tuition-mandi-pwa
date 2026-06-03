import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/auth-provider'
import {
  fetchLatestReport,
  generateManualTemplate,
  getReportMetrics,
  invokeAiReport,
  listReportStudents,
  saveManualReport,
  type ReportMetrics,
  type ReportStudent,
} from '@/features/reports/services/reports-service'
import {
  Icon,
  IconButton,
  PageHeader,
  PersonAvatar,
  ReportReadyIllustration,
  cx,
} from '@/components/common/tuition-mandi-ui'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'
import { pushNotification } from '@/lib/notifications'
import { formatTrialMessage, getDemoTrialStatus } from '@/lib/demo-trial'
import { DemoTrialBadge } from '@/components/common/demo-trial-badge'

const DEFAULT_METRICS: ReportMetrics = {
  attendancePercent: 0,
  avgScore: 0,
  testsDone: 0,
  feePendingAmount: 0,
}

function buildWhatsAppLink(phone: string | null | undefined, text: string): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function ReportsPage() {
  const { i18n } = useTranslation()
  const { session } = useAuth()
  const navigate = useNavigate()
  const copy = useTuitionMandiCopy()
  const teacherId = session?.user.id ?? ''

  const [students, setStudents] = useState<ReportStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [metrics, setMetrics] = useState<ReportMetrics>(DEFAULT_METRICS)
  const [reportText, setReportText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const monthStart = `${selectedMonth}-01`

  const reportLanguage = useMemo<'en' | 'hi' | 'hi-roman'>(() => {
    const lang = (i18n.language || i18n.resolvedLanguage || 'en') as string
    if (lang.startsWith('hi-roman')) return 'hi-roman'
    if (lang.startsWith('hi')) return 'hi'
    return 'en'
  }, [i18n.language, i18n.resolvedLanguage])

  const selectedStudent = students.find((student) => student.id === selectedStudentId)
  const guardianPhone = selectedStudent?.guardian_phone ?? null

  const loadStudents = useCallback(async () => {
    if (!teacherId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setErrorMessage('')
    try {
      const rows = await listReportStudents(teacherId)
      setStudents(rows)
      if (rows.length > 0 && !selectedStudentId) {
        setSelectedStudentId(rows[0].id)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Students load failed')
    } finally {
      setIsLoading(false)
    }
  }, [selectedStudentId, teacherId])

  const loadMetrics = useCallback(async () => {
    if (!teacherId || !selectedStudentId) {
      setMetrics(DEFAULT_METRICS)
      setReportText('')
      return
    }
    setIsLoadingMetrics(true)
    try {
      const [computed, latest] = await Promise.all([
        getReportMetrics(teacherId, selectedStudentId, monthStart),
        fetchLatestReport(teacherId, selectedStudentId, monthStart),
      ])
      setMetrics(computed)
      setReportText(latest ?? '')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Metrics load failed')
    } finally {
      setIsLoadingMetrics(false)
    }
  }, [monthStart, selectedStudentId, teacherId])

  useEffect(() => {
    loadStudents().catch(() => {})
  }, [loadStudents])

  useEffect(() => {
    loadMetrics().catch(() => {})
  }, [loadMetrics])

  const onGenerateReport = async () => {
    if (!teacherId || !selectedStudent) return
    setIsGenerating(true)
    setMessage('')
    setErrorMessage('')

    try {
      const response = await invokeAiReport({
        teacherId,
        studentId: selectedStudent.id,
        reportMonth: monthStart,
        studentName: selectedStudent.full_name,
        classLabel: selectedStudent.class_label,
        subject: selectedStudent.subject,
        metrics,
        language: reportLanguage,
      })

      if (response.status === 'ok' && response.report_text) {
        setReportText(response.report_text)
        setMessage(copy.reports.readyMessage)
        pushNotification(teacherId, {
          type: 'report',
          title: `Report ready - ${selectedStudent.full_name}`,
          body: 'AI ne progress report generate kar di. WhatsApp se parent ko bhejein.',
          link: '/reports',
        })
        return
      }

      // AI failed - generate manual fallback
      const manual = generateManualTemplate(selectedStudent.full_name, metrics)
      await saveManualReport(teacherId, selectedStudent.id, monthStart, metrics, manual)
      setReportText(manual)
      setMessage(response.user_message_hi ?? 'Manual template ready hai. Edit karke parent ko bhej sakte hain.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Report generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const onUseManualTemplate = async () => {
    if (!teacherId || !selectedStudent) return
    setMessage('')
    setErrorMessage('')
    const manual = generateManualTemplate(selectedStudent.full_name, metrics)
    try {
      await saveManualReport(teacherId, selectedStudent.id, monthStart, metrics, manual)
      setReportText(manual)
      setMessage('Manual template ready hai.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Manual save failed')
    }
  }

  const onCopy = async () => {
    if (!reportText) return
    try {
      await navigator.clipboard.writeText(reportText)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 1500)
    } catch {
      setErrorMessage('Copy nahi ho paya, manually select karein.')
    }
  }

  const trialStatus = selectedStudent ? getDemoTrialStatus(selectedStudent.created_at) : null
  const trialAppendix =
    trialStatus && trialStatus.isActive
      ? `\n\n${formatTrialMessage(trialStatus, copy.demo.whatsappLine)}`
      : ''
  const whatsappText = reportText + trialAppendix
  const whatsappLinkWithTrial = buildWhatsAppLink(guardianPhone, whatsappText)
  const monthName = new Date(monthStart).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-full bg-[#fbf8f1] pb-28">
      <PageHeader
        left={
          <IconButton className="h-9 w-9" label="Back" onClick={() => navigate(-1)}>
            <Icon className="h-4 w-4" name="arrow-left" />
          </IconButton>
        }
        subtitle={copy.reports.subtitle}
        title={copy.reports.title}
      />

      <section className="px-4 py-4">
        <ReportReadyIllustration className="rounded-[24px] shadow-[0_18px_38px_rgba(106,68,25,0.08)]" />

        {errorMessage && <p className="mt-3 rounded-xl bg-[#fff0ee] px-3 py-2 text-sm font-bold text-[#d84b3f]">{errorMessage}</p>}
        {message && <p className="mt-3 rounded-xl bg-[#eaf7ef] px-3 py-2 text-sm font-bold text-[#0d7b51]">{message}</p>}

        <section className="mt-4 rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_30px_rgba(53,38,22,0.07)]">
          <h2 className="text-[16px] font-black text-[#1d1813]">{copy.reports.ready}</h2>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-[#746a60]">
            {copy.reports.description}
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#746a60]" htmlFor="report-student">
                {copy.reports.selectStudent}
              </label>
              <select
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                disabled={isLoading || students.length === 0}
                id="report-student"
                onChange={(event) => setSelectedStudentId(event.target.value)}
                value={selectedStudentId}
              >
                {students.length === 0 && <option value="">No students yet — add one first</option>}
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} - {student.class_label} ({student.subject})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-bold text-[#746a60]" htmlFor="report-month">
                Month
              </label>
              <input
                className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                id="report-month"
                onChange={(event) => setSelectedMonth(event.target.value)}
                type="month"
                value={selectedMonth}
              />
            </div>
          </div>

          {selectedStudent && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-[14px] bg-[#fbf8f1] p-3 text-center">
                <p className="text-[18px] font-black text-[#0d7b51]">{metrics.attendancePercent}%</p>
                <p className="mt-1 text-[10px] font-bold text-[#746a60]">{copy.reports.attendance}</p>
              </div>
              <div className="rounded-[14px] bg-[#fbf8f1] p-3 text-center">
                <p className="text-[18px] font-black text-[#4930a8]">{metrics.avgScore}%</p>
                <p className="mt-1 text-[10px] font-bold text-[#746a60]">{copy.reports.avgScore}</p>
              </div>
              <div className="rounded-[14px] bg-[#fbf8f1] p-3 text-center">
                <p className="text-[18px] font-black text-[#c87b22]">{metrics.testsDone}</p>
                <p className="mt-1 text-[10px] font-bold text-[#746a60]">{copy.reports.tests}</p>
              </div>
            </div>
          )}
          {isLoadingMetrics && (
            <p className="mt-3 text-center text-[11px] font-semibold text-[#746a60]">Metrics load ho rahe hain...</p>
          )}

          <button
            className="mt-5 w-full rounded-xl bg-[#4930a8] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)] disabled:opacity-50"
            disabled={isGenerating || !selectedStudent || isLoading}
            onClick={onGenerateReport}
            type="button"
          >
            {isGenerating ? copy.reports.generating : copy.reports.generate}
          </button>
          <button
            className="mt-2 w-full rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-bold text-[#4930a8] disabled:opacity-50"
            disabled={isGenerating || !selectedStudent}
            onClick={() => {
              onUseManualTemplate().catch(() => {})
            }}
            type="button"
          >
            Manual template (no AI)
          </button>
        </section>

        {reportText && selectedStudent && (
          <section className="mt-4 rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_30px_rgba(53,38,22,0.06)]">
            <div className="mb-3 flex items-center gap-3">
              <PersonAvatar name={selectedStudent.full_name} size="sm" variant="student" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-[13px] font-extrabold text-[#1d1813]">{selectedStudent.full_name}</p>
                  <DemoTrialBadge createdAt={selectedStudent.created_at} label={copy.demo.label} variant="compact" />
                </div>
                <p className="text-[11px] font-semibold text-[#746a60]">
                  {monthName} · {selectedStudent.class_label}
                </p>
              </div>
            </div>

            <p className="text-[12px] font-black text-[#746a60]">{copy.reports.preview}</p>
            <p className="mt-2 whitespace-pre-wrap rounded-[16px] border border-[#f3e3ca] bg-[#fff8ec] p-3 text-[12px] font-semibold leading-relaxed text-[#3a3027]">
              {whatsappText}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="rounded-xl border border-[#eadfcd] bg-white px-3 py-3 text-sm font-bold text-[#1d1813]"
                onClick={() => {
                  onCopy().catch(() => {})
                }}
                type="button"
              >
                {isCopied ? '✓ Copied' : copy.common.copy}
              </button>
              {whatsappLinkWithTrial ? (
                <a
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#0d7b51] px-3 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,123,81,0.18)]"
                  href={whatsappLinkWithTrial}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon className="h-4 w-4" name="whatsapp" />
                  {copy.reports.sendWhatsapp}
                </a>
              ) : (
                <button
                  className={cx('rounded-xl bg-[#f4eee5] px-3 py-3 text-sm font-bold text-[#9a8f83]')}
                  disabled
                  type="button"
                >
                  No phone on file
                </button>
              )}
            </div>
            <button
              className="mt-3 w-full text-[12px] font-bold text-[#746a60]"
              onClick={() => setReportText('')}
              type="button"
            >
              Edit / regenerate
            </button>
          </section>
        )}
      </section>
    </div>
  )
}
