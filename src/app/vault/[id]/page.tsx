export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { decryptField } from "@/lib/crypto";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ItemDocumentPanel } from "@/components/shared/ItemDocumentPanel";
import { RoundCountBadge } from "@/components/shared/RoundCountBadge";
import { RemoveImageButton } from "@/components/shared/RemoveImageButton";
import {
  ArrowLeft,
  Edit,
  Shield,
  Plus,
  Layers,
  CheckCircle2,
  Settings2,
  Calendar,
  DollarSign,
  Hash,
  FileText,
  TrendingUp,
} from "lucide-react";

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

async function getFirearm(id: string) {
  const firearm = await prisma.firearm.findUnique({
    where: { id },
    include: {
      rangeSessions: {
        select: { roundsFired: true },
      },
      documents: {
        select: { id: true, name: true, type: true, notes: true, createdAt: true },
      },
      builds: {
        include: {
          slots: {
            include: { accessory: true },
          },
        },
        orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      },
    },
  });
  return firearm;
}

export default async function FirearmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let firearm: Awaited<ReturnType<typeof getFirearm>>;
  try {
    firearm = await getFirearm(id);
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-vault-text-muted text-sm">Failed to load firearm.</p>
        <Link href="/vault" className="text-[#00C2FF] text-sm hover:underline">Back to vault</Link>
      </div>
    );
  }

  if (!firearm) {
    notFound();
  }

  const typeBadge = TYPE_BADGE_COLORS[firearm.type] ?? "border-vault-border text-vault-text-muted";
  const typeLabel = FIREARM_TYPE_LABELS[firearm.type] ?? firearm.type;

  const gainLoss =
    firearm.currentValue != null && firearm.purchasePrice != null
      ? firearm.currentValue - firearm.purchasePrice
      : null;

  const maintenanceEntries = firearm.documents
    .filter((doc) => ["MAINTENANCE", "SERVICE", "CLEANING"].includes(doc.type.toUpperCase()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const lastServicedDate = firearm.lastMaintenanceDate ?? maintenanceEntries[0]?.createdAt ?? null;
  const intervalDays = firearm.maintenanceIntervalDays ?? null;
  const nextDueDate = lastServicedDate && intervalDays ? new Date(new Date(lastServicedDate).getTime() + intervalDays * 86400000) : null;
  const now = new Date();
  const daysUntilDue = nextDueDate ? Math.ceil((nextDueDate.getTime() - now.getTime()) / 86400000) : null;
  const maintenanceStatus = daysUntilDue == null ? { label: "Neutral", style: "text-vault-text-faint border-vault-border" } : daysUntilDue < 0 ? { label: "Due", style: "text-[#E53935] border-[#E53935]/40" } : daysUntilDue <= 14 ? { label: "Upcoming", style: "text-[#F5A623] border-[#F5A623]/40" } : { label: "On Track", style: "text-[#00C853] border-[#00C853]/40" };

  const imageFilename = firearm.imageUrl ? firearm.imageUrl.split("/").pop() ?? "" : "";

  return (
    <div className="min-h-full">
      {/* Hero Banner */}
      <div className="relative h-56 bg-vault-bg overflow-hidden">
        {firearm.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={firearm.imageUrl}
              alt={firearm.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-vault-bg via-vault-bg/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 tactical-grid flex items-center justify-center">
            <Shield className="w-16 h-16 text-vault-border" />
          </div>
        )}

        {/* Nav bar over image */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <Link
            href="/vault"
            className="flex items-center gap-1.5 text-[#E8EDF2]/80 hover:text-vault-text text-sm transition-colors bg-vault-bg/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-[#1C2530]/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Vault
          </Link>
          <div className="flex items-center gap-2">
            {firearm.imageUrl && imageFilename && (
              <RemoveImageButton
                filename={imageFilename}
                entityType="firearm"
                entityId={firearm.id}
              />
            )}
            <Link
              href={`/vault/${id}/edit`}
              className="flex items-center gap-1.5 text-sm bg-vault-bg/60 backdrop-blur-sm border border-[#1C2530]/60 text-vault-text-muted hover:text-vault-text px-3 py-1.5 rounded-md transition-colors"
            >
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </div>
        </div>

        {/* Name + badges over image */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <div className="flex items-end gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${typeBadge}`}>
                  {typeLabel}
                </span>
                <span className="text-xs px-2 py-0.5 rounded border border-vault-border text-vault-text-muted font-mono">
                  {firearm.caliber}
                </span>
                <RoundCountBadge roundCount={firearm.rangeSessions.reduce((sum, session) => sum + session.roundsFired, 0)} />
              </div>
              <h1 className="text-2xl font-bold text-vault-text leading-tight">{firearm.name}</h1>
              <p className="text-sm text-vault-text-muted mt-0.5">
                {firearm.manufacturer} · {firearm.model}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-3.5 h-3.5 text-vault-text-faint" />
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Serial</p>
            </div>
            <p className="text-sm font-mono text-vault-text">{decryptField(firearm.serialNumber) ?? "—"}</p>
          </div>

          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-vault-text-faint" />
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Acquired</p>
            </div>
            <p className="text-sm text-vault-text">{formatDate(firearm.acquisitionDate)}</p>
          </div>

          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-vault-text-faint" />
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Paid</p>
            </div>
            <p className="text-sm font-mono text-vault-text">
              {firearm.purchasePrice != null && firearm.purchasePrice !== 0 ? formatCurrency(firearm.purchasePrice) : "—"}
            </p>
          </div>

          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-vault-text-faint" />
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Value</p>
            </div>
            <p className="text-sm font-mono text-vault-text">
              {firearm.currentValue != null && firearm.currentValue !== 0 ? formatCurrency(firearm.currentValue) : "—"}
            </p>
            {gainLoss != null && (
              <p className={`text-[10px] mt-0.5 font-mono ${gainLoss >= 0 ? "text-[#00C853]" : "text-[#E53935]"}`}>
                {gainLoss >= 0 ? "+" : ""}{formatCurrency(gainLoss)}
              </p>
            )}
          </div>

          <div className="bg-vault-surface border border-vault-border rounded-lg p-4 sm:col-span-1 col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-3.5 h-3.5 text-vault-text-faint" />
              <p className="text-[10px] uppercase tracking-widest text-vault-text-faint">Builds</p>
            </div>
            <p className="text-sm font-mono text-vault-text">{firearm.builds.length}</p>
          </div>
        </div>

        {/* Notes */}
        {firearm.notes && (
          <div className="bg-vault-surface border border-vault-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-vault-text-faint" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-vault-text-muted">Notes</h3>
            </div>
            <p className="text-sm text-vault-text leading-relaxed whitespace-pre-wrap">{firearm.notes}</p>
          </div>
        )}

        <ItemDocumentPanel
          entityType="firearm"
          entityId={firearm.id}
          title="Firearm Documents"
        />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
          <div className="space-y-6">
        {/* Builds Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00C2FF]" />
              <h2 className="text-sm font-semibold tracking-widest uppercase text-[#00C2FF]">
                Builds
              </h2>
            </div>
            <Link
              href={`/vault/${id}/builds/new`}
              className="flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              New Build
            </Link>
          </div>

          {firearm.builds.length === 0 ? (
            <div className="bg-vault-surface border border-vault-border rounded-lg p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-6 h-6 text-[#00C2FF]" />
              </div>
              <h3 className="text-sm font-semibold text-vault-text mb-2">No builds yet</h3>
              <p className="text-xs text-vault-text-muted mb-4 max-w-xs mx-auto">
                Create a build to start configuring accessories and attachments for this firearm.
              </p>
              <Link
                href={`/vault/${id}/builds/new`}
                className="inline-flex items-center gap-2 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2 rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                Create First Build
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {firearm.builds.map((build) => {
                const filledSlots = build.slots.filter((s) => s.accessoryId);
                return (
                  <div
                    key={build.id}
                    className={`bg-vault-surface border rounded-lg p-4 ${
                      build.isActive
                        ? "border-[#00C853]/40"
                        : "border-vault-border hover:border-vault-text-muted/30"
                    } transition-colors`}
                  >
                    {/* Build header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold text-vault-text truncate">
                            {build.name}
                          </h3>
                          {build.isActive && (
                            <span className="flex items-center gap-1 text-[10px] text-[#00C853] border border-[#00C853]/40 px-1.5 py-0.5 rounded font-mono uppercase shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Active
                            </span>
                          )}
                        </div>
                        {build.description && (
                          <p className="text-xs text-vault-text-muted truncate">{build.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Slot summary */}
                    <div className="mb-4">
                      <p className="text-xs text-vault-text-faint mb-2">
                        {filledSlots.length} of {build.slots.length} slot{build.slots.length !== 1 ? "s" : ""} filled
                      </p>
                      {filledSlots.length > 0 && (
                        <div className="space-y-1">
                          {filledSlots.slice(0, 4).map((slot) => (
                            <div key={slot.id} className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-vault-text-faint w-24 shrink-0">
                                {SLOT_TYPE_LABELS[slot.slotType] ?? slot.slotType}
                              </span>
                              <span className="text-xs text-vault-text-muted truncate">
                                {slot.accessory?.name ?? "—"}
                              </span>
                            </div>
                          ))}
                          {filledSlots.length > 4 && (
                            <p className="text-[10px] text-vault-text-faint">
                              +{filledSlots.length - 4} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/vault/${id}/builds/${build.id}`}
                      className="flex items-center justify-center gap-2 w-full text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-2 rounded transition-colors"
                    >
                      <Settings2 className="w-3 h-3" />
                      Open Configurator
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
          </div>
          <aside className="bg-vault-surface border border-vault-border rounded-lg p-4 h-fit space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-vault-text">Maintenance Log</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-mono uppercase ${maintenanceStatus.style}`}>{maintenanceStatus.label}</span>
            </div>
            <div className="space-y-1 text-xs">
              <p className="text-vault-text-muted">Last serviced: <span className="text-vault-text">{lastServicedDate ? formatDate(lastServicedDate) : "—"}</span></p>
              <p className="text-vault-text-muted">Maintenance interval: <span className="text-vault-text">{intervalDays ? `${intervalDays} days` : "—"}</span></p>
              <p className="text-vault-text-muted">Next due: <span className="text-vault-text">{nextDueDate ? formatDate(nextDueDate) : "—"}</span></p>
              <p className="text-vault-text-muted">Total entries: <span className="text-vault-text">{maintenanceEntries.length}</span></p>
            </div>
            {maintenanceEntries.length === 0 ? (
              <p className="text-xs text-vault-text-faint">No maintenance logged yet.</p>
            ) : (
              <div className="space-y-2">
                {maintenanceEntries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="rounded border border-vault-border bg-vault-bg px-2.5 py-2">
                    <p className="text-[11px] text-vault-text">{formatDate(entry.createdAt)} · {entry.type}</p>
                    <p className="text-xs text-vault-text-muted truncate">{entry.name}</p>
                    {entry.notes && <p className="text-[11px] text-vault-text-faint truncate">{entry.notes}</p>}
                  </div>
                ))}
              </div>
            )}
            <Link href={`/vault/${id}/edit`} className="inline-flex items-center justify-center w-full text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-2 rounded transition-colors">
              Log Maintenance
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
