"use client";

export const dynamic = "force-dynamic";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { SafeImage } from "@/components/shared/SafeImage";
import { formatCurrency, formatDate, formatNumber } from "@/lib/utils";
import { Plus, Crosshair, Shield, ExternalLink, Loader2, ChevronDown, AlertCircle, Search } from "lucide-react";
import { SLOT_TYPE_LABELS, SlotType, SLOT_TYPES } from "@/lib/types";

const SLOT_TYPE_LABELS_LOCAL: Record<string, string> = SLOT_TYPE_LABELS as Record<string, string>;

const BARREL_TYPES = new Set(["BARREL", "SUPPRESSOR", "MUZZLE", "COMPENSATOR"]);

function roundCountColor(roundCount: number, slotType: string): { text: string; bar: string; badge: string } {
  const isHighWearPart = BARREL_TYPES.has(slotType);
  const threshold = isHighWearPart ? 5000 : 20000;

  if (roundCount >= threshold) return { text: "text-[#E53935]", bar: "bg-[#E53935]", badge: "border-[#E53935]/40 bg-[#E53935]/10 text-[#E53935]" };
  if (roundCount >= threshold * 0.6) return { text: "text-[#F5A623]", bar: "bg-[#F5A623]", badge: "border-[#F5A623]/40 bg-[#F5A623]/10 text-[#F5A623]" };
  return { text: "text-[#00C853]", bar: "bg-[#00C853]", badge: "border-[#00C853]/40 bg-[#00C853]/10 text-[#00C853]" };
}

interface Accessory {
  id: string;
  name: string;
  manufacturer: string;
  model: string | null;
  type: string;
  caliber: string | null;
  roundCount: number;
  purchasePrice: number | null;
  acquisitionDate: string | null;
  imageUrl: string | null;
  currentBuild: {
    id: string;
    name: string;
    slotType: string;
    firearm: { id: string; name: string };
  } | null;
}

export default function AccessoriesPage() {
  const [allAccessories, setAllAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadAccessories = useCallback(async (): Promise<Accessory[]> => {
    const response = await fetch("/api/accessories");
    if (!response.ok) throw new Error("Failed to load accessories");
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadInitialData = async () => {
      try {
        const data = await loadAccessories();
        if (isCancelled) return;
        setAllAccessories(data);
        setError(null);
      } catch (err) {
        if (isCancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load accessories");
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    void loadInitialData();

    return () => {
      isCancelled = true;
    };
  }, [loadAccessories]);

  const handleRetry = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await loadAccessories();
      setAllAccessories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accessories");
    } finally {
      setLoading(false);
    }
  }, [loadAccessories]);

  const accessories = allAccessories.filter((accessory) => {
    if (typeFilter !== "ALL" && accessory.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        accessory.name.toLowerCase().includes(q) ||
        accessory.manufacturer.toLowerCase().includes(q) ||
        (accessory.model ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableTypes = Array.from(new Set(allAccessories.map((accessory) => accessory.type)))
    .filter((type): type is SlotType => (SLOT_TYPES as readonly string[]).includes(type));

  const totalRounds = accessories.reduce((sum, a) => sum + a.roundCount, 0);

  return (
    <div className="min-h-full">
      <PageHeader
        title="Accessories"
        subtitle={`${accessories.length} part${accessories.length !== 1 ? "s" : ""} and attachment${accessories.length !== 1 ? "s" : ""}`}
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

      <div className="p-6">
        {/* Summary bar */}
        <div className="flex items-center gap-6 mb-4 bg-vault-surface border border-vault-border rounded-lg px-5 py-3">
          <div>
            <p className="text-xs text-vault-text-faint mb-0.5">Total parts</p>
            <p className="text-lg font-bold font-mono text-vault-text">{formatNumber(accessories.length)}</p>
          </div>
          <div className="w-px h-8 bg-vault-border" />
          <div>
            <p className="text-xs text-vault-text-faint mb-0.5">Total rounds through</p>
            <p className="text-lg font-bold font-mono text-[#00C2FF]">{formatNumber(totalRounds)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, manufacturer, or model..."
            className="w-full bg-vault-surface border border-vault-border text-vault-text rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors"
          />
        </div>

        {/* Type Filter */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs text-vault-text-faint whitespace-nowrap">Filter by type</span>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
              }}
              className="appearance-none bg-vault-surface border border-vault-border text-vault-text text-xs font-mono rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:border-[#00C2FF] cursor-pointer transition-colors hover:border-vault-text-muted/40"
            >
              <option value="ALL">All Types</option>
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {SLOT_TYPE_LABELS_LOCAL[type] ?? type}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-vault-text-faint absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#E53935]/10 border border-[#E53935]/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-[#E53935]" />
            </div>
            <h3 className="text-lg font-semibold text-vault-text mb-2">Failed to load accessories</h3>
            <p className="text-sm text-vault-text-muted mb-6 max-w-sm">{error}</p>
            <button
              onClick={() => {
                void handleRetry();
              }}
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        ) : accessories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mb-4">
              <Crosshair className="w-8 h-8 text-[#00C2FF]" />
            </div>
            <h3 className="text-lg font-semibold text-vault-text mb-2">
              {typeFilter === "ALL" ? "No accessories yet" : `No ${SLOT_TYPE_LABELS_LOCAL[typeFilter] ?? typeFilter} accessories`}
            </h3>
            <p className="text-sm text-vault-text-muted mb-6 max-w-sm">
              {typeFilter === "ALL"
                ? "Add parts, optics, suppressors and other attachments to track round counts and build configurations."
                : "No accessories of this type found. Try a different filter or add one."}
            </p>
            {typeFilter === "ALL" && (
              <Link
                href="/accessories/new"
                className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Accessory
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-vault-border">
                    <th className="text-left px-4 py-3 text-xs text-vault-text-faint font-medium w-12">Img</th>
                    <th className="text-left px-4 py-3 text-xs text-vault-text-faint font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-xs text-vault-text-faint font-medium hidden md:table-cell">Type</th>
                    <th className="text-left px-4 py-3 text-xs text-vault-text-faint font-medium hidden lg:table-cell">Manufacturer</th>
                    <th className="text-left px-4 py-3 text-xs text-vault-text-faint font-medium">Rounds</th>
                    <th className="text-left px-4 py-3 text-xs text-vault-text-faint font-medium hidden xl:table-cell">Installed On</th>
                    <th className="text-left px-4 py-3 text-xs text-vault-text-faint font-medium hidden lg:table-cell">Price</th>
                    <th className="text-left px-4 py-3 text-xs text-vault-text-faint font-medium hidden xl:table-cell">Acquired</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vault-border">
                  {accessories.map((accessory) => {
                    const colors = roundCountColor(accessory.roundCount, accessory.type);

                    return (
                      <tr key={accessory.id} className="hover:bg-vault-surface-2 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="relative w-9 h-9 rounded bg-vault-bg border border-vault-border overflow-hidden flex items-center justify-center shrink-0">
                            <SafeImage
                              src={accessory.imageUrl}
                              alt={accessory.name}
                              fill
                              sizes="36px"
                              loading="lazy"
                              className="w-full h-full object-cover"
                              fallback={<Shield className="w-4 h-4 text-vault-text-faint" />}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/accessories/${accessory.id}`} className="block">
                            <p className="font-semibold text-vault-text group-hover:text-[#00C2FF] transition-colors truncate max-w-[180px] flex items-center gap-1">
                              {accessory.name}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0" />
                            </p>
                            {accessory.model && (
                              <p className="text-xs text-vault-text-faint truncate max-w-[180px]">{accessory.model}</p>
                            )}
                          </Link>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 rounded border border-vault-border text-vault-text-muted font-medium">
                            {SLOT_TYPE_LABELS_LOCAL[accessory.type] ?? accessory.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm text-vault-text-muted truncate max-w-[120px]">{accessory.manufacturer}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center text-xs font-mono font-bold px-2 py-0.5 rounded border ${colors.badge}`}>
                            {formatNumber(accessory.roundCount)} rds
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          {accessory.currentBuild ? (
                            <div>
                              <p className="text-xs text-[#00C853] truncate max-w-[140px]">{accessory.currentBuild.firearm.name}</p>
                              <p className="text-[10px] text-vault-text-faint truncate max-w-[140px]">{accessory.currentBuild.name}</p>
                            </div>
                          ) : (
                            <p className="text-xs text-vault-text-faint">Not Assigned</p>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <p className="text-sm font-mono text-vault-text-muted">{formatCurrency(accessory.purchasePrice)}</p>
                        </td>
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <p className="text-xs text-vault-text-faint">{formatDate(accessory.acquisitionDate)}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
