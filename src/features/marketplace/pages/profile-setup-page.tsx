import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/providers/auth-provider'
import { upsertTeacherProfile } from '@/lib/queries/teachers'
import { AnimatedLogo } from '@/components/common/animated-logo'
import type { TeachingMedium } from '@/types/marketplace'
import { SUBJECTS, CLASSES, MEDIUMS } from '@/lib/taxonomy'

// ------- Constants -------
const TIME_SLOTS = [
    'Subah 6-8 AM', 'Subah 8-10 AM', 'Dopahar 12-2 PM',
    'Shaam 4-6 PM', 'Shaam 6-8 PM', 'Raat 8-10 PM',
]

const TOTAL_STEPS = 3

// ------- Form state type -------
interface ProfileFormState {
    full_name: string
    phone: string
    area_mohalla: string
    city: string
    district: string
    pincode: string
    bio: string
    subjects: string[]
    classes_taught: string[]
    medium: string
    experience_years: string
    time_slots: string[]
    fee_min: string
    fee_max: string
    fee_negotiable: boolean
    home_tuition: boolean
    online_tuition: boolean
    is_open_to_school: boolean
}

const initialState: ProfileFormState = {
    full_name: '',
    phone: '',
    area_mohalla: '',
    city: '',
    district: '',
    pincode: '',
    bio: '',
    subjects: [],
    classes_taught: [],
    medium: 'Hindi',
    experience_years: '',
    time_slots: [],
    fee_min: '',
    fee_max: '',
    fee_negotiable: true,
    home_tuition: true,
    online_tuition: false,
    is_open_to_school: false,
}

// ------- Reusable UI pieces -------

function ProgressBar({ step }: { step: number }) {
    return (
        <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className={`h-2 w-full rounded-full transition-all duration-500 ${s <= step
                                ? 'bg-gradient-to-r from-[#e07a2f] to-orange-400 shadow-[0_0_8px_rgba(224,122,47,0.4)]'
                                : 'bg-slate-200'
                            }`}
                    />
                    <span className={`text-[10px] font-bold tracking-wider uppercase ${s <= step ? 'text-[#e07a2f]' : 'text-slate-400'
                        }`}>
                        {s === 1 ? 'Basic Info' : s === 2 ? 'Teaching' : 'Fees'}
                    </span>
                </div>
            ))}
        </div>
    )
}

function ChipSelector({
    options,
    selected,
    onToggle,
    columns = 3,
}: {
    options: readonly string[]
    selected: string[]
    onToggle: (value: string) => void
    columns?: number
}) {
    return (
        <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {options.map((opt) => {
                const isSelected = selected.includes(opt)
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onToggle(opt)}
                        className={`rounded-xl border px-3 py-2.5 text-[12px] font-semibold tracking-wide transition-all duration-200 ${isSelected
                                ? 'border-[#e07a2f] bg-[#e07a2f]/10 text-[#e07a2f] shadow-sm'
                                : 'border-slate-200 bg-surface text-slate-500 hover:border-[#e07a2f]/40 hover:text-slate-800'
                            }`}
                    >
                        {opt}
                    </button>
                )
            })}
        </div>
    )
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-surface px-4 py-3 cursor-pointer hover:border-[#e07a2f]/40 transition-colors">
            <span className="text-sm font-medium text-slate-800">{label}</span>
            <div
                onClick={(e) => {
                    e.preventDefault()
                    onChange(!checked)
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 cursor-pointer ${checked ? 'bg-[#e07a2f]' : 'bg-slate-300'
                    }`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-surface shadow-md transition-transform duration-300 ${checked ? 'translate-x-[22px]' : 'translate-x-[2px]'
                        }`}
                />
            </div>
        </label>
    )
}

function FormLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            {children}
        </label>
    )
}

function TextInput({
    value,
    onChange,
    placeholder,
    required,
    maxLength,
    type = 'text',
}: {
    value: string
    onChange: (v: string) => void
    placeholder: string
    required?: boolean
    maxLength?: number
    type?: string
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            maxLength={maxLength}
            className="w-full rounded-xl border border-slate-200 bg-surface px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#e07a2f] focus:outline-none focus:ring-2 focus:ring-[#e07a2f]/20 transition-all"
        />
    )
}

// ------- Main Page -------

export function ProfileSetupPage() {
    const { session } = useAuth()
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [form, setForm] = useState<ProfileFormState>(initialState)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Pre-populate phone number if already present in session
    useEffect(() => {
        if (session?.user?.phone) {
            const cleanPhone = session.user.phone.replace(/^\+91/, '')
            setForm((f) => ({ ...f, phone: cleanPhone }))
        }
    }, [session])

    const toggleArrayItem = useCallback((field: 'subjects' | 'classes_taught' | 'time_slots', value: string) => {
        setForm((prev) => {
            const arr = prev[field]
            return {
                ...prev,
                [field]: arr.includes(value)
                    ? arr.filter((v) => v !== value)
                    : [...arr, value],
            }
        })
    }, [])

    const canProceedStep1 = 
        form.full_name.trim() && 
        form.phone.trim().length === 10 &&
        form.city.trim() && 
        form.district.trim() && 
        form.area_mohalla.trim() &&
        (form.pincode === '' || /^[1-8]\d{5}$/.test(form.pincode))

    const canProceedStep2 = 
        form.subjects.length > 0 && 
        form.classes_taught.length > 0 &&
        (form.experience_years === '' || (Number(form.experience_years) >= 0 && Number(form.experience_years) <= 80))

    function handleNext() {
        if (step < TOTAL_STEPS) setStep(step + 1)
    }

    function handleBack() {
        if (step > 1) setStep(step - 1)
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        if (!session?.user?.id) return

        setSaving(true)
        setError(null)

        try {
            // Strictly E.164 formatted WhatsApp phone number
            const phone_e164 = `+91${form.phone.trim()}`

            await upsertTeacherProfile({
                teacher_id: session.user.id,
                full_name: form.full_name.trim(),
                phone_e164,
                bio: form.bio.trim() || null,
                city: form.city.trim(),
                district: form.district.trim(),
                state: 'Uttar Pradesh',
                area_mohalla: form.area_mohalla.trim() || null,
                pincode: form.pincode.trim() || null,
                subjects: form.subjects,
                classes_taught: form.classes_taught,
                medium: form.medium as TeachingMedium,
                experience_years: parseInt(form.experience_years) || 0,
                time_slots: form.time_slots,
                home_tuition: form.home_tuition,
                online_tuition: form.online_tuition,
                fee_min: parseInt(form.fee_min) || null,
                fee_max: parseInt(form.fee_max) || null,
                fee_negotiable: form.fee_negotiable,
                is_open_to_school: form.is_open_to_school,
                is_active: true,
            })

            navigate('/dashboard', { replace: true })
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Profile save mein dikkat aayi. Dobara try karein.'
            setError(message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className="flex min-h-screen w-full flex-col bg-[linear-gradient(180deg,#f6f0e6_0%,#fefcf8_35%,#ffffff_100%)] text-slate-800 selection:bg-[#e07a2f] selection:text-white">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <AnimatedLogo />
                    <div>
                        <h1 className="font-display text-xl font-semibold text-slate-800">Profile Setup</h1>
                        <p className="text-[11px] text-slate-500">Apni teaching profile banayein</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <section className="flex-1 px-5 py-6 pb-40 lg:px-8">
                <ProgressBar step={step} />

                <form onSubmit={handleSubmit}>
                    {/* ---- Step 1: Basic Info ---- */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in">
                            <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
                                📝 Basic Information
                            </h2>

                            <div>
                                <FormLabel>Full Name *</FormLabel>
                                <TextInput
                                    value={form.full_name}
                                    onChange={(v) => setForm({ ...form, full_name: v })}
                                    placeholder="Aapka poora naam"
                                    required
                                />
                            </div>

                            <div>
                                <FormLabel>WhatsApp Number *</FormLabel>
                                <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-surface focus-within:border-[#e07a2f] focus-within:ring-2 focus-within:ring-[#e07a2f]/20 transition-all">
                                    <span className="grid w-14 place-items-center border-r border-slate-200 bg-slate-50 text-sm font-bold text-slate-500">+91</span>
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        placeholder="9876543210"
                                        required
                                        maxLength={10}
                                        className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <FormLabel>Area / Mohalla *</FormLabel>
                                <TextInput
                                    value={form.area_mohalla}
                                    onChange={(v) => setForm({ ...form, area_mohalla: v })}
                                    placeholder="Civil Lines, Gandhi Nagar..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <FormLabel>City *</FormLabel>
                                    <TextInput
                                        value={form.city}
                                        onChange={(v) => setForm({ ...form, city: v })}
                                        placeholder="Gonda"
                                        required
                                    />
                                </div>
                                <div>
                                    <FormLabel>District *</FormLabel>
                                    <TextInput
                                        value={form.district}
                                        onChange={(v) => setForm({ ...form, district: v })}
                                        placeholder="Gonda"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <FormLabel>Pincode</FormLabel>
                                <TextInput
                                    value={form.pincode}
                                    onChange={(v) => setForm({ ...form, pincode: v.replace(/\D/g, '').slice(0, 6) })}
                                    placeholder="271001"
                                    maxLength={6}
                                />
                                {form.pincode && !/^[1-8]\d{5}$/.test(form.pincode) && (
                                    <p className="text-[10px] text-rose-500 mt-1">6 digit valid pincode dalein.</p>
                                )}
                            </div>

                            <div>
                                <FormLabel>Bio — {200 - form.bio.length} chars left</FormLabel>
                                <textarea
                                    value={form.bio}
                                    onChange={(e) => setForm({ ...form, bio: e.target.value.slice(0, 200) })}
                                    placeholder="Apne baare mein kuch likhein..."
                                    maxLength={200}
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-200 bg-surface px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#e07a2f] focus:outline-none focus:ring-2 focus:ring-[#e07a2f]/20 transition-all resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* ---- Step 2: Teaching Details ---- */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in">
                            <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
                                📚 Teaching Details
                            </h2>

                            <div>
                                <FormLabel>Subjects * (select karo)</FormLabel>
                                <ChipSelector
                                    options={SUBJECTS}
                                    selected={form.subjects}
                                    onToggle={(v) => toggleArrayItem('subjects', v)}
                                    columns={3}
                                />
                            </div>

                            <div>
                                <FormLabel>Classes * (select karo)</FormLabel>
                                <ChipSelector
                                    options={CLASSES}
                                    selected={form.classes_taught}
                                    onToggle={(v) => toggleArrayItem('classes_taught', v)}
                                    columns={4}
                                />
                            </div>

                            <div>
                                <FormLabel>Medium</FormLabel>
                                <div className="flex gap-2">
                                    {MEDIUMS.map((m) => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => setForm({ ...form, medium: m })}
                                            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${form.medium === m
                                                    ? 'border-[#e07a2f] bg-[#e07a2f]/10 text-[#e07a2f]'
                                                    : 'border-slate-200 bg-surface text-slate-500 hover:border-[#e07a2f]/40'
                                                }`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <FormLabel>Experience (years)</FormLabel>
                                <TextInput
                                    type="number"
                                    value={form.experience_years}
                                    onChange={(v) => {
                                        const n = v.replace(/\D/g, '').slice(0, 2)
                                        const num = Number(n)
                                        if (n === '' || (num >= 0 && num <= 80)) {
                                            setForm({ ...form, experience_years: n })
                                        }
                                    }}
                                    placeholder="6"
                                />
                            </div>

                            <div>
                                <FormLabel>Time Slots (select karo)</FormLabel>
                                <ChipSelector
                                    options={TIME_SLOTS}
                                    selected={form.time_slots}
                                    onToggle={(v) => toggleArrayItem('time_slots', v)}
                                    columns={2}
                                />
                            </div>
                        </div>
                    )}

                    {/* ---- Step 3: Fees & Availability ---- */}
                    {step === 3 && (
                        <div className="space-y-4 animate-in fade-in">
                            <h2 className="font-display text-lg font-semibold text-slate-800 mb-4">
                                💰 Fees & Availability
                            </h2>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <FormLabel>Min Fee (₹/month)</FormLabel>
                                    <TextInput
                                        type="number"
                                        value={form.fee_min}
                                        onChange={(v) => setForm({ ...form, fee_min: v })}
                                        placeholder="500"
                                    />
                                </div>
                                <div>
                                    <FormLabel>Max Fee (₹/month)</FormLabel>
                                    <TextInput
                                        type="number"
                                        value={form.fee_max}
                                        onChange={(v) => setForm({ ...form, fee_max: v })}
                                        placeholder="1000"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <Toggle
                                    label="Fee negotiable hai?"
                                    checked={form.fee_negotiable}
                                    onChange={(v) => setForm({ ...form, fee_negotiable: v })}
                                />
                                <Toggle
                                    label="Home tuition available"
                                    checked={form.home_tuition}
                                    onChange={(v) => setForm({ ...form, home_tuition: v })}
                                />
                                <Toggle
                                    label="Online tuition available"
                                    checked={form.online_tuition}
                                    onChange={(v) => setForm({ ...form, online_tuition: v })}
                                />
                                <Toggle
                                    label="School positions ke liye available"
                                    checked={form.is_open_to_school}
                                    onChange={(v) => setForm({ ...form, is_open_to_school: v })}
                                />
                            </div>
                        </div>
                    )}

                    {/* ---- Error ---- */}
                    {error && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* ---- Navigation Buttons ---- */}
                    <div className="mt-8 flex gap-3">
                        {step > 1 && (
                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex-1 rounded-2xl border border-slate-200 bg-surface py-3.5 text-sm font-semibold text-slate-500 hover:border-[#e07a2f]/40 hover:text-slate-800 transition-all"
                            >
                                ← Peeche
                            </button>
                        )}

                        {step < TOTAL_STEPS ? (
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                                className="flex-1 rounded-2xl border border-[#e07a2f] bg-[#e07a2f] py-3.5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(224,122,47,0.35)] hover:shadow-[0_12px_24px_rgba(224,122,47,0.45)] transition-all disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
                            >
                                Aage →
                            </button>
                        ) : (
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 rounded-2xl border border-[#e07a2f] bg-[#e07a2f] py-3.5 text-sm font-semibold text-white shadow-[0_8px_16px_rgba(224,122,47,0.35)] hover:shadow-[0_12px_24px_rgba(224,122,47,0.45)] transition-all disabled:opacity-60"
                            >
                                {saving ? 'Saving...' : '✅ Profile Banayein'}
                            </button>
                        )}
                    </div>
                </form>
            </section>
        </main>
    )
}
