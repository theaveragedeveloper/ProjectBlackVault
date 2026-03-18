'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info } from 'lucide-react'
import { useVaultStore, type Toast } from '@/lib/store'

const ICON_MAP = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  error: <XCircle className="w-4 h-4 shrink-0" />,
  info: <Info className="w-4 h-4 shrink-0" />,
}

const BORDER_MAP = {
  success: 'border-l-4 border-l-[#00C853]',
  error: 'border-l-4 border-l-[#E53935]',
  info: 'border-l-4 border-l-[#00C2FF]',
}

const TEXT_MAP = {
  success: 'text-[#00C853]',
  error: 'text-[#E53935]',
  info: 'text-[#00C2FF]',
}

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useVaultStore((s) => s.removeToast)

  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id)
    }, toast.duration ?? 3000)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, removeToast])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`pointer-events-auto flex items-start gap-3 bg-vault-surface-2 border border-vault-border ${BORDER_MAP[toast.type]} rounded px-4 py-3 text-sm text-vault-text shadow-lg min-w-[260px] max-w-sm`}
    >
      <span className={TEXT_MAP[toast.type]}>{ICON_MAP[toast.type]}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-vault-text-faint hover:text-vault-text transition-colors mt-0.5"
        aria-label="Dismiss"
      >
        ×
      </button>
    </motion.div>
  )
}

export function ToastProvider() {
  const toasts = useVaultStore((s) => s.toasts)

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
