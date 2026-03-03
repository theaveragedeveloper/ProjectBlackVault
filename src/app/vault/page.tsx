"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Shield,
  Plus,
  Settings2,
  Crosshair,
  Layers,
  SlidersHorizontal,
} from "lucide-react";

const FIREARM_TYPES = ["ALL", "PISTOL", "RIFLE", "SHOTGUN", "SMG", "PCC", "REVOLVER", "BOLT_ACTION", "LEVER_ACTION"] as const;

const FIREARM_TYPE_LABELS: Record<string, string> = {
  ALL: "All",
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

interface ActiveBuild {
  id: string;
  name: string;
  isActive: boolean;
  slots: { id: string; slotType: string; accessoryId: string | null }[];
}

interface Firearm {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  caliber: string;
  serialNumber: string;
  type: string;
  acquisitionDate: string;
  purchasePrice: number | null;
  currentValue: number | null;
  imageUrl: string | null;
  buildCount: number;
  activeBuild: ActiveBuild | null;
}

function FirearmTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "PISTOL":
    case "REVOLVER":
      return <Crosshair className="w-8 h-8 text-[#4A5A6B]" />;
    case "RIFLE":
    case "BOLT_ACTION":
    case "LEVER_ACTION":
    case "SMG":
    case "PCC":
      return <Shield className="w-8 h-8 text-[#4A5A6B]" />;
    case "SHOTGUN":
      return <SlidersHorizontal className="w-8 h-8 text-[#4A5A6B]" />;
    default:
      return <Shield className="w-8 h-8 text-[#4A5A6B]" />;
  }
}

function FirearmCard({ firearm }: { firearm: Firearm }) {
  const typeBadge = TYPE_BADGE_COLORS[firearm.type] ?? "border-[#1C2530] text-[#8B9DB0]";
  const typeLabel = FIREARM_TYPE_LABELS[firearm.type] ?? firearm.type;
  const activeBuild = firearm.activeBuild;
  const accessoryCount = activeBuild?.slots?.filter((s) => s.accessoryId).length ?? 0;

  return (
    <div className="bg-[#0E1318] border border-[#1C2530] rounded-lg overflow-hidden hover:border-[#00C2FF]/30 transition-colors group flex flex-col">
      {/* Image / Placeholder */}
      <div className="h-40 bg-[#080B0F] relative overflow-hidden border-b border-[#1C2530]">
        {firearm.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={firearm.imageUrl}
            alt={firearm.name}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center tactical-grid">
            <div className="flex flex-col items-center gap-2 opacity-40">
              <FirearmTypeIcon type={firearm.type} />
              <span className="text-xs font-mono uppercase text-[#4A5A6B] tracking-widest">
                {typeLabel}
              </span>
            </div>
          </div>
        )}
        {/* Type badge overlay */}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono uppercase bg-[#080B0F]/80 backdrop-blur-sm ${typeBadge}`}>
            {typeLabel}
          </span>
        </div>
        {activeBuild && (
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] px-2 py-0.5 rounded border border-[#00C853]/40 text-[#00C853] font-mono uppercase bg-[#080B0F]/80 backdrop-blur-sm">
              Active Build
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="font-bold text-[#E8EDF2] text-sm leading-snug mb-1 group-hover:text-[#00C2FF] transition-colors">
            {firearm.name}
          </h3>
          <p className="text-xs text-[#8B9DB0]">
            {firearm.manufacturer} · {firearm.model}
          </p>
        </div>

        {/* Caliber badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded border border-[#1C2530] text-[#8B9DB0] font-mono bg-[#080B0F]">
            {firearm.caliber}
          </span>
        </div>

        {/* Serial */}
        <div className="mb-3">
          <p className="text-[10px] text-[#4A5A6B] uppercase tracking-widest mb-0.5">Serial</p>
          <p className="text-xs font-mono text-[#8B9DB0]">{firearm.serialNumber}</p>
        </div>

        {/* Active build */}
        {activeBuild && (
          <div className="mb-3 px-2 py-1.5 rounded bg-[#080B0F] border border-[#1C2530]">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#00C853]" />
              <span className="text-xs text-[#00C853] font-medium truncate">{activeBuild.name}</span>
            </div>
            <p className="text-[10px] text-[#4A5A6B] mt-0.5 ml-4.5">
              {accessoryCount} accessor{accessoryCount !== 1 ? "ies" : "y"}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#1C2530]">
          {firearm.purchasePrice != null ? (
            <span className="text-xs font-mono text-[#8B9DB0]">
              {formatCurrency(firearm.purchasePrice)}
            </span>
          ) : (
            <span className="text-xs text-[#4A5A6B]">No price</span>
          )}

          {activeBuild ? (
            <Link
              href={`/builds/${activeBuild.id}`}
              className="flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-2.5 py-1 rounded transition-colors"
            >
              <Settings2 className="w-3 h-3" />
              Configure
            </Link>
          ) : (
            <Link
              href={`/vault/${firearm.id}`}
              className="flex items-center gap-1.5 text-xs bg-[#1C2530] border border-[#1C2530] text-[#8B9DB0] hover:text-[#E8EDF2] hover:border-[#8B9DB0]/30 px-2.5 py-1 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              Create Build
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/firearms")
      .then((r) => r.json())
      .then((data) => {
        setFirearms(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = activeFilter === "ALL"
    ? firearms
    : firearms.filter((f) => f.type === activeFilter);

  const counts = FIREARM_TYPES.reduce((acc, t) => {
    acc[t] = t === "ALL" ? firearms.length : firearms.filter((f) => f.type === t).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-full">
      <PageHeader
        title="VAULT"
        subtitle={`${firearms.length} firearm${firearms.length !== 1 ? "s" : ""} in inventory`}
        actions={
          <Link
            href="/vault/new"
            className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Firearm
          </Link>
        }
      />

      <div className="p-6">
        {/* Type Filters */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {FIREARM_TYPES.map((type) => {
            const count = counts[type];
            if (count === 0 && type !== "ALL") return null;
            const isActive = activeFilter === type;
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border font-mono uppercase tracking-wide transition-all ${
                  isActive
                    ? "bg-[#00C2FF]/10 border-[#00C2FF]/40 text-[#00C2FF]"
                    : "bg-[#0E1318] border-[#1C2530] text-[#8B9DB0] hover:border-[#8B9DB0]/40 hover:text-[#E8EDF2]"
                }`}
              >
                {FIREARM_TYPE_LABELS[type]}
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isActive ? "text-[#00C2FF]" : "text-[#4A5A6B]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-[#0E1318] border border-[#1C2530] rounded-lg h-72 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-[#00C2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#E8EDF2] mb-2">
              {activeFilter === "ALL" ? "No firearms in vault" : `No ${FIREARM_TYPE_LABELS[activeFilter]} firearms`}
            </h3>
            <p className="text-sm text-[#8B9DB0] mb-6 max-w-sm">
              {activeFilter === "ALL"
                ? "Start building your armory by adding your first firearm to the vault."
                : "Try selecting a different filter or add a new firearm."}
            </p>
            {activeFilter === "ALL" && (
              <Link
                href="/vault/new"
                className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Firearm
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((firearm) => (
              <Link key={firearm.id} href={`/vault/${firearm.id}`} className="block">
                <FirearmCard firearm={firearm} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
