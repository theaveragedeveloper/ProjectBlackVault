'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Layers,
  Settings2,
  CheckCircle2,
  Circle,
  Search,
  Copy,
  MoreHorizontal,
  X,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useVaultStore, useToast } from '@/lib/store'
import { BuildStatusBadge } from '@/components/builds/BuildStatusBadge'
import { BUILD_STATUSES } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface BuildSlot {
  id: string
  slotType: string
  accessoryId: string | null
  accessory: { purchasePrice: number | null } | null
}

interface Build {
  id: string
  name: string
  isActive: boolean
  status: string
  slots: BuildSlot[]
}

interface Firearm {
  id: string
  name: string
  type: string
  caliber: string
  builds: Build[]
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FIREARM_TYPE_LABELS: Record<string, string> = {
  PISTOL: 'Pistol', RIFLE: 'Rifle', SHOTGUN: 'Shotgun', SMG: 'SMG',
  PCC: 'PCC', REVOLVER: 'Revolver', BOLT_ACTION: 'Bolt Action', LEVER_ACTION: 'Lever Action',
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  PISTOL: 'border-[#00C2FF]/40 text-[#00C2FF]',
  RIFLE: 'border-[#00C853]/40 text-[#00C853]',
  SHOTGUN: 'border-[#F5A623]/40 text-[#F5A623]',
  SMG: 'border-[#9C27B0]/40 text-[#CE93D8]',
  PCC: 'border-[#00BCD4]/40 text-[#00BCD4]',
  REVOLVER: 'border-[#E53935]/40 text-[#EF9A9A]',
  BOLT_ACTION: 'border-[#8B9DB0]/40 text-vault-text-muted',
  LEVER_ACTION: 'border-[#FF7043]/40 text-[#FF7043]',
}

// ─── Build row action menu ────────────────────────────────────────────────────

function BuildActions({ build, firearm }: { build: Build; firearm: Firearm }) {
  const router = useRouter()
  const toast = useToast()
  const [duplicating, setDuplicating] = useState(false)

  async function handleDuplicate() {
    setDuplicating(true)
    try {
      const res = await fetch(`/api/builds/${build.id}/duplicate`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to duplicate')
      toast.success('Build duplicated')
      router.push(`/vault/${firearm.id}/builds/${json.build.id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate build')
      setDuplicating(false)
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1.5 rounded hover:bg-vault-surface-2 text-vault-text-faint hover:text-vault-text transition-colors"
          aria-label="Build actions"
          disabled={duplicating}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="bg-vault-surface border border-vault-border rounded-lg shadow-xl py-1 min-w-[160px] z-50"
        >
          <DropdownMenu.Item asChild>
            <Link
              href={`/vault/${firearm.id}/builds/${build.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-vault-text hover:bg-vault-surface-2 cursor-pointer outline-none"
            >
              <Settings2 className="w-3.5 h-3.5 text-[#00C2FF]" />
              Configure
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={handleDuplicate}
            disabled={duplicating}
            className="flex items-center gap-2 px-3 py-2 text-sm text-vault-text hover:bg-vault-surface-2 cursor-pointer outline-none disabled:opacity-50"
          >
            <Copy className="w-3.5 h-3.5 text-vault-text-muted" />
            {duplicating ? 'Duplicating…' : 'Duplicate'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

export function BuildsClient({ initialFirearms }: { initialFirearms: Firearm[] }) {
  const { buildSearch, buildStatusFilter, setBuildSearch, setBuildStatusFilter } =
    useVaultStore()

  const totalBuildsAll = initialFirearms.reduce((s, f) => s + f.builds.length, 0)
  const activeBuildsAll = initialFirearms.reduce(
    (s, f) => s + f.builds.filter((b) => b.isActive).length,
    0
  )

  // Apply filters
  const visible = initialFirearms
    .map((f) => ({
      ...f,
      builds: f.builds.filter((b) => {
        const matchStatus = buildStatusFilter === 'all' || b.status === buildStatusFilter
        const q = buildSearch.toLowerCase()
        const matchSearch =
          q === '' ||
          b.name.toLowerCase().includes(q) ||
          f.caliber.toLowerCase().includes(q) ||
          f.name.toLowerCase().includes(q)
        return matchStatus && matchSearch
      }),
    }))
    .filter((f) => f.builds.length > 0)

  const hasActiveFilters = buildSearch !== '' || buildStatusFilter !== 'all'

  // Empty state — no builds at all
  if (totalBuildsAll === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-6">
        <div className="w-20 h-20 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mb-6">
          <Layers className="w-10 h-10 text-[#00C2FF]" />
        </div>
        <h2 className="text-2xl font-bold text-vault-text mb-2 tracking-tight">
          Project BlackVault
        </h2>
        <p className="text-vault-text-muted mb-8 max-w-sm">
          Track, configure, and manage your firearms builds
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/vault"
            className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            Browse Your Vault
          </Link>
          <Link
            href="/vault/new"
            className="flex items-center gap-2 bg-vault-surface border border-vault-border text-vault-text hover:bg-vault-surface-2 px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
          >
            Add Your First Firearm
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Summary strip */}
      <div className="flex items-center gap-6 bg-vault-surface border border-vault-border rounded-lg px-5 py-3 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Total Builds</p>
          <p className="text-lg font-bold font-mono text-vault-text">{totalBuildsAll}</p>
        </div>
        <div className="w-px h-8 bg-vault-border" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Active Builds</p>
          <p className="text-lg font-bold font-mono text-[#00C853]">{activeBuildsAll}</p>
        </div>
        <div className="w-px h-8 bg-vault-border" />
        <div>
          <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Platforms</p>
          <p className="text-lg font-bold font-mono text-vault-text">{initialFirearms.length}</p>
        </div>
      </div>

      {/* Search + filter row */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-vault-text-faint pointer-events-none" />
          <input
            type="search"
            placeholder="Search builds or firearms…"
            value={buildSearch}
            onChange={(e) => setBuildSearch(e.target.value)}
            className="w-full bg-vault-surface border border-vault-border text-vault-text rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] transition-colors"
          />
          {buildSearch && (
            <button
              onClick={() => setBuildSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-faint hover:text-vault-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select
          value={buildStatusFilter}
          onChange={(e) => setBuildStatusFilter(e.target.value)}
          className="bg-vault-surface border border-vault-border text-vault-text-muted rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] transition-colors"
        >
          <option value="all">All Statuses</option>
          {BUILD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Filter empty state */}
      {visible.length === 0 && hasActiveFilters && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-vault-text-muted mb-3 text-sm">No builds match your filters.</p>
          <button
            onClick={() => { setBuildSearch(''); setBuildStatusFilter('all') }}
            className="text-[#00C2FF] text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grouped by firearm */}
      {visible.map((firearm) => {
        const typeBadge = TYPE_BADGE_COLORS[firearm.type] ?? 'border-vault-border text-vault-text-muted'
        const typeLabel = FIREARM_TYPE_LABELS[firearm.type] ?? firearm.type

        return (
          <section key={firearm.id}>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <Link
                href={`/vault/${firearm.id}`}
                className="text-base font-bold text-vault-text hover:text-[#00C2FF] transition-colors"
              >
                {firearm.name}
              </Link>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-mono uppercase ${typeBadge}`}>
                {typeLabel}
              </span>
              <span className="text-xs text-vault-text-faint font-mono">{firearm.caliber}</span>
              <div className="flex-1 h-px bg-vault-border" />
              <span className="text-[10px] text-vault-text-faint font-mono uppercase tracking-widest">
                {firearm.builds.length} build{firearm.builds.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-vault-border">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium">Build Name</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden sm:table-cell">Build Status</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden sm:table-cell">Active</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden md:table-cell">Slots</th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden lg:table-cell">Cost</th>
                    <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vault-border">
                  {firearm.builds.map((build) => {
                    const slotCount = build.slots.length
                    const accessoryCount = build.slots.filter((s) => s.accessoryId !== null).length
                    const totalCost = build.slots.reduce(
                      (sum, s) => sum + (s.accessory?.purchasePrice ?? 0),
                      0
                    )

                    return (
                      <tr key={build.id} className="hover:bg-vault-surface-2 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-vault-text-faint shrink-0" />
                            <Link
                              href={`/vault/${firearm.id}/builds/${build.id}`}
                              className="font-medium text-vault-text group-hover:text-[#00C2FF] transition-colors"
                            >
                              {build.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <BuildStatusBadge status={build.status} />
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          {build.isActive ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border border-[#00C853]/40 text-[#00C853] font-mono uppercase bg-[#00C853]/5">
                              <CheckCircle2 className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border border-vault-border text-vault-text-muted font-mono uppercase">
                              <Circle className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm font-mono text-vault-text-muted">
                            {accessoryCount}/{slotCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {totalCost > 0 ? (
                            <span className="text-sm font-mono text-vault-text-muted">
                              {formatCurrency(totalCost)}
                            </span>
                          ) : (
                            <span className="text-sm text-vault-text-faint">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/vault/${firearm.id}/builds/${build.id}`}
                              className="inline-flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-2.5 py-1 rounded transition-colors"
                            >
                              <Settings2 className="w-3 h-3" />
                              Configure
                            </Link>
                            <BuildActions build={build} firearm={firearm} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
