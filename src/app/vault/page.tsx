"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency } from "@/lib/utils";
import { RoundCountBadge } from "@/components/shared/RoundCountBadge";
import {
  Shield,
  Plus,
  Settings2,
  Crosshair,
  Layers,
  SlidersHorizontal,
  GripVertical,
  Pencil,
  Trash2,
  CheckCircle2,
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
  BOLT_ACTION: "border-[#8B9DB0]/40 text-vault-text-muted",
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
  firearmRoundCount: number;
}

interface Build {
  id: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
  slots: { id: string; slotType: string; accessory: { id: string; name: string } | null }[];
}

function FirearmTypeIcon({ type }: { type: string }) {
  switch (type) {
    case "PISTOL":
    case "REVOLVER":
      return <Crosshair className="w-8 h-8 text-vault-text-faint" />;
    case "RIFLE":
    case "BOLT_ACTION":
    case "LEVER_ACTION":
    case "SMG":
    case "PCC":
      return <Shield className="w-8 h-8 text-vault-text-faint" />;
    case "SHOTGUN":
      return <SlidersHorizontal className="w-8 h-8 text-vault-text-faint" />;
    default:
      return <Shield className="w-8 h-8 text-vault-text-faint" />;
  }
}

interface FirearmCardProps {
  firearm: Firearm;
  editMode?: boolean;
  editBuilds?: Build[];
  onDeleteBuild?: (build: Build & { firearmId: string }, accessories: { id: string; name: string }[]) => void;
}

function FirearmCard({ firearm, editMode, editBuilds, onDeleteBuild }: FirearmCardProps) {
  const typeBadge = TYPE_BADGE_COLORS[firearm.type] ?? "border-vault-border text-vault-text-muted";
  const typeLabel = FIREARM_TYPE_LABELS[firearm.type] ?? firearm.type;
  const activeBuild = firearm.activeBuild;
  const accessoryCount = activeBuild?.slots?.filter((s) => s.accessoryId).length ?? 0;

  return (
    <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden hover:border-[#00C2FF]/30 transition-colors group flex flex-col">
      {/* Image / Placeholder */}
      <div className="h-40 bg-vault-bg relative overflow-hidden border-b border-vault-border">
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
              <span className="text-xs font-mono uppercase text-vault-text-faint tracking-widest">
                {typeLabel}
              </span>
            </div>
          </div>
        )}
        {/* Type badge overlay */}
        <div className="absolute top-2 right-2">
          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono uppercase bg-vault-bg/80 backdrop-blur-sm ${typeBadge}`}>
            {typeLabel}
          </span>
        </div>
        {activeBuild && (
          <div className="absolute bottom-2 left-2">
            <span className="text-[10px] px-2 py-0.5 rounded border border-[#00C853]/40 text-[#00C853] font-mono uppercase bg-vault-bg/80 backdrop-blur-sm">
              Active Build
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-3">
          <h3 className="font-bold text-vault-text text-sm leading-snug mb-1 group-hover:text-[#00C2FF] transition-colors">
            {firearm.name}
          </h3>
          <p className="text-xs text-vault-text-muted">
            {firearm.manufacturer} · {firearm.model}
          </p>
        </div>

        {/* Caliber badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs px-2 py-0.5 rounded border border-vault-border text-vault-text-muted font-mono bg-vault-bg">
            {firearm.caliber}
          </span>
          <RoundCountBadge roundCount={firearm.firearmRoundCount} />
        </div>

        {/* Serial */}
        <div className="mb-3">
          <p className="text-[10px] text-vault-text-faint uppercase tracking-widest mb-0.5">Serial</p>
          <p className="text-xs font-mono text-vault-text-muted">{firearm.serialNumber}</p>
        </div>

        {/* Active build */}
        {activeBuild && !editMode && (
          <div className="mb-3 px-2 py-1.5 rounded bg-vault-bg border border-vault-border">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#00C853]" />
              <span className="text-xs text-[#00C853] font-medium truncate">{activeBuild.name}</span>
            </div>
            <p className="text-[10px] text-vault-text-faint mt-0.5 ml-4.5">
              {accessoryCount} accessor{accessoryCount !== 1 ? "ies" : "y"}
            </p>
          </div>
        )}

        {/* Footer */}
        {!editMode && (
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-vault-border">
            {firearm.purchasePrice != null ? (
              <span className="text-xs font-mono text-vault-text-muted">
                {formatCurrency(firearm.purchasePrice)}
              </span>
            ) : (
              <span className="text-xs text-vault-text-faint">—</span>
            )}

            {activeBuild ? (
              <Link
                href={`/vault/${firearm.id}/builds/${activeBuild.id}`}
                className="flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-2.5 py-1 rounded transition-colors"
              >
                <Settings2 className="w-3 h-3" />
                Configure
              </Link>
            ) : (
              <Link
                href={`/vault/${firearm.id}`}
                className="flex items-center gap-1.5 text-xs bg-vault-border border border-vault-border text-vault-text-muted hover:text-vault-text hover:border-vault-text-muted/30 px-2.5 py-1 rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
                Create Build
              </Link>
            )}
          </div>
        )}

        {/* Edit mode builds section */}
        {editMode && editBuilds && (
          <div className="mt-3 pt-3 border-t border-vault-border">
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-2">Builds</p>
            {editBuilds.length === 0 ? (
              <p className="text-xs text-vault-text-faint italic">No builds</p>
            ) : (
              <div className="space-y-1">
                {editBuilds.map((build) => {
                  const accessoriesOnBuild = build.slots
                    .filter(s => s.accessory !== null)
                    .map(s => s.accessory!);
                  return (
                    <div key={build.id} className="flex items-center gap-2 py-1.5 px-2 rounded bg-vault-bg border border-vault-border group/build">
                      <GripVertical className="w-3.5 h-3.5 text-vault-text-faint shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-vault-text truncate">{build.name}</p>
                        <p className="text-[10px] text-vault-text-faint">{accessoriesOnBuild.length} accessories</p>
                      </div>
                      {build.isActive && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00C853]/10 text-[#00C853] border border-[#00C853]/20 shrink-0">Active</span>
                      )}
                      <button
                        onClick={() => onDeleteBuild?.({ ...build, firearmId: firearm.id }, accessoriesOnBuild)}
                        className="w-6 h-6 flex items-center justify-center rounded text-vault-text-faint hover:text-[#E53935] hover:bg-[#E53935]/10 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VaultPage() {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [editMode, setEditMode] = useState(false);
  const [buildsByFirearm, setBuildsByFirearm] = useState<Record<string, Build[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<{
    build: { id: string; name: string; firearmId: string };
    accessories: { id: string; name: string }[];
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/firearms")
      .then((r) => r.json())
      .then((data) => {
        setFirearms(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!editMode) return;
    Promise.all(
      firearms.map(f =>
        fetch(`/api/builds?firearmId=${f.id}`)
          .then(r => r.json())
          .then(data => ({ firearmId: f.id, builds: Array.isArray(data) ? data : [] }))
      )
    ).then(results => {
      const map: Record<string, Build[]> = {};
      results.forEach(r => { map[r.firearmId] = r.builds; });
      setBuildsByFirearm(map);
    });
  }, [editMode, firearms]);

  function openDeleteModal(build: Build & { firearmId: string }, accessories: { id: string; name: string }[]) {
    setDeleteTarget({ build, accessories });
  }

  async function handleDeleteBuild(deleteAccessories: boolean) {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete build (accessories auto-unassigned via onDelete: SetNull in schema)
      await fetch(`/api/builds/${deleteTarget.build.id}`, { method: "DELETE" });

      // Optionally delete accessories too
      if (deleteAccessories && deleteTarget.accessories.length > 0) {
        await Promise.all(
          deleteTarget.accessories.map(a =>
            fetch(`/api/accessories/${a.id}`, { method: "DELETE" })
          )
        );
      }

      // Refresh firearms list
      const res = await fetch("/api/firearms");
      const data = await res.json();
      if (Array.isArray(data)) setFirearms(data);

      // Update buildsByFirearm state
      const newBuilds = await fetch(`/api/builds?firearmId=${deleteTarget.build.firearmId}`)
        .then(r => r.json())
        .then(d => Array.isArray(d) ? d : []);
      setBuildsByFirearm(prev => ({ ...prev, [deleteTarget.build.firearmId]: newBuilds }));

      setDeleteTarget(null);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setDeleting(false);
    }
  }

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors border ${
                editMode
                  ? "bg-[#00C853]/10 border-[#00C853]/30 text-[#00C853] hover:bg-[#00C853]/20"
                  : "bg-vault-border border-vault-border text-vault-text-muted hover:text-vault-text hover:border-vault-text-muted/30"
              }`}
            >
              {editMode ? <CheckCircle2 className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              {editMode ? "Done" : "Edit"}
            </button>
            <Link
              href="/vault/new"
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Firearm
            </Link>
          </div>
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
                    : "bg-vault-surface border-vault-border text-vault-text-muted hover:border-vault-text-muted/40 hover:text-vault-text"
                }`}
              >
                {FIREARM_TYPE_LABELS[type]}
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isActive ? "text-[#00C2FF]" : "text-vault-text-faint"
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
                className="bg-vault-surface border border-vault-border rounded-lg h-72 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-[#00C2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-vault-text mb-2">
              {activeFilter === "ALL" ? "No firearms in vault" : `No ${FIREARM_TYPE_LABELS[activeFilter]} firearms`}
            </h3>
            <p className="text-sm text-vault-text-muted mb-6 max-w-sm">
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
            {filtered.map((firearm) =>
              editMode ? (
                <FirearmCard
                  key={firearm.id}
                  firearm={firearm}
                  editMode={editMode}
                  editBuilds={buildsByFirearm[firearm.id]}
                  onDeleteBuild={openDeleteModal}
                />
              ) : (
                <Link key={firearm.id} href={`/vault/${firearm.id}`} className="block">
                  <FirearmCard firearm={firearm} />
                </Link>
              )
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor: "rgba(5,7,9,0.9)"}}>
          <div className="bg-vault-surface border border-vault-border rounded-xl w-full max-w-md animate-slide-up shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#E53935]/10 border border-[#E53935]/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-[#E53935]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-vault-text">Delete Build</h2>
                  <p className="text-xs text-vault-text-muted">{deleteTarget.build.name}</p>
                </div>
              </div>

              {deleteTarget.accessories.length > 0 ? (
                <>
                  <p className="text-sm text-vault-text-muted mb-3">
                    This build has <span className="text-vault-text font-medium">{deleteTarget.accessories.length} accessor{deleteTarget.accessories.length !== 1 ? "ies" : "y"}</span> assigned to it:
                  </p>
                  <div className="bg-vault-bg border border-vault-border rounded-lg p-3 mb-4 space-y-1 max-h-32 overflow-y-auto">
                    {deleteTarget.accessories.map(a => (
                      <p key={a.id} className="text-xs text-vault-text-muted">• {a.name}</p>
                    ))}
                  </div>
                  <p className="text-sm text-vault-text-muted mb-4">What would you like to do with these accessories?</p>
                  <div className="space-y-2">
                    <button
                      disabled={deleting}
                      onClick={() => handleDeleteBuild(false)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-vault-border bg-vault-surface-2 hover:border-[#00C2FF]/30 hover:bg-[#00C2FF]/5 transition-all text-left disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4 text-[#00C2FF] shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-vault-text">Keep accessories in vault</p>
                        <p className="text-xs text-vault-text-muted">Accessories stay in your inventory, just unassigned</p>
                      </div>
                    </button>
                    <button
                      disabled={deleting}
                      onClick={() => handleDeleteBuild(true)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[#E53935]/20 bg-[#E53935]/5 hover:bg-[#E53935]/10 transition-all text-left disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-[#E53935] shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-[#E53935]">Delete accessories too</p>
                        <p className="text-xs text-vault-text-muted">Permanently removes accessories from your vault</p>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-vault-text-muted mb-6">This build has no accessories assigned. Delete it?</p>
                  <button
                    disabled={deleting}
                    onClick={() => handleDeleteBuild(false)}
                    className="w-full px-4 py-2.5 rounded-lg bg-[#E53935]/10 border border-[#E53935]/30 text-[#E53935] hover:bg-[#E53935]/20 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Delete Build"}
                  </button>
                </>
              )}

              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="w-full mt-3 px-4 py-2 rounded-lg text-vault-text-muted hover:text-vault-text text-sm transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
