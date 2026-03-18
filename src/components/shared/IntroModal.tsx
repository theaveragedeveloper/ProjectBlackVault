'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { ChevronRight, Layers, Package, Tag } from 'lucide-react'
import { useVaultStore } from '@/lib/store'

export function IntroModal() {
  const hasSeenIntro = useVaultStore((s) => s.hasSeenIntro)
  const setHasSeenIntro = useVaultStore((s) => s.setHasSeenIntro)

  return (
    <Dialog.Root open={!hasSeenIntro} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-[150] backdrop-blur-sm" />
        <Dialog.Content
          className="fixed inset-0 z-[151] flex items-center justify-center p-4"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="bg-vault-surface border border-vault-border rounded-xl w-full max-w-md shadow-2xl animate-slide-up">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-vault-border">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center">
                  <Tag className="w-4 h-4 text-[#00C2FF]" />
                </div>
                <Dialog.Title className="text-base font-bold text-vault-text tracking-wide">
                  Welcome to BlackVault
                </Dialog.Title>
              </div>
              <Dialog.Description className="text-sm text-vault-text-muted">
                Track, configure, and manage your firearms builds
              </Dialog.Description>
            </div>

            {/* Data model diagram */}
            <div className="px-6 py-5">
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint font-mono mb-4">
                How it works
              </p>
              <div className="flex items-center gap-2 mb-6">
                {/* Build */}
                <div className="flex-1 bg-vault-surface-2 border border-[#00C2FF]/30 rounded-lg p-3 text-center">
                  <Layers className="w-5 h-5 text-[#00C2FF] mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-vault-text">Build</p>
                  <p className="text-[10px] text-vault-text-faint mt-0.5">Your config</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#00C2FF] shrink-0" />
                {/* Categories */}
                <div className="flex-1 bg-vault-surface-2 border border-[#F5A623]/30 rounded-lg p-3 text-center">
                  <div className="w-5 h-5 mx-auto mb-1.5 flex flex-col gap-0.5 justify-center">
                    <div className="h-1 bg-[#F5A623]/60 rounded-full" />
                    <div className="h-1 bg-[#F5A623]/40 rounded-full" />
                    <div className="h-1 bg-[#F5A623]/20 rounded-full" />
                  </div>
                  <p className="text-xs font-semibold text-vault-text">Categories</p>
                  <p className="text-[10px] text-vault-text-faint mt-0.5">Upper, Lower…</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#00C2FF] shrink-0" />
                {/* Parts */}
                <div className="flex-1 bg-vault-surface-2 border border-[#00C853]/30 rounded-lg p-3 text-center">
                  <Package className="w-5 h-5 text-[#00C853] mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-vault-text">Parts</p>
                  <p className="text-[10px] text-vault-text-faint mt-0.5">Accessories</p>
                </div>
              </div>

              {/* Bullets */}
              <ul className="space-y-2">
                {[
                  'A Build is your complete firearm configuration',
                  'Each Build contains Parts organized by Category',
                  'Track cost, status, and notes per build',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-vault-text-muted">
                    <span className="w-1 h-1 rounded-full bg-[#00C2FF] mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setHasSeenIntro(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
              >
                Got it, let&apos;s go
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
