'use client'

type Props = { status: string; className?: string }

const STATUS_STYLES: Record<string, string> = {
  'in-progress':
    'bg-[rgba(0,194,255,0.12)] text-[#00C2FF] border border-[rgba(0,194,255,0.3)]',
  complete:
    'bg-[rgba(0,200,83,0.12)] text-[#00C853] border border-[rgba(0,200,83,0.3)]',
  wishlist:
    'bg-[rgba(245,166,35,0.12)] text-[#F5A623] border border-[rgba(245,166,35,0.3)]',
}

const STATUS_LABELS: Record<string, string> = {
  'in-progress': 'In Progress',
  complete: 'Complete',
  wishlist: 'Wishlist',
}

export function BuildStatusBadge({ status, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-vault-muted text-vault-text-muted border border-vault-border'} ${className}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
