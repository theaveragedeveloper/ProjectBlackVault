import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Toast ────────────────────────────────────────────────────────────────────

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number
}

interface ToastSlice {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

// ─── UI State ─────────────────────────────────────────────────────────────────

interface UISlice {
  buildSearch: string
  buildStatusFilter: string
  hasSeenIntro: boolean
  setBuildSearch: (v: string) => void
  setBuildStatusFilter: (v: string) => void
  setHasSeenIntro: (v: boolean) => void
}

export type VaultStore = ToastSlice & UISlice

export const useVaultStore = create<VaultStore>()(
  persist(
    (set) => ({
      // Toast slice (not persisted — in-memory only)
      toasts: [],
      addToast: (toast) =>
        set((s) => ({
          toasts: [
            ...s.toasts,
            { ...toast, id: Math.random().toString(36).slice(2) },
          ],
        })),
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      // UI slice (persisted to localStorage)
      buildSearch: '',
      buildStatusFilter: 'all',
      hasSeenIntro: false,
      setBuildSearch: (v) => set({ buildSearch: v }),
      setBuildStatusFilter: (v) => set({ buildStatusFilter: v }),
      setHasSeenIntro: (v) => set({ hasSeenIntro: v }),
    }),
    {
      name: 'vault-ui',
      partialize: (s) => ({
        buildSearch: s.buildSearch,
        buildStatusFilter: s.buildStatusFilter,
        hasSeenIntro: s.hasSeenIntro,
      }),
    }
  )
)

// ─── useToast convenience hook ────────────────────────────────────────────────

export function useToast() {
  const addToast = useVaultStore((s) => s.addToast)
  return {
    success: (message: string, duration?: number) =>
      addToast({ type: 'success', message, duration }),
    error: (message: string, duration?: number) =>
      addToast({ type: 'error', message, duration }),
    info: (message: string, duration?: number) =>
      addToast({ type: 'info', message, duration }),
  }
}
