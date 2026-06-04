import { useState, useEffect } from 'react'
import { AlertTriangleIcon, XIcon } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void
  onCancel: () => void
  dontAskAgain?: boolean
  onDontAskAgainChange?: (checked: boolean) => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
  dontAskAgain = false,
  onDontAskAgainChange,
}: ConfirmDialogProps) {
  const [localOpen, setLocalOpen] = useState(false)

  useEffect(() => {
    setLocalOpen(open)
  }, [open])

  if (!localOpen) return null

  const handleConfirm = () => {
    onConfirm()
    setLocalOpen(false)
  }

  const handleCancel = () => {
    onCancel()
    setLocalOpen(false)
  }

  const variantStyles = {
    danger: 'border-destructive/50 bg-destructive/5',
    warning: 'border-yellow-500/50 bg-yellow-500/5',
    info: 'border-primary/50 bg-primary/5',
  }

  const buttonStyles = {
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600',
    info: 'bg-primary text-primary-foreground hover:bg-primary/90',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className={cn(
        'relative z-10 w-full max-w-md rounded-lg border p-6 shadow-xl animate-in zoom-in-95',
        variantStyles[variant]
      )}>
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="h-4 w-4" />
        </button>

        {/* Icon */}
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangleIcon className="h-5 w-5 text-destructive" />
        </div>

        {/* Content */}
        <h3 className="mb-2 text-base font-semibold">{title}</h3>
        <p className="mb-6 text-sm text-muted-foreground">{message}</p>

        {/* Don't ask again checkbox */}
        {onDontAskAgainChange && (
          <label className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={dontAskAgain}
              onChange={(e) => onDontAskAgainChange(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Don't ask again for this action
          </label>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-md transition-colors',
              buttonStyles[variant]
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to manage "don't ask again" preference for dangerous actions.
 */
export function useDangerousActionPrefs(actionKey: string) {
  const [dontAskAgain, setDontAskAgain] = useState(false)
  const STORAGE_KEY = `dangerousAction_${actionKey}`

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY).then((result) => {
      setDontAskAgain(result[STORAGE_KEY] === true)
    })
  }, [actionKey])

  const handleDontAskAgainChange = (checked: boolean) => {
    setDontAskAgain(checked)
    chrome.storage.local.set({ [STORAGE_KEY]: checked })
  }

  const shouldConfirm = !dontAskAgain

  return { dontAskAgain, setDontAskAgain: handleDontAskAgainChange, shouldConfirm }
}