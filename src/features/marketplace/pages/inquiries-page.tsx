import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { supabase } from '@/lib/supabase-client'
import type { ParentInquiry } from '@/types/marketplace'

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-50 text-blue-700 border-blue-200',
    contacted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    enrolled: 'bg-green-50 text-green-700 border-green-200',
    not_interested: 'bg-slate-100 text-slate-500 border-slate-200',
}

const STATUS_LABELS: Record<string, string> = {
    new: '🆕 New',
    contacted: '📞 Contacted',
    enrolled: '✅ Enrolled',
    not_interested: '❌ Not Interested',
}

const STATUS_OPTIONS = ['new', 'contacted', 'enrolled', 'not_interested']

export function InquiriesPage() {
    const { session } = useAuth()
    const [inquiries, setInquiries] = useState<ParentInquiry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadInquiries = useCallback(async () => {
        if (!session?.user?.id) return

        setLoading(true)
        setError(null)

        try {
            const { data, error: err } = await supabase
                .from('parent_inquiries')
                .select('*')
                .order('created_at', { ascending: false })

            if (err) throw err
            setInquiries((data || []) as ParentInquiry[])
        } catch (err: any) {
            setError(err?.message || 'Inquiries load nahi ho payein.')
        } finally {
            setLoading(false)
        }
    }, [session?.user?.id])

    useEffect(() => {
        loadInquiries()
    }, [loadInquiries])

    async function updateStatus(inquiryId: string, newStatus: string) {
        try {
            const { error: err } = await supabase
                .from('parent_inquiries')
                .update({ status: newStatus })
                .eq('id', inquiryId)

            if (err) throw err

            setInquiries((prev) =>
                prev.map((inq) =>
                    inq.id === inquiryId ? { ...inq, status: newStatus as any } : inq
                )
            )
        } catch (err: any) {
            alert(err?.message || 'Status update failed.')
        }
    }

    function buildReplyLink(inquiry: ParentInquiry) {
        if (!inquiry.parent_phone) return null
        const cleanPhone = inquiry.parent_phone.replace(/\D/g, '')
        const message = `Namaste ${inquiry.parent_name || ''} Ji,\n\nAapki Takhti pe di gayi inquiry mili. Main ${inquiry.subject_needed || ''} padhata/padhati hun.\n\nKya aap baat karna chahenge?`
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    }

    function timeAgo(dateStr: string) {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 60) return `${mins}m ago`
        const hours = Math.floor(mins / 60)
        if (hours < 24) return `${hours}h ago`
        const days = Math.floor(hours / 24)
        return `${days}d ago`
    }

    return (
        <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-ink">📩 Parent Inquiries</h2>

            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-saffron border-t-transparent" />
                </div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {!loading && inquiries.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-3xl mb-2">📭</p>
                    <p className="text-sm text-muted">Abhi koi inquiry nahi aayi hai.</p>
                    <p className="text-xs text-muted mt-1">Jab parents aapka profile dekhenge, tab inquiries yahan dikheingi.</p>
                </div>
            )}

            {!loading && inquiries.length > 0 && (
                <div className="space-y-3">
                    {inquiries.map((inq) => {
                        const replyLink = buildReplyLink(inq)
                        return (
                            <div
                                key={inq.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                {/* Header row */}
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="text-sm font-semibold text-ink">
                                            {inq.parent_name || 'Unknown Parent'}
                                        </p>
                                        <p className="text-[10px] text-muted">
                                            {inq.student_class && `${inq.student_class} • `}
                                            {inq.subject_needed && `${inq.subject_needed} • `}
                                            {timeAgo(inq.created_at)}
                                        </p>
                                    </div>
                                    <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-bold ${STATUS_COLORS[inq.status] || ''}`}>
                                        {STATUS_LABELS[inq.status] || inq.status}
                                    </span>
                                </div>

                                {/* Message */}
                                {inq.message && (
                                    <p className="text-xs text-ink/80 italic mb-3 bg-slate-50 rounded-lg p-2">
                                        "{inq.message}"
                                    </p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2">
                                    {replyLink && (
                                        <a
                                            href={replyLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="rounded-lg bg-green-500 px-3 py-1.5 text-[10px] font-bold text-white transition-all hover:bg-green-600"
                                        >
                                            💬 Reply
                                        </a>
                                    )}

                                    {/* Status dropdown */}
                                    <select
                                        value={inq.status}
                                        onChange={(e) => updateStatus(inq.id, e.target.value)}
                                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-semibold text-ink focus:border-saffron focus:outline-none"
                                    >
                                        {STATUS_OPTIONS.map((s) => (
                                            <option key={s} value={s}>
                                                {STATUS_LABELS[s]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
