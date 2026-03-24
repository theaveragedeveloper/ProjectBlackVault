export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Plus, Crosshair, Shield, ExternalLink } from "lucide-react";
import { RoundCountBadge } from "@/components/shared/RoundCountBadge";

const SLOT_TYPE_LABELS: Record<string, string> = {
  MUZZLE: "Muzzle",
  BARREL: "Barrel",
  HANDGUARD: "Handguard",
  STOCK: "Stock",
  BUFFER_TUBE: "Buffer Tube",
  GRIP: "Grip",
  OPTIC: "Optic",
  OPTIC_MOUNT: "Optic Mount",
  UNDERBARREL: "Underbarrel",
  MAGAZINE: "Magazine",
  LIGHT: "Light",
  LASER: "Laser",
  CHARGING_HANDLE: "Charging Handle",
  TRIGGER: "Trigger",
  LOWER_RECEIVER: "Lower Receiver",
  UPPER_RECEIVER: "Upper Receiver",
  SLIDE: "Slide",
  FRAME: "Frame",
  SUPPRESSOR: "Suppressor",
  BIPOD: "Bipod",
  SLING: "Sling",
  COMPENSATOR: "Compensator",
};

const BARREL_TYPES = new Set(["BARREL", "SUPPRESSOR", "MUZZLE", "COMPENSATOR"]);

function roundCountColor(roundCount: number, slotType: string): { text: string; bar: string } {
  const isHighWearPart = BARREL_TYPES.has(slotType);
  const threshold = isHighWearPart ? 5000 : 20000;

  if (roundCount >= threshold) return { text: "text-[#E53935]", bar: "bg-[#E53935]" };
  if (roundCount >= threshold * 0.6) return { text: "text-[#F5A623]", bar: "bg-[#F5A623]" };
  return { text: "text-[#00C853]", bar: "bg-[#00C853]" };
}

async function getAccessories() {
  const accessories = await prisma.accessory.findMany({
    include: {
      buildSlots: {
        include: {
          build: {
            select: {
              id: true,
              name: true,
              isActive: true,
              firearm: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { roundCount: "desc" },
  });

  return accessories.map((accessory) => {
    const activeSlot = accessory.buildSlots.find((slot) => slot.build.isActive);
    return {
      ...accessory,
      currentBuild: activeSlot
        ? {
            id: activeSlot.build.id,
            name: activeSlot.build.name,
            slotType: activeSlot.slotType,
            firearm: activeSlot.build.firearm,
          }
        : null,
    };
  });
}

export default async function AccessoriesPage() {
  const accessories = await getAccessories();
  const totalRounds = accessories.reduce((sum, a) => sum + a.roundCount, 0);

  return (
    <div className="min-h-full">
      <PageHeader
        title="ACCESSORIES"
        subtitle={`${accessories.length} part${accessories.length !== 1 ? "s" : ""} & attachment${accessories.length !== 1 ? "s" : ""}`}
        actions={
          <Link
            href="/accessories/new"
            className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Accessory
          </Link>
        }
      />

      <div className="p-4 sm:p-6">
        {/* Summary bar */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 bg-vault-surface border border-vault-border rounded-lg px-4 sm:px-5 py-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Total Parts</p>
            <p className="text-lg font-bold font-mono text-vault-text">{formatNumber(accessories.length)}</p>
          </div>
          <div className="w-px h-8 bg-vault-border" />
          <div>
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Total Rounds Through</p>
            <p className="text-lg font-bold font-mono text-[#00C2FF]">{formatNumber(totalRounds)}</p>
          </div>
        </div>

        {/* Table */}
        {accessories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mb-4">
              <Crosshair className="w-8 h-8 text-[#00C2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-vault-text mb-2">No accessories yet</h3>
            <p className="text-sm text-vault-text-muted mb-6 max-w-sm">
              Add parts, optics, suppressors and other attachments to track round counts and build configurations.
            </p>
            <Link
              href="/accessories/new"
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Accessory
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              {accessories.map((accessory) => (
                <Link
                  key={accessory.id}
                  href={`/accessories/${accessory.id}`}
                  className="block rounded-lg border border-vault-border bg-vault-surface p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded bg-vault-bg border border-vault-border overflow-hidden flex items-center justify-center shrink-0">
                      {accessory.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={accessory.imageUrl} alt={accessory.name} className="w-full h-full object-cover" />
                      ) : (
                        <Shield className="w-4 h-4 text-vault-text-faint" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-vault-text truncate">{accessory.name}</p>
                      <p className="text-xs text-vault-text-faint truncate">
                        {SLOT_TYPE_LABELS[accessory.type] ?? accessory.type}
                        {accessory.manufacturer ? ` · ${accessory.manufacturer}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <RoundCountBadge roundCount={accessory.roundCount} className="text-xs" />
                        <span className="text-xs font-mono text-vault-text-muted">
                          {formatCurrency(accessory.purchasePrice)}
                        </span>
                        {accessory.currentBuild ? (
                          <span className="text-xs text-[#00C853] truncate">
                            {accessory.currentBuild.firearm.name}
                          </span>
                        ) : (
                          <span className="text-xs text-vault-text-faint">Uninstalled</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="hidden md:block bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-vault-border">
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium w-12">
                      Img
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden md:table-cell">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden lg:table-cell">
                      Manufacturer
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium">
                      Rounds
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden xl:table-cell">
                      Installed On
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden lg:table-cell">
                      Price
                    </th>
                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden xl:table-cell">
                      Acquired
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vault-border">
                  {accessories.map((accessory) => {
                    const colors = roundCountColor(accessory.roundCount, accessory.type);
                    const maxRounds = BARREL_TYPES.has(accessory.type) ? 5000 : 20000;
                    const pct = Math.min((accessory.roundCount / maxRounds) * 100, 100);

                    return (
                      <tr
                        key={accessory.id}
                        className="hover:bg-vault-surface-2 transition-colors group"
                      >
                        {/* Thumbnail */}
                        <td className="px-4 py-3">
                          <div className="w-9 h-9 rounded bg-vault-bg border border-vault-border overflow-hidden flex items-center justify-center shrink-0">
                            {accessory.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={accessory.imageUrl}
                                alt={accessory.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Shield className="w-4 h-4 text-vault-text-faint" />
                            )}
                          </div>
                        </td>

                        {/* Name */}
                        <td className="px-4 py-3">
                          <Link href={`/accessories/${accessory.id}`} className="block">
                            <p className="font-semibold text-vault-text group-hover:text-[#00C2FF] transition-colors truncate max-w-[180px] flex items-center gap-1">
                              {accessory.name}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0" />
                            </p>
                            {accessory.model && (
                              <p className="text-xs text-vault-text-faint truncate max-w-[180px]">
                                {accessory.model}
                              </p>
                            )}
                          </Link>
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded border border-vault-border text-vault-text-muted font-mono uppercase">
                            {SLOT_TYPE_LABELS[accessory.type] ?? accessory.type}
                          </span>
                        </td>

                        {/* Manufacturer */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm text-vault-text-muted truncate max-w-[120px]">
                            {accessory.manufacturer}
                          </p>
                        </td>

                        {/* Round count */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <RoundCountBadge roundCount={accessory.roundCount} className="text-xs" />
                            <div className="w-20 bg-vault-border rounded-full h-1 hidden sm:block">
                              <div
                                className={`h-1 rounded-full ${colors.bar} transition-all`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Installed on */}
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {accessory.currentBuild ? (
                            <div>
                              <p className="text-xs text-[#00C853] truncate max-w-[140px]">
                                {accessory.currentBuild.firearm.name}
                              </p>
                              <p className="text-[10px] text-vault-text-faint truncate max-w-[140px]">
                                {accessory.currentBuild.name}
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-vault-text-faint">Uninstalled</p>
                          )}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm font-mono text-vault-text-muted">
                            {formatCurrency(accessory.purchasePrice)}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <p className="text-xs text-vault-text-faint">
                            {formatDate(accessory.acquisitionDate)}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
