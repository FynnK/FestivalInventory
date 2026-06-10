import type { ReactNode } from 'react'
import { useI18n } from '../i18n'

export default function ConfirmationModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  loading,
  danger,
  children,
}: {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  danger?: boolean
  children?: ReactNode
}) {
  const { t } = useI18n()
  const resolvedConfirmLabel = confirmLabel ?? t('modal_confirm_default')
  const resolvedCancelLabel = cancelLabel ?? t('modal_cancel_default')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm mx-4 shadow-2xl w-full">
        <h4 className="text-lg font-bold mb-2 text-foreground">{title}</h4>
        <p className="text-muted-foreground mb-6">{message}</p>
        {children}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg border border-input text-foreground hover:bg-accent transition-colors font-medium"
            disabled={loading}
          >
            {resolvedCancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              danger
                ? 'bg-destructive text-destructive-foreground hover:opacity-90'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
            disabled={loading}
          >
            {loading ? '...' : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
