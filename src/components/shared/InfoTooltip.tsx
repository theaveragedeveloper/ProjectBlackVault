'use client'

import * as Tooltip from '@radix-ui/react-tooltip'
import { Info } from 'lucide-react'

interface InfoTooltipProps {
  content: string
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            className="inline-flex text-vault-text-faint hover:text-vault-text-muted ml-1.5 align-middle transition-colors"
            aria-label="More info"
          >
            <Info size={13} />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={4}
            className="bg-vault-surface border border-vault-border text-xs text-vault-text-muted rounded px-3 py-2 max-w-xs shadow-lg z-[200] leading-relaxed"
          >
            {content}
            <Tooltip.Arrow className="fill-vault-border" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
