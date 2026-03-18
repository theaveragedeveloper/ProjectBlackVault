"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  Target,
  Plus,
  Loader2,
  AlertCircle,
  Pencil,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingDown,
  Search,
} from "lucide-react";

interface AmmoStock {
  id: string;
  caliber: string;
  brand: string;
  grainWeight: number | null;
  bulletType: string | null;
  quantity: number;
  purchasePrice: number | null;
  purchaseDate: string | null;
  storageLocation: string | null;
  lowStockAlert: number | null;
  notes: string | null;
}

interface CaliberGroup {
  caliber: string;
  totalQuantity: number;
  stocks: AmmoStock[];
}

function stockStatus(quantity: number, lowAlert?: number | null): "ok" | "low" | "critical" | "empty" {
  if (quantity === 0) return "empty";
  if (lowAlert && quantity <= lowAlert / 2) return "critical";
  if (lowAlert && quantity <= lowAlert) return "low";
  return "ok";
}

const STATUS_STYLES: Record<string, { dot: string; bar: string; text: string; bg: string; border: string }> = {
  ok:       { dot: "bg-[#00C853]",               bar: "bg-[#00C853]",  text: "text-[#00C853]", bg: "bg-[#00C853]/10", border: "border-[#00C853]/30" },
  low:      { dot: "bg-[#F5A623]",               bar: "bg-[#F5A623]",  text: "text-[#F5A623]", bg: "bg-[#F5A623]/10", border: "border-[#F5A623]/30" },
  critical: { dot: "bg-[#E53935] animate-pulse", bar: "bg-[#E53935]",  text: "text-[#E53935]", bg: "bg-[#E53935]/10", border: "border-[#E53935]/30" },
  empty:    { dot: "bg-[#E53935]",               bar: "bg-[#E53935]",  text: "text-[#E53935]", bg: "bg-[#E53935]/10", border: "border-[#E53935]/30" },
};

function avgPricePerRound(stocks: AmmoStock[]): number | null {
  let pricedRounds = 0;
  let pricedValue = 0;

  for (const stock of stocks) {
    if (stock.purchasePrice !== null && stock.purchasePrice !== undefined && stock.purchasePrice > 0) {
      pricedRounds += stock.quantity;
      pricedValue += stock.quantity * stock.purchasePrice;
    }
  }

  if (pricedRounds === 0) return null;
  return pricedValue / pricedRounds;
}

const CALIBER_TEXT_COLORS: Record<string, string> = {
  ok:       "text-[#00C853]",
  low:      "text-[#F5A623]",
  critical: "text-[#E53935]",
  empty:    "text-[#E53935]",
};

function AddRoundsModal({
  stock,
  onClose,
  onSuccess,
}: {
  stock: AmmoStock;
  onClose: () => void;
  onSuccess: (stockId: string, newQty: number) => void;
}) {
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/ammo/${stock.id}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "PURCHASE", quantity: parseInt(qty), note: note || undefined }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed");
      setSubmitting(false);
    } else {
      onSuccess(stock.id, json.stock.quantity);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-bg/80 backdrop-blur-sm">
      <div className="bg-vault-surface border border-vault-border rounded-lg p-6 w-full max-w-md">
        <h3 className="text-sm font-semibold text-vault-text mb-1">Add Rounds</h3>
        <p className="text-xs text-vault-text-muted mb-4">
          {stock.brand} · {stock.caliber}
          {stock.grainWeight ? ` · ${stock.grainWeight}gr` : ""}
          {stock.bulletType ? ` · ${stock.bulletType}` : ""}
        </p>
        {error && (
          <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-xs text-[#E53935]">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vault-text-muted mb-1.5">
              Quantity to Add <span className="text-[#E53935]">*</span>
            </label>
            <input
              type="number"
              min={1}
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 500"
              className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
            />
            <p className="text-xs text-vault-text-faint mt-1">Current: {formatNumber(stock.quantity)} rds</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Academy purchase"
              className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-vault-text-muted hover:text-vault-text border border-vault-border rounded-md transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] hover:bg-[#00C853]/20 disabled:opacity-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LogUseModal({
  stock,
  onClose,
  onSuccess,
}: {
  stock: AmmoStock;
  onClose: () => void;
  onSuccess: (stockId: string, newQty: number) => void;
}) {
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/ammo/${stock.id}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "RANGE_USE", quantity: parseInt(qty), note: note || undefined }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed");
      setSubmitting(false);
    } else {
      onSuccess(stock.id, json.stock.quantity);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-bg/80 backdrop-blur-sm">
      <div className="bg-vault-surface border border-vault-border rounded-lg p-6 w-full max-w-md">
        <h3 className="text-sm font-semibold text-vault-text mb-1">Log Range Use</h3>
        <p className="text-xs text-vault-text-muted mb-4">
          {stock.brand} · {stock.caliber} · Current: {formatNumber(stock.quantity)} rds
        </p>
        {error && (
          <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-xs text-[#E53935]">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-vault-text-muted mb-1.5">
              Rounds Used <span className="text-[#E53935]">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={stock.quantity}
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="e.g. 100"
              className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Sunday range trip"
              className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-vault-text-muted hover:text-vault-text border border-vault-border rounded-md transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] hover:bg-[#F5A623]/20 disabled:opacity-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <TrendingDown className="w-3 h-3" />}
              Log Use
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditAmmoModal({
  stock,
  onClose,
  onUpdated,
}: {
  stock: AmmoStock;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [caliber, setCaliber] = useState(stock.caliber);
  const [brand, setBrand] = useState(stock.brand);
  const [grainWeight, setGrainWeight] = useState(stock.grainWeight?.toString() ?? "");
  const [bulletType, setBulletType] = useState(stock.bulletType ?? "");
  const [quantity, setQuantity] = useState(stock.quantity.toString());
  const [purchasePrice, setPurchasePrice] = useState(stock.purchasePrice?.toString() ?? "");
  const [purchaseDate, setPurchaseDate] = useState(stock.purchaseDate ? stock.purchaseDate.split("T")[0] : "");
  const [storageLocation, setStorageLocation] = useState(stock.storageLocation ?? "");
  const [lowStockAlert, setLowStockAlert] = useState(stock.lowStockAlert?.toString() ?? "");
  const [notes, setNotes] = useState(stock.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/ammo/${stock.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caliber,
        brand,
        grainWeight: grainWeight ? Number(grainWeight) : null,
        bulletType: bulletType || null,
        quantity: Number(quantity) || 0,
        purchasePrice: purchasePrice ? Number(purchasePrice) : null,
        purchaseDate: purchaseDate || null,
        storageLocation: storageLocation || null,
        lowStockAlert: lowStockAlert ? Number(lowStockAlert) : null,
        notes: notes || null,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Failed to update ammo");
      setSubmitting(false);
      return;
    }

    onUpdated();
    onClose();
  }

  async function handleDelete() {
    const confirmed = window.confirm(`Delete ${stock.brand} ${stock.caliber} ammo stock? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/ammo/${stock.id}`, { method: "DELETE" });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Failed to delete ammo");
      setDeleting(false);
      return;
    }

    onUpdated();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vault-bg/80 backdrop-blur-sm">
      <div className="bg-vault-surface border border-vault-border rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-sm font-semibold text-vault-text mb-1">Edit Ammo Stock</h3>
        <p className="text-xs text-vault-text-muted mb-4">Adjust stock details to reorganize or remove this entry.</p>

        {error && (
          <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded px-3 py-2 mb-4">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-xs text-[#E53935]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Caliber</label>
              <input value={caliber} onChange={(e) => setCaliber(e.target.value)} required className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Brand</label>
              <input value={brand} onChange={(e) => setBrand(e.target.value)} required className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Quantity</label>
              <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Bullet Type</label>
              <input value={bulletType} onChange={(e) => setBulletType(e.target.value)} className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Grain Weight</label>
              <input type="number" min={0} step="0.5" value={grainWeight} onChange={(e) => setGrainWeight(e.target.value)} className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Low Stock Alert</label>
              <input type="number" min={0} value={lowStockAlert} onChange={(e) => setLowStockAlert(e.target.value)} className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Purchase Price</label>
              <input type="number" min={0} step="0.01" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Purchase Date</label>
              <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Storage Location</label>
            <input value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-vault-text-muted mb-1.5">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF]" />
          </div>

          <div className="flex flex-wrap gap-2 justify-between pt-2">
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting || deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-[#E53935]/40 text-[#E53935] bg-[#E53935]/10 hover:bg-[#E53935]/20 rounded-md transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Delete Ammo
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-vault-text-muted hover:text-vault-text border border-vault-border rounded-md transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || deleting}
                className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AmmoPage() {
  const [groups, setGroups] = useState<CaliberGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCalibers, setExpandedCalibers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [addModal, setAddModal] = useState<AmmoStock | null>(null);
  const [logModal, setLogModal] = useState<AmmoStock | null>(null);
  const [editModal, setEditModal] = useState<AmmoStock | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAmmo();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAmmo]);

  function handleQtyUpdate(stockId: string, newQty: number) {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        stocks: g.stocks.map((s) =>
          s.id === stockId ? { ...s, quantity: newQty } : s
        ),
        totalQuantity: g.stocks.reduce(
          (sum, s) => sum + (s.id === stockId ? newQty : s.quantity),
          0
        ),
      }))
    );
  }

  function toggleCaliber(caliber: string) {
    setExpandedCalibers((prev) => {
      const next = new Set(prev);
      if (next.has(caliber)) {
        next.delete(caliber);
      } else {
        next.add(caliber);
      }
      return next;
    });
  }

  const filteredGroups = searchQuery
    ? groups
        .map((g) => {
          const q = searchQuery.toLowerCase();
          const matchedStocks = g.stocks.filter(
            (s) =>
              s.caliber.toLowerCase().includes(q) ||
              s.brand.toLowerCase().includes(q) ||
              (s.bulletType ?? "").toLowerCase().includes(q)
          );
          if (matchedStocks.length === 0) return null;
          return { ...g, stocks: matchedStocks, totalQuantity: matchedStocks.reduce((sum, s) => sum + s.quantity, 0) };
        })
        .filter(Boolean) as CaliberGroup[]
    : groups;

  const totalRounds = filteredGroups.reduce((sum, g) => sum + g.totalQuantity, 0);
  const inventoryValue = filteredGroups
    .flatMap((g) => g.stocks)
    .reduce((sum, s) => sum + s.quantity * (s.purchasePrice ?? 0), 0);

  return (
    <div className="min-h-full">
      <PageHeader
        title="Ammo"
        subtitle="Track stock levels by caliber and monitor usage."
        actions={
          <Link
            href="/ammo/new"
            className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Stock
          </Link>
        }
      />

      <div className="p-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-vault-text-faint pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by caliber, brand, or bullet type..."
            className="w-full bg-vault-surface border border-vault-border text-vault-text rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors"
          />
        </div>

        {/* Summary */}
        <div className="flex items-center gap-6 mb-6 bg-vault-surface border border-vault-border rounded-lg px-5 py-3">
          <div>
            <p className="text-xs text-vault-text-faint mb-0.5">Calibers</p>
            <p className="text-lg font-bold font-mono text-vault-text">{filteredGroups.length}</p>
          </div>
          <div className="w-px h-8 bg-vault-border" />
          <div>
            <p className="text-xs text-vault-text-faint mb-0.5">Total rounds</p>
            <p className="text-lg font-bold font-mono text-[#F5A623]">{formatNumber(totalRounds)}</p>
          </div>
          {inventoryValue > 0 && (
            <>
              <div className="w-px h-8 bg-vault-border" />
              <div>
                <p className="text-xs text-vault-text-faint mb-0.5">Inventory value</p>
                <p className="text-lg font-bold font-mono text-[#00C2FF]">{formatCurrency(inventoryValue)}</p>
              </div>
            </>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center mb-4">
              <Target className="w-8 h-8 text-[#F5A623]" />
            </div>
            <h3 className="text-lg font-semibold text-vault-text mb-2">
              {searchQuery ? "No matching ammo" : "No ammo stocks"}
            </h3>
            <p className="text-sm text-vault-text-muted mb-6 max-w-sm">
              {searchQuery
                ? "No ammunition matches your search. Try a different term."
                : "Start tracking your ammunition inventory by adding your first stock."}
            </p>
            <Link
              href="/ammo/new"
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Stock
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredGroups.map((group) => {
              const worstStatus = group.stocks.reduce<string>((worst, s) => {
                const st = stockStatus(s.quantity, s.lowStockAlert);
                const order = ["empty", "critical", "low", "ok"];
                return order.indexOf(st) < order.indexOf(worst) ? st : worst;
              }, "ok");

              const isExpanded = expandedCalibers.has(group.caliber);
              const styles = STATUS_STYLES[worstStatus];
              const totalColor = CALIBER_TEXT_COLORS[worstStatus];
              const groupAvgPrice = avgPricePerRound(group.stocks);

              return (
                <div
                  key={group.caliber}
                  className={`bg-vault-surface border rounded-lg overflow-hidden ${styles.border}`}
                >
                  {/* Caliber header */}
                  <button
                    onClick={() => toggleCaliber(group.caliber)}
                    className="w-full flex items-center justify-between px-4 py-4 hover:bg-vault-surface-2 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${styles.dot}`} />
                      <div className="text-left">
                        <p className="font-bold font-mono text-vault-text">{group.caliber}</p>
                        <p className="text-xs text-vault-text-faint">
                          {group.stocks.length} stock{group.stocks.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-2xl font-bold font-mono tabular-nums ${totalColor}`}>
                          {formatNumber(group.totalQuantity)}
                        </p>
                        {groupAvgPrice !== null && (
                          <p className="text-[10px] text-vault-text-faint font-mono">
                            avg {formatCurrency(groupAvgPrice ?? 0)}/rd
                          </p>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-vault-text-faint shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-vault-text-faint shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Stocks list */}
                  {isExpanded && (
                    <div className="border-t border-vault-border divide-y divide-vault-border">
                      {group.stocks.map((stock) => {
                        const st = stockStatus(stock.quantity, stock.lowStockAlert);
                        const ss = STATUS_STYLES[st];
                        const tc = CALIBER_TEXT_COLORS[st];

                        return (
                          <div key={stock.id} className="px-4 py-3">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ss.dot}`} />
                                  <p className="text-sm font-semibold text-vault-text truncate">
                                    {stock.brand}
                                  </p>
                                  {stock.bulletType && (
                                    <span className="text-[10px] font-mono text-vault-text-faint border border-vault-border px-1.5 py-0.5 rounded">
                                      {stock.bulletType}
                                    </span>
                                  )}
                                  {stock.grainWeight && (
                                    <span className="text-[10px] text-vault-text-faint">
                                      {stock.grainWeight}gr
                                    </span>
                                  )}
                                </div>
                                {stock.storageLocation && (
                                  <div className="flex items-center gap-1 mt-0.5 ml-3.5">
                                    <MapPin className="w-2.5 h-2.5 text-vault-text-faint" />
                                    <p className="text-[10px] text-vault-text-faint">{stock.storageLocation}</p>
                                  </div>
                                )}
                                {stock.lowStockAlert && (
                                  <p className="text-[10px] text-vault-text-faint ml-3.5 mt-0.5">
                                    Alert at {formatNumber(stock.lowStockAlert)} rds
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`text-base font-bold font-mono ${tc}`}>
                                  {formatNumber(stock.quantity)}
                                </p>
                                <p className="text-[10px] text-vault-text-faint">rds</p>
                              </div>
                            </div>

                            {/* Stock progress bar */}
                            {stock.lowStockAlert && (
                              <div className="mb-2 ml-3.5">
                                <div className="w-full bg-vault-border rounded-full h-1">
                                  <div
                                    className={`h-1 rounded-full ${ss.bar}`}
                                    style={{
                                      width: `${Math.min(
                                        (stock.quantity / (stock.lowStockAlert * 2)) * 100,
                                        100
                                      )}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 ml-3.5">
                              <button
                                onClick={() => setEditModal(stock)}
                                className="flex items-center gap-1 text-[10px] bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-2 py-1 rounded transition-colors"
                              >
                                <Pencil className="w-2.5 h-2.5" />
                                Edit
                              </button>
                              <button
                                onClick={() => setAddModal(stock)}
                                className="flex items-center gap-1 text-[10px] bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] hover:bg-[#00C853]/20 px-2 py-1 rounded transition-colors"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                Add Rounds
                              </button>
                              <button
                                onClick={() => setLogModal(stock)}
                                className="flex items-center gap-1 text-[10px] bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] hover:bg-[#F5A623]/20 px-2 py-1 rounded transition-colors"
                              >
                                <TrendingDown className="w-2.5 h-2.5" />
                                Log Use
                              </button>
                              {stock.purchasePrice && (
                                <span className="text-[10px] text-vault-text-faint font-mono ml-auto">
                                  {formatCurrency(stock.purchasePrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      {addModal && (
        <AddRoundsModal
          stock={addModal}
          onClose={() => setAddModal(null)}
          onSuccess={handleQtyUpdate}
        />
      )}
      {logModal && (
        <LogUseModal
          stock={logModal}
          onClose={() => setLogModal(null)}
          onSuccess={handleQtyUpdate}
        />
      )}
      {editModal && (
        <EditAmmoModal
          stock={editModal}
          onClose={() => setEditModal(null)}
          onUpdated={() => {
            void fetchAmmo();
          }}
        />
      )}
    </div>
  );
}
