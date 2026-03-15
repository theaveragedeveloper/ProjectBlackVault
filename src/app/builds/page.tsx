export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Settings2, Layers, CheckCircle2, Circle } from "lucide-react";
import { SLOT_ICONS } from "@/lib/configurator/slot-icons";
import { FIREARM_TYPE_LABELS, TYPE_BADGE_COLORS } from "@/lib/types";
import type { SlotType } from "@/lib/types";

function formatSlotType(type: string): string {
  return type
    .split("_")
    .map((w) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

async function getAllBuilds() {
  const firearms = await prisma.firearm.findMany({
    include: {
      builds: {
        include: {
          slots: {
            select: {
              id: true,
              slotType: true,
              accessoryId: true,
              accessory: {
                select: { roundCount: true },
              },
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  return firearms.filter((f) => f.builds.length > 0);
}

export default async function BuildsPage() {
  const firearms = await getAllBuilds();

  const totalBuilds = firearms.reduce((sum, f) => sum + f.builds.length, 0);
  const activeBuilds = firearms.reduce(
    (sum, f) => sum + f.builds.filter((b) => b.isActive).length,
    0
  );

  return (
    <div className="min-h-full">
      <PageHeader
        title="ALL LOADOUTS"
        subtitle={`${totalBuilds} build${totalBuilds !== 1 ? "s" : ""} across ${firearms.length} firearm${firearms.length !== 1 ? "s" : ""}`}
      />

      <div className="p-6 space-y-8">
        {/* Summary strip */}
        <div className="flex items-center gap-6 bg-vault-surface border border-vault-border rounded-lg px-5 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">
              Total Builds
            </p>
            <p className="text-lg font-bold font-mono text-vault-text">{totalBuilds}</p>
          </div>
          <div className="w-px h-8 bg-vault-border" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">
              Active Builds
            </p>
            <p className="text-lg font-bold font-mono text-[#00C853]">{activeBuilds}</p>
          </div>
          <div className="w-px h-8 bg-vault-border" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">
              Platforms
            </p>
            <p className="text-lg font-bold font-mono text-vault-text">{firearms.length}</p>
          </div>
        </div>

        {/* No builds empty state */}
        {firearms.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 text-[#00C2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-vault-text mb-2">No loadouts yet</h3>
            <p className="text-sm text-vault-text-muted mb-6 max-w-sm">
              Open a firearm from the Vault and create your first build configuration.
            </p>
            <Link
              href="/vault"
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Go to Vault
            </Link>
          </div>
        )}

        {/* Grouped by firearm */}
        {firearms.map((firearm) => {
          const typeBadge =
            TYPE_BADGE_COLORS[firearm.type] ?? "border-vault-border text-vault-text-muted";
          const typeLabel = FIREARM_TYPE_LABELS[firearm.type] ?? firearm.type;

          return (
            <section key={firearm.id}>
              {/* Firearm group header */}
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href={`/vault/${firearm.id}`}
                  className="text-base font-bold text-vault-text hover:text-[#00C2FF] transition-colors"
                >
                  {firearm.name}
                </Link>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-mono uppercase ${typeBadge}`}
                >
                  {typeLabel}
                </span>
                <span className="text-xs text-vault-text-faint font-mono">{firearm.caliber}</span>
                <div className="flex-1 h-px bg-vault-border" />
                <span className="text-[10px] text-vault-text-faint font-mono uppercase tracking-widest">
                  {firearm.builds.length} build{firearm.builds.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Build cards grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {firearm.builds.map((build) => {
                  const slotCount = build.slots.length;
                  const equippedSlots = build.slots.filter((s) => s.accessoryId !== null);
                  const accessoryCount = equippedSlots.length;
                  const totalRounds = build.slots.reduce(
                    (sum, s) => sum + (s.accessory?.roundCount ?? 0),
                    0
                  );
                  const fillPct = slotCount > 0 ? Math.round((accessoryCount / slotCount) * 100) : 0;

                  return (
                    <div
                      key={build.id}
                      className={`bg-vault-surface border rounded-lg overflow-hidden flex flex-col transition-colors hover:border-[#00C2FF]/40 group ${
                        build.isActive
                          ? "border-[#00C853]/40"
                          : "border-vault-border"
                      }`}
                    >
                      {/* Active top bar */}
                      {build.isActive && (
                        <div className="h-0.5 bg-[#00C853]" />
                      )}

                      <div className="p-4 flex flex-col flex-1 gap-3">
                        {/* Header: name + status */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm text-vault-text group-hover:text-[#00C2FF] transition-colors leading-snug">
                            {build.name}
                          </h3>
                          {build.isActive ? (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-[#00C853]/40 text-[#00C853] font-mono uppercase bg-[#00C853]/5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Active
                            </span>
                          ) : (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-vault-border text-vault-text-faint font-mono uppercase">
                              <Circle className="w-2.5 h-2.5" />
                              Inactive
                            </span>
                          )}
                        </div>

                        {/* Slot icon grid */}
                        {slotCount > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {build.slots.map((slot) => {
                              const iconCfg = SLOT_ICONS[slot.slotType as SlotType];
                              if (!iconCfg) return null;
                              const IconComp = iconCfg.icon;
                              const equipped = slot.accessoryId !== null;

                              return equipped ? (
                                <div
                                  key={slot.id}
                                  title={formatSlotType(slot.slotType)}
                                  className="w-7 h-7 rounded flex items-center justify-center border transition-colors"
                                  style={{
                                    borderColor: `${iconCfg.color}50`,
                                    backgroundColor: `${iconCfg.color}15`,
                                  }}
                                >
                                  <IconComp
                                    className="w-3.5 h-3.5"
                                    style={{ color: iconCfg.color }}
                                  />
                                </div>
                              ) : (
                                <div
                                  key={slot.id}
                                  title={formatSlotType(slot.slotType)}
                                  className="w-7 h-7 rounded flex items-center justify-center border border-vault-border bg-vault-bg/50 transition-colors"
                                >
                                  <IconComp className="w-3.5 h-3.5 text-vault-text-faint opacity-40" />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-vault-text-faint italic">No slots configured</p>
                        )}

                        {/* Progress bar */}
                        {slotCount > 0 && (
                          <div className="space-y-1">
                            <div className="w-full h-1.5 rounded-full bg-vault-bg overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#00C2FF] transition-all"
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                            <p className="text-[10px] font-mono text-vault-text-faint">
                              {accessoryCount} / {slotCount} equipped
                            </p>
                          </div>
                        )}

                        {/* Footer: rounds + configure */}
                        <div className="flex items-center justify-between mt-auto pt-1">
                          <span className="inline-flex items-center text-xs font-mono font-bold px-2 py-0.5 rounded border border-[#00C853]/30 bg-[#00C853]/8 text-[#00C853]">
                            {totalRounds.toLocaleString()} rds
                          </span>
                          <Link
                            href={`/vault/${firearm.id}/builds/${build.id}`}
                            className="inline-flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-2.5 py-1 rounded transition-colors"
                          >
                            <Settings2 className="w-3 h-3" />
                            Configure
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
