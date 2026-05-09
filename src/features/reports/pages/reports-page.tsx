import { useCallback, useEffect, useState } from 'react'
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

const defaultMetrics: ReportMetrics = {
  attendancePercent: 0,
  avgScore: 0,
  testsDone: 0,
  feePendingAmount: 0,
}

export function ReportsPage() {
  const { t, i18n } = useTranslation()
  const { session } = useAuth()
  const navigate = useNavigate()
  const teacherId = session?.user.id ?? ''

  const [students, setStudents] = useState<ReportStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  )
  const [metrics, setMetrics] = useState<ReportMetrics>(defaultMetrics)
  const [generatedText, setGeneratedText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) ?? null
  const monthStart = `${selectedMonth}-01`

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
        setSelectedStudentId((c) => c || rows[0].id)
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Students load failed'
      )
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  const loadMetrics = useCallback(async () => {
    if (!teacherId || !selectedStudentId) {
      setMetrics(defaultMetrics)
      setGeneratedText('')
      return
    }
    setIsLoading(true)
    try {
      const [m, latest] = await Promise.all([
        getReportMetrics(teacherId, selectedStudentId, monthStart),
        fetchLatestReport(teacherId, selectedStudentId, monthStart),
      ])
      setMetrics(m)
      setGeneratedText(latest ?? '')
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Metrics load failed'
      )
    } finally {
      setIsLoading(false)
    }
  }, [monthStart, selectedStudentId, teacherId])

  useEffect(() => {
    loadStudents().catch(() => {})
  }, [loadStudents])

  useEffect(() => {
    loadMetrics().catch(() => {})
  }, [loadMetrics])

  const onGenerateReport = async () => {
    if (!selectedStudent || !teacherId) return
    setIsGenerating(true)
    setMessage('')
    setErrorMessage('')

    try {
      const lang =
        i18n.language === 'en' || i18n.language === 'hi' || i18n.language === 'hi-roman'
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
        language: lang as 'en' | 'hi' | 'hi-roman',
      })

      if (response.status === 'ok' && response.report_text) {
        setGeneratedText(response.report_text)
        setMessage(t('reports.messages.success'))
        return
      }

      // Fallback to manual template
      const text = generateManualTemplate(selectedStudent.full_name, metrics)
      setGeneratedText(text)
      await saveManualReport(teacherId, selectedStudent.id, monthStart, metrics, text)
      setMessage(t('reports.reportText.manualReady'))
    } catch {
      // Fallback to manual
      if (selectedStudent) {
        const text = generateManualTemplate(selectedStudent.full_name, metrics)
        setGeneratedText(text)
        setMessage(t('reports.reportText.manualReady'))
      }
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
    <div className="flex flex-col min-h-full">
      {/* ── Header ── */}
      <div className="sticky top-0 z-10 bg-[#F5F5F5] px-4 pt-6 pb-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="p-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Reports</h1>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-4 pb-24">
        {/* Messages */}
        {errorMessage && (
          <div className="rounded-xl bg-[#FFEBEE] px-4 py-2 text-sm text-[#E53935]">
            {errorMessage}
          </div>
        )}
        {message && (
          <div className="rounded-xl bg-[#E8F5E9] px-4 py-2 text-sm text-[#1B8A3E]">
            {message}
          </div>
        )}

        {/* ── Center illustration ── */}
        <div className="text-center py-4">
          <p className="text-5xl mb-3">✨</p>
          <p className="text-sm text-[#757575]">
            {t('reports.heroSubtitle')}
          </p>
        </div>

        {/* ── Selectors ── */}
        <div className="space-y-2">
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full rounded-xl border border-[#E0E0E0] bg-white px-4 py-3 text-sm text-[#1A1A1A] outline-none focus:border-[#1B8A3E]"
          >
            <option value="">{t('reports.target.studentPlaceholder')}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name} - {s.class_label}
              </option>
            ))}
          </select>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded-xl border border-[#E0E0E0] bg-white px-4 py-3 text-sm outline-none focus:border-[#1B8A3E]"
          />
        </div>

        {/* ── Generate Button ── */}
        <button
          type="button"
          disabled={isGenerating || !selectedStudent || isLoading}
          onClick={onGenerateReport}
          className="bg-[#1B8A3E] text-white rounded-xl py-3 w-full font-semibold text-sm disabled:opacity-50 active:bg-[#15732F]"
        >
          {isGenerating ? t('reports.buttons.generating') : t('reports.buttons.generateAi')}
        </button>

        {/* ── Report Preview ── */}
        {generatedText && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-[#757575] uppercase mb-2">
              {t('reports.preview.title')}
            </p>
            <p className="text-sm text-[#1A1A1A] leading-7 whitespace-pre-wrap">
              {generatedText}
            </p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={shareOnWhatsapp}
                className="bg-[#25D366] text-white rounded-xl py-3 w-full font-semibold text-sm flex items-center justify-center gap-2"
              >
                <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12.031 0C5.405 0 0 5.405 0 12.031c0 2.115.549 4.182 1.593 6L.045 24l6.115-1.517c1.765.952 3.754 1.455 5.871 1.455 6.626 0 12.031-5.405 12.031-12.031S18.657 0 12.031 0z" />
                </svg>
                {t('reports.shareWhatsapp')}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="border border-[#1B8A3E] text-[#1B8A3E] bg-white rounded-xl py-3 w-full font-semibold text-sm"
              >
                {t('reports.buttons.pdfDownload')}
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedText).catch(() => {})
                  setMessage(t('reports.messages.copySuccess'))
                }}
                className="border border-[#E0E0E0] text-[#757575] bg-white rounded-xl py-3 w-full font-semibold text-sm"
              >
                {t('reports.buttons.copy')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
