import { useEffect } from 'react'
import { cx } from '@/components/common/takhti-ui'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  return (
    <div aria-modal className="fixed inset-0 z-[70] flex items-end justify-center px-4 pb-6 md:items-center md:pb-0" role="dialog">
      <div className="absolute inset-0 bg-[rgba(20,12,4,0.45)]" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-[0_30px_60px_rgba(28,27,53,0.3)]">
        <h2 className="text-lg font-black text-[#1d1813]">{title}</h2>
        {description && <p className="mt-2 text-sm font-semibold leading-6 text-[#5d544c]">{description}</p>}
        <div className="mt-5 flex gap-2">
          <button
            className="flex-1 rounded-xl border border-[#eadfcd] bg-white px-4 py-3 text-sm font-bold text-[#5d544c]"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className={cx(
              'flex-1 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-md',
              tone === 'danger' ? 'bg-[#d84b3f]' : 'bg-[#4930a8]',
            )}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
