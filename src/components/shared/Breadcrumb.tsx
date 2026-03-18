'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

const SEGMENT_LABELS: Record<string, string> = {
  vault: 'Vault',
  builds: 'Loadouts',
  accessories: 'Accessories',
  ammo: 'Ammo',
  range: 'Range',
  settings: 'Settings',
  new: 'New',
  edit: 'Edit',
}

interface BreadcrumbProps {
  /** Map of path segment (e.g. a cuid ID) → human-readable label */
  dynamicLabels?: Record<string, string>
}

export function Breadcrumb({ dynamicLabels = {} }: BreadcrumbProps) {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  const items: { label: string; href: string }[] = [
    { label: 'Command', href: '/' },
  ]

  let path = ''
  for (const seg of segments) {
    path += `/${seg}`
    const label =
      dynamicLabels[seg] ??
      SEGMENT_LABELS[seg] ??
      seg.charAt(0).toUpperCase() + seg.slice(1)
    items.push({ label, href: path })
  }

  if (items.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className="px-6 pt-4 pb-0">
      <ol className="flex items-center gap-1 flex-wrap">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={item.href} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="w-3 h-3 text-vault-text-faint shrink-0" />
              )}
              {isLast ? (
                <span className="text-xs text-vault-text font-medium truncate max-w-[180px]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-xs text-vault-text-muted hover:text-vault-text transition-colors truncate max-w-[120px]"
                >
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
