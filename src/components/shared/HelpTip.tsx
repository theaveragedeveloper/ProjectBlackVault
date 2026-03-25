"use client"

import * as Tooltip from "@radix-ui/react-tooltip"
import { HelpCircle } from "lucide-react"

interface HelpTipProps {
  text: string
}

export function HelpTip({ text }: HelpTipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button type="button" className="inline-flex items-center text-vault-text-faint hover:text-vault-text-muted transition-colors ml-1 align-middle">
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="max-w-xs px-3 py-2 text-xs text-vault-text-muted bg-vault-surface border border-vault-border rounded shadow-lg z-50"
            sideOffset={4}
          >
            {text}
            <Tooltip.Arrow className="fill-vault-border" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
