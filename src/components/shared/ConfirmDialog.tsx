"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { AlertTriangle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  dangerous?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  onConfirm,
  dangerous = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm bg-vault-surface border border-vault-border rounded-lg p-6 shadow-xl">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: dangerous ? "#E53935" : "#00C2FF" }} />
            <div>
              <Dialog.Title className="text-vault-text font-semibold text-sm">{title}</Dialog.Title>
              <Dialog.Description className="text-vault-text-muted text-xs mt-1">{description}</Dialog.Description>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => onOpenChange(false)}
              className="px-3 py-1.5 text-xs text-vault-text-muted bg-vault-bg border border-vault-border rounded hover:text-vault-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onConfirm(); onOpenChange(false); }}
              className="px-3 py-1.5 text-xs rounded font-medium transition-colors"
              style={dangerous
                ? { backgroundColor: "rgba(229,57,53,0.15)", color: "#E53935", border: "1px solid rgba(229,57,53,0.3)" }
                : { backgroundColor: "rgba(0,194,255,0.12)", color: "#00C2FF", border: "1px solid rgba(0,194,255,0.35)" }
              }
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
