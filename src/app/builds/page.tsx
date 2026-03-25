export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { Settings2, Layers, CheckCircle2, Circle } from "lucide-react";

const FIREARM_TYPE_LABELS: Record<string, string> = {
  PISTOL: "Pistol",
  RIFLE: "Rifle",
  SHOTGUN: "Shotgun",
  SMG: "SMG",
  PCC: "PCC",
  REVOLVER: "Revolver",
  BOLT_ACTION: "Bolt Action",
  LEVER_ACTION: "Lever Action",
};

const TYPE_BADGE_COLORS: Record<string, string> = {
  PISTOL: "border-[#00C2FF]/40 text-[#00C2FF]",
  RIFLE: "border-[#00C853]/40 text-[#00C853]",
  SHOTGUN: "border-[#F5A623]/40 text-[#F5A623]",
  SMG: "border-[#9C27B0]/40 text-[#CE93D8]",
  PCC: "border-[#00BCD4]/40 text-[#00BCD4]",
  REVOLVER: "border-[#E53935]/40 text-[#EF9A9A]",
  BOLT_ACTION: "border-[#8B9DB0]/40 text-vault-text-muted",
  LEVER_ACTION: "border-[#FF7043]/40 text-[#FF7043]",
};

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
  let firearms: Awaited<ReturnType<typeof getAllBuilds>>;
  try {
    firearms = await getAllBuilds();
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-vault-text-muted text-sm">Failed to load builds.</p>
        <a href="/builds" className="text-[#00C2FF] text-sm hover:underline">Tap to retry</a>
      </div>
    );
  }

  const totalBuilds = firearms.reduce((sum, f) => sum + f.builds.length, 0);
  const activeBuilds = firearms.reduce(
    (sum, f) => sum + f.builds.filter((b) => b.isActive).length,
    0
  );

  return (
    <div className="min-h-full">
      <PageHeader
        title="ALL BUILDS"
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
            <h3 className="text-lg font-semibold text-vault-text mb-2">No builds yet</h3>
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
              <div className="flex items-center gap-3 mb-3">
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

              {/* Builds table */}
              <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-vault-border">
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium">
                        Build Name
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden sm:table-cell">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden md:table-cell">
                        Slots
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium hidden lg:table-cell">
                        Accessories
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-vault-text-faint font-medium">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-vault-border">
                    {firearm.builds.map((build) => {
                      const slotCount = build.slots.length;
                      const accessoryCount = build.slots.filter(
                        (s) => s.accessoryId !== null
                      ).length;

                      return (
                        <tr
                          key={build.id}
                          className="hover:bg-vault-surface-2 transition-colors group"
                        >
                          {/* Build name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5 text-vault-text-faint shrink-0" />
                              <span className="font-medium text-vault-text group-hover:text-[#00C2FF] transition-colors">
                                {build.name}
                              </span>
                            </div>
                          </td>

                          {/* Active badge */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {build.isActive ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border border-[#00C853]/40 text-[#00C853] font-mono uppercase bg-[#00C853]/5">
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded border border-vault-border text-vault-text-faint font-mono uppercase">
                                <Circle className="w-3 h-3" />
                                Inactive
                              </span>
                            )}
                          </td>

                          {/* Slot count */}
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className="text-sm font-mono text-vault-text-muted">
                              {slotCount} slot{slotCount !== 1 ? "s" : ""}
                            </span>
                          </td>

                          {/* Accessory count */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <span className="text-sm font-mono text-vault-text-muted">
                              {accessoryCount} accessor{accessoryCount !== 1 ? "ies" : "y"}
                            </span>
                          </td>

                          {/* Configure link */}
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/vault/${firearm.id}/builds/${build.id}`}
                              className="inline-flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-2.5 py-1 rounded transition-colors"
                            >
                              <Settings2 className="w-3 h-3" />
                              Configure
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
