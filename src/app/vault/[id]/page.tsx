import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
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
  BOLT_ACTION: "border-[#8B9DB0]/40 text-[#8B9DB0]",
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
  const firearm = await getFirearm(id);

  if (!firearm) {
    notFound();
  }

  const activeBuild = firearm.builds.find((b) => b.isActive) ?? null;
  const typeBadge = TYPE_BADGE_COLORS[firearm.type] ?? "border-[#1C2530] text-[#8B9DB0]";
  const typeLabel = FIREARM_TYPE_LABELS[firearm.type] ?? firearm.type;

  const gainLoss =
    firearm.currentValue != null && firearm.purchasePrice != null
      ? firearm.currentValue - firearm.purchasePrice
      : null;

  return (
    <div className="min-h-full">
      {/* Hero Banner */}
      <div className="relative h-56 bg-[#080B0F] overflow-hidden">
        {firearm.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={firearm.imageUrl}
              alt={firearm.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080B0F] via-[#080B0F]/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 tactical-grid flex items-center justify-center">
            <Shield className="w-16 h-16 text-[#1C2530]" />
          </div>
        )}

        {/* Nav bar over image */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
          <Link
            href="/vault"
            className="flex items-center gap-1.5 text-[#E8EDF2]/80 hover:text-[#E8EDF2] text-sm transition-colors bg-[#080B0F]/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-[#1C2530]/60"
          >
            <ArrowLeft className="w-4 h-4" />
            Vault
          </Link>
          <Link
            href={`/vault/${id}/edit`}
            className="flex items-center gap-1.5 text-sm bg-[#080B0F]/60 backdrop-blur-sm border border-[#1C2530]/60 text-[#8B9DB0] hover:text-[#E8EDF2] px-3 py-1.5 rounded-md transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>
        </div>

        {/* Name + badges over image */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-5">
          <div className="flex items-end gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-2 py-0.5 rounded border font-mono uppercase ${typeBadge}`}>
                  {typeLabel}
                </span>
                <span className="text-xs px-2 py-0.5 rounded border border-[#1C2530] text-[#8B9DB0] font-mono">
                  {firearm.caliber}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#E8EDF2] leading-tight">{firearm.name}</h1>
              <p className="text-sm text-[#8B9DB0] mt-0.5">
                {firearm.manufacturer} · {firearm.model}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-3.5 h-3.5 text-[#4A5A6B]" />
              <p className="text-[10px] uppercase tracking-widest text-[#4A5A6B]">Serial</p>
            </div>
            <p className="text-sm font-mono text-[#E8EDF2]">{firearm.serialNumber}</p>
          </div>

          <div className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-3.5 h-3.5 text-[#4A5A6B]" />
              <p className="text-[10px] uppercase tracking-widest text-[#4A5A6B]">Acquired</p>
            </div>
            <p className="text-sm text-[#E8EDF2]">{formatDate(firearm.acquisitionDate)}</p>
          </div>

          <div className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-3.5 h-3.5 text-[#4A5A6B]" />
              <p className="text-[10px] uppercase tracking-widest text-[#4A5A6B]">Paid</p>
            </div>
            <p className="text-sm font-mono text-[#E8EDF2]">
              {formatCurrency(firearm.purchasePrice)}
            </p>
          </div>

          <div className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#4A5A6B]" />
              <p className="text-[10px] uppercase tracking-widest text-[#4A5A6B]">Value</p>
            </div>
            <p className="text-sm font-mono text-[#E8EDF2]">
              {formatCurrency(firearm.currentValue)}
            </p>
            {gainLoss != null && (
              <p className={`text-[10px] mt-0.5 font-mono ${gainLoss >= 0 ? "text-[#00C853]" : "text-[#E53935]"}`}>
                {gainLoss >= 0 ? "+" : ""}{formatCurrency(gainLoss)}
              </p>
            )}
          </div>

          <div className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-4 sm:col-span-1 col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-3.5 h-3.5 text-[#4A5A6B]" />
              <p className="text-[10px] uppercase tracking-widest text-[#4A5A6B]">Builds</p>
            </div>
            <p className="text-sm font-mono text-[#E8EDF2]">{firearm.builds.length}</p>
          </div>
        </div>

        {/* Notes */}
        {firearm.notes && (
          <div className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#4A5A6B]" />
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#8B9DB0]">Notes</h3>
            </div>
            <p className="text-sm text-[#E8EDF2] leading-relaxed whitespace-pre-wrap">{firearm.notes}</p>
          </div>
        )}

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
            <div className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mx-auto mb-4">
                <Layers className="w-6 h-6 text-[#00C2FF]" />
              </div>
              <h3 className="text-sm font-semibold text-[#E8EDF2] mb-2">No builds yet</h3>
              <p className="text-xs text-[#8B9DB0] mb-4 max-w-xs mx-auto">
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
                    className={`bg-[#0E1318] border rounded-lg p-4 ${
                      build.isActive
                        ? "border-[#00C853]/40"
                        : "border-[#1C2530] hover:border-[#8B9DB0]/30"
                    } transition-colors`}
                  >
                    {/* Build header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="text-sm font-semibold text-[#E8EDF2] truncate">
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
                          <p className="text-xs text-[#8B9DB0] truncate">{build.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Slot summary */}
                    <div className="mb-4">
                      <p className="text-xs text-[#4A5A6B] mb-2">
                        {filledSlots.length} of {build.slots.length} slot{build.slots.length !== 1 ? "s" : ""} filled
                      </p>
                      {filledSlots.length > 0 && (
                        <div className="space-y-1">
                          {filledSlots.slice(0, 4).map((slot) => (
                            <div key={slot.id} className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-[#4A5A6B] w-24 shrink-0">
                                {SLOT_TYPE_LABELS[slot.slotType] ?? slot.slotType}
                              </span>
                              <span className="text-xs text-[#8B9DB0] truncate">
                                {slot.accessory?.name ?? "—"}
                              </span>
                            </div>
                          ))}
                          {filledSlots.length > 4 && (
                            <p className="text-[10px] text-[#4A5A6B]">
                              +{filledSlots.length - 4} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/builds/${build.id}`}
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
    </div>
  );
}
