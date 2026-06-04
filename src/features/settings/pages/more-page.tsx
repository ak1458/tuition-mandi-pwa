import { useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers/auth-provider'
import { usePlan } from '@/hooks/use-plan'
import { LanguageSwitcher } from '@/components/common/language-switcher'
import { useTheme } from '@/hooks/use-theme'
import { Icon, PageHeader, cx, type IconName } from '@/components/common/tuition-mandi-ui'
import { Avatar, Btn, Card, Pill, Verified } from '@/components/common/tm-kit'
import { ConfirmDialog } from '@/components/common/confirm-dialog'
import { useTuitionMandiCopy } from '@/i18n/tuition-mandi-copy'
import { hasSupabaseConfig } from '@/lib/env'
import { supabase } from '@/lib/supabase-client'
import {
  DEFAULT_PREFS,
  getPreferences,
  onPreferencesChange,
  setPreferences,
  type NotificationPreferences,
} from '@/lib/preferences'
import { getLocalState } from '@/lib/local-data'

interface SectionProps {
  title: string
  description?: string
  children: ReactNode
}

function Section({ title, description, children }: SectionProps) {
  return (
    <section className="mt-4 rounded-[20px] border border-[#e5decf] bg-white p-4 shadow-sm">
      <h2 className="text-[13px] font-black uppercase tracking-wide text-[#1c1916]">{title}</h2>
      {description && <p className="mt-1 text-[11px] font-semibold text-[#847a6c]">{description}</p>}
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  )
}

function Row({
  icon,
  iconTone = 'green',
  label,
  hint,
  trailing,
  onClick,
  divider = true,
}: {
  icon?: IconName
  iconTone?: 'green' | 'orange' | 'purple' | 'rose' | 'paper'
  label: string
  hint?: string
  trailing?: ReactNode
  onClick?: () => void
  divider?: boolean
}) {
  const tone =
    iconTone === 'green'
      ? 'bg-[#dcf1e7] text-[#138a5e]'
      : iconTone === 'orange'
      ? 'bg-[#fff4df] text-[#c87b22]'
      : iconTone === 'purple'
      ? 'bg-[#f1edff] text-[#d6850a]'
      : iconTone === 'rose'
      ? 'bg-[#fbe6e1] text-[#e14b36]'
      : 'bg-[#f4f1ea] text-[#5d544c]'

  const Component: 'button' | 'div' = onClick ? 'button' : 'div'

  return (
    <Component
      className={cx(
        'flex w-full items-center gap-3 px-1 py-3 text-left',
        divider && 'border-b border-[#ece7dc] last:border-b-0',
      )}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      {icon && (
        <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', tone)}>
          <Icon className="h-4 w-4" name={icon} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-[#1c1916]">{label}</p>
        {hint && <p className="mt-0.5 truncate text-[11px] font-semibold text-[#847a6c]">{hint}</p>}
      </div>
      {trailing ?? (onClick && <Icon className="h-4 w-4 text-[#847a6c]" name="chevron-right" />)}
    </Component>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={cx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-[#138a5e]' : 'bg-[#d8cdba]',
      )}
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span
        className={cx(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  )
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function MorePage() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const { isPro, planExpiresAt } = usePlan()
  const { t } = useTranslation()
  const copy = useTuitionMandiCopy()
  const { theme, toggle: toggleTheme } = useTheme()
  const teacherId = session?.user.id ?? ''
  const teacherName =
    (session?.user?.user_metadata?.full_name as string | undefined) || t('common.teacher')
  const teacherPhone = session?.user.phone ?? ''

  // Subscribe to preferences changes via useSyncExternalStore (React 19 friendly).
  const prefsSnapshot = useSyncExternalStore(
    (callback) => onPreferencesChange(callback),
    () => (teacherId ? localStorage.getItem(`tuition_mandi_user_prefs_v1:${teacherId}`) ?? '' : ''),
    () => '',
  )
  const loaded = useMemo(
    () => (teacherId ? getPreferences(teacherId) : DEFAULT_PREFS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teacherId, prefsSnapshot],
  )
  const prefs: NotificationPreferences = loaded.notifications
  const sharePhone = loaded.share_phone_with_parents

  const [logoutOpen, setLogoutOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const persist = (next: Partial<{ notifications: NotificationPreferences; share_phone_with_parents: boolean }>) => {
    if (!teacherId) return
    const current = getPreferences(teacherId)
    const merged = { ...current, ...next }
    // Update local storage key helper inside preferences helper is handled,
    // but we can map the preferences set/get keys too.
    setPreferences(teacherId, merged)
    setToast('Settings saved.')
    window.setTimeout(() => setToast(null), 1500)
  }

  const exportData = async () => {
    if (!teacherId) return

    const localState = getLocalState(teacherId)
    let cloudData: unknown = null

    // If we have a real Supabase session, also pull cloud data via the
    // data-export edge function.
    if (hasSupabaseConfig) {
      try {
        const { data, error } = await supabase.functions.invoke('data-export', { body: {} })
        if (!error && data) cloudData = data
      } catch {
        // Non-fatal — local export still works.
      }
    }

    downloadJson(`tuition-mandi-export-${teacherId}.json`, {
      exported_at: new Date().toISOString(),
      teacher_id: teacherId,
      teacher_name: teacherName,
      local: localState,
      cloud: cloudData,
    })
    setToast('Data export ho gaya.')
    window.setTimeout(() => setToast(null), 1800)
  }

  const handleDelete = async () => {
    if (teacherId) {
      // First wipe all teacher data namespaces in localStorage
      const prefixes = [
        `tuition_mandi_local_state_v1:${teacherId}`,
        `tuition_mandi_local_plan_v1:${teacherId}`,
        `tuition_mandi_user_prefs_v1:${teacherId}`,
        `tuition_mandi_notifications_v1:${teacherId}`,
      ]
      prefixes.forEach((key) => localStorage.removeItem(key))

      // Then ask the server to erase cloud data + auth.users row.
      // Ignore errors — we still sign the user out locally.
      if (hasSupabaseConfig) {
        try {
          await supabase.functions.invoke('account-deletion', { body: {} })
        } catch {
          // best-effort
        }
      }
    }
    await signOut()
    navigate('/', { replace: true })
  }

  const planSubtitle = useMemo(() => {
    if (isPro) {
      const expires = planExpiresAt ? new Date(planExpiresAt).toLocaleDateString('en-IN') : null
      return expires ? `Pro plan active - expires ${expires}` : copy.more.proPlan
    }
    return copy.more.freePlan
  }, [copy.more.freePlan, copy.more.proPlan, isPro, planExpiresAt])

  return (
    <div className="min-h-full bg-[#f4f1ea] pb-24">
      <PageHeader subtitle={copy.more.subtitle} title={copy.more.title} />

      <section className="px-4 py-4">
        {/* Profile header — Clone-design */}
        <Card pad={18}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Avatar name={teacherName} size={66} radius={20} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="font-display" style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{teacherName}</span>
                {isPro && <Verified size={18} />}
              </div>
              {teacherPhone && <div className="font-mono" style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 2 }}>{teacherPhone}</div>}
              <div style={{ marginTop: 7 }}><Pill tone={isPro ? 'leaf' : 'gold'} dot>{planSubtitle}</Pill></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Btn variant="ghost" full onClick={() => navigate('/profile/setup')}>Edit Profile</Btn>
            <Btn variant={isPro ? 'soft' : 'ink'} full onClick={() => navigate('/inquiries')}>{isPro ? 'Manage Plan' : copy.more.premium}</Btn>
          </div>
        </Card>

        {toast && (
          <p className="mt-3 rounded-xl bg-[#dcf1e7] px-3 py-2 text-center text-sm font-bold text-[#138a5e]">{toast}</p>
        )}

        {/* Notifications */}
        <Section description="Choose how you want to be notified" title="Notifications">
          <Row
            divider
            icon="bell"
            iconTone="green"
            label="In-app push"
            hint="Bell badge on every screen"
            trailing={<Toggle checked={prefs.push} label="In-app push" onChange={(next) => persist({ notifications: { ...prefs, push: next } })} />}
          />
          <Row
            divider
            icon="whatsapp"
            iconTone="green"
            label="WhatsApp summaries"
            hint="Daily attendance & fee summary"
            trailing={
              <Toggle checked={prefs.whatsapp} label="WhatsApp summaries" onChange={(next) => persist({ notifications: { ...prefs, whatsapp: next } })} />
            }
          />
          <Row
            divider
            icon="message"
            iconTone="purple"
            label="Email digests"
            hint="Weekly performance email"
            trailing={
              <Toggle checked={prefs.email} label="Email digests" onChange={(next) => persist({ notifications: { ...prefs, email: next } })} />
            }
          />
          <Row
            divider
            icon="rupee"
            iconTone="orange"
            label="Fee reminder alerts"
            trailing={
              <Toggle checked={prefs.feeReminders} label="Fee reminder alerts" onChange={(next) => persist({ notifications: { ...prefs, feeReminders: next } })} />
            }
          />
          <Row
            divider={false}
            icon="users"
            iconTone="purple"
            label="Parent inquiry alerts"
            trailing={
              <Toggle checked={prefs.inquiries} label="Parent inquiry alerts" onChange={(next) => persist({ notifications: { ...prefs, inquiries: next } })} />
            }
          />
        </Section>

        {/* Account & Privacy */}
        <Section description="Control how your profile appears to parents" title="Privacy">
          <Row
            divider
            icon="phone"
            iconTone="green"
            label="Show phone to parents"
            hint="Disable to keep number private"
            trailing={<Toggle checked={sharePhone} label="Share phone with parents" onChange={(next) => persist({ share_phone_with_parents: next })} />}
          />
          <Row icon="eye" iconTone="purple" label="Profile visibility" hint="Who can see your profile" onClick={() => navigate('/profile/setup')} />
          <Row divider={false} icon="key" iconTone="orange" label="Account security" hint="Change phone or email login" onClick={() => navigate('/login')} />
        </Section>

        {/* Preferences */}
        <Section title="Preferences">
          <div className="flex items-center justify-between gap-3 px-1 py-2">
            <span className="text-sm font-black text-[#1c1916]">{copy.more.language}</span>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center justify-between gap-3 px-1 py-2">
            <span className="flex items-center gap-2 text-sm font-black text-[#1c1916]">
              <Icon name={theme === 'dark' ? 'moon' : 'sun'} className="h-4 w-4 text-marigold-deep" />
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <Toggle checked={theme === 'dark'} label="Toggle dark mode" onChange={toggleTheme} />
          </div>
        </Section>

        {/* Tools */}
        <Section title="Tools">
          <Row icon="message" iconTone="purple" label={copy.more.parentInquiries} hint="See and reply to parent leads" onClick={() => navigate('/inquiries')} />
          <Row icon="rupee" iconTone="orange" label={copy.more.feeSettings} hint="Track and reminders" onClick={() => navigate('/fees')} />
          <Row divider={false} icon="layout" iconTone="green" label="My students" hint="Add, edit, archive" onClick={() => navigate('/students')} />
        </Section>

        {/* Data */}
        <Section description="Export or delete your data anytime" title="Your Data">
          <Row icon="report" iconTone="purple" label="Export all data (JSON)" hint="Download students, attendance, fees, reports" onClick={exportData} />
          <Row divider={false} icon="lock" iconTone="rose" label="Delete account & data" hint="This cannot be undone" onClick={() => setDeleteOpen(true)} />
        </Section>

        {/* Support */}
        <Section title="Support">
          <Row icon="phone" iconTone="green" label={copy.more.help} hint="WhatsApp / Email TuitionMandi team" onClick={() => navigate('/help')} />
          <Row icon="star" iconTone="orange" label={copy.demo.moreSettingsTitle} hint={copy.demo.moreSettingsHint} />
          <Row icon="settings" iconTone="paper" label="About TuitionMandi" hint="Version 1.0 - Your Digital Register" />
          <Row icon="check" iconTone="purple" label="Privacy Policy" hint="How we handle your data" onClick={() => navigate('/privacy')} />
          <Row icon="check" iconTone="purple" label="Terms & Conditions" hint="Rules of using TuitionMandi" onClick={() => navigate('/terms')} />
          <Row icon="rupee" iconTone="orange" label="Refund Policy" hint="Cancellation & refund terms" onClick={() => navigate('/refund')} />
          <Row divider={false} icon="phone" iconTone="green" label="Contact Us" hint="Business details & grievance" onClick={() => navigate('/contact')} />
        </Section>

        <button
          className="mt-5 w-full rounded-xl border border-[#e5decf] bg-white py-3 text-sm font-bold text-[#e14b36]"
          onClick={() => setLogoutOpen(true)}
          type="button"
        >
          {copy.more.logout}
        </button>
      </section>

      <ConfirmDialog
        cancelLabel="Rehne dein"
        confirmLabel="Logout"
        description="Aap apne dashboard se sign out ho jayenge. Dobara login karne ke liye OTP chahiye hoga."
        onCancel={() => setLogoutOpen(false)}
        onConfirm={async () => {
          setLogoutOpen(false)
          await signOut()
          navigate('/', { replace: true })
        }}
        open={logoutOpen}
        title="Logout karein?"
        tone="danger"
      />

      <ConfirmDialog
        cancelLabel="Cancel"
        confirmLabel="Yes, delete everything"
        description="Aapke saare students, attendance, fees aur reports permanently delete ho jayenge. Yeh action wapas nahi ho sakta."
        onCancel={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleteOpen(false)
          await handleDelete()
        }}
        open={deleteOpen}
        title="Account aur data delete karein?"
        tone="danger"
      />
    </div>
  )
}
