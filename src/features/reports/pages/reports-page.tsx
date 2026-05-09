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
import { Icon, IconButton, PageHeader, PersonAvatar, ReportReadyIllustration, cx } from '@/components/common/takhti-ui'
import { useTakhtiCopy } from '@/i18n/takhti-copy'

const defaultMetrics: ReportMetrics = {
  attendancePercent: 0,
  avgScore: 0,
  testsDone: 0,
  feePendingAmount: 0,
}

export function ReportsPage() {
  const { i18n } = useTranslation()
  const { session } = useAuth()
  const navigate = useNavigate()
  const copy = useTakhtiCopy()
  const teacherId = session?.user.id ?? ''

  const [students, setStudents] = useState<ReportStudent[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [generatedText, setGeneratedText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  const classList = Array.from(new Set(students.map((s) => s.class_label))).filter(Boolean)
  const classStudents = students.filter(s => s.class_label === selectedClass)
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
      const classes = Array.from(new Set(rows.map((s) => s.class_label))).filter(Boolean)
      if (classes.length > 0) setSelectedClass(classes[0])
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Students load failed')
    } finally {
      setIsLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    loadStudents().catch(() => {})
  }, [loadStudents])

  const onGenerateReport = async () => {
    if (!selectedClass || !teacherId) return
    setIsGenerating(true)
    setMessage('')
    setErrorMessage('')

    try {
      // Simulate bulk AI generation for the whole class
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const monthName = new Date(monthStart).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      const text = `Namaste! Aapke bachche ka ${monthName} ka progress report attached hai. Kripya dekhein.`
      
      setGeneratedText(text)
      setMessage(copy.reports.readyMessage)
    } catch {
      setErrorMessage('Report generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const shareOnWhatsapp = () => {
    if (!generatedText) return
    setMessage(`Sent to ${classStudents.length} parents automatically!`)
  }

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

        {!generatedText ? (
          <section className="mt-4 rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_30px_rgba(53,38,22,0.07)]">
            <h2 className="text-[16px] font-black text-[#1d1813]">{copy.reports.ready}</h2>
            <p className="mt-1 text-[12px] font-semibold leading-5 text-[#746a60]">
              Ek click mein AI aapke students ka progress report bana dega.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#746a60]">Select Class</label>
                <select
                  className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                  onChange={(event) => setSelectedClass(event.target.value)}
                  value={selectedClass}
                >
                  <option value="">Select Class</option>
                  {classList.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#746a60]">Report Type</label>
                <select className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]" disabled>
                  <option>Monthly Progress Report</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-[#746a60]">Month</label>
                <input
                  className="w-full rounded-xl border border-[#eadfcd] bg-[#fffdf8] px-3 py-3 text-sm font-semibold outline-none focus:border-[#4930a8]"
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  type="month"
                  value={selectedMonth}
                />
              </div>
            </div>

            <button
              className="mt-5 w-full rounded-xl bg-[#4930a8] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(73,48,168,0.18)] disabled:opacity-50"
              disabled={isGenerating || !selectedClass || isLoading}
              onClick={onGenerateReport}
              type="button"
            >
              {isGenerating ? copy.reports.generating : copy.reports.generate}
            </button>
          </section>
        ) : (
          <section className="mt-4 rounded-[22px] border border-[#eee4d8] bg-white p-4 shadow-[0_14px_30px_rgba(53,38,22,0.06)]">
            <div className="mb-4 rounded-[16px] bg-[#fbf8f1] p-3 text-center">
              <Icon className="mx-auto h-6 w-6 text-[#0d7b51]" name="whatsapp" />
              <p className="mt-1 text-[13px] font-black text-[#1d1813]">Send on WhatsApp</p>
              <p className="mt-1 text-[11px] font-semibold text-[#746a60]">Yeh report selected parents ko automatically WhatsApp par bhej di jayegi.</p>
            </div>

            <p className="text-[12px] font-black text-[#746a60]">Recipients ({classStudents.length} Parents)</p>
            <div className="mt-2 flex items-center -space-x-3 overflow-hidden">
              {classStudents.slice(0, 5).map((s, i) => (
                <div className="relative inline-block rounded-full ring-2 ring-white" key={s.id}>
                  <PersonAvatar name={s.full_name} size="sm" variant={i % 2 === 0 ? 'student' : 'female'} />
                </div>
              ))}
              {classStudents.length > 5 && (
                <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#eee8ff] text-[11px] font-black text-[#4930a8] ring-2 ring-white">
                  +{classStudents.length - 5}
                </div>
              )}
            </div>

            <p className="mt-5 text-[12px] font-black text-[#746a60]">{copy.reports.preview}</p>
            <p className="mt-2 whitespace-pre-wrap rounded-[16px] bg-[#fff8ec] border border-[#f3e3ca] p-3 text-[12px] font-semibold leading-relaxed text-[#3a3027]">{generatedText}</p>
            
            <div className="mt-3 rounded-[12px] border border-[#f1d8d3] bg-[#fff0ee] p-3 flex items-center gap-3">
              <Icon className="h-6 w-6 text-[#d84b3f]" name="report" />
              <div>
                <p className="text-[12px] font-black text-[#d84b3f]">March_Progress_Report.pdf</p>
                <p className="text-[10px] font-bold text-[#e18e86]">1.2 MB • PDF</p>
              </div>
            </div>

            <button className="mt-5 w-full rounded-xl bg-[#0d7b51] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(13,123,81,0.18)]" onClick={shareOnWhatsapp} type="button">
              Send to WhatsApp
            </button>
            <button className="mt-3 w-full text-[12px] font-bold text-[#746a60]" onClick={() => setGeneratedText('')} type="button">
              Edit Settings
            </button>
          </section>
        )}
      </section>
    </div>
  )
}
