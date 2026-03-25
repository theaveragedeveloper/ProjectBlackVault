"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import {
  Shield,
  Crosshair,
  Target,
  DollarSign,
  AlertTriangle,
  Clock,
  ChevronRight,
  GripVertical,
  Settings2,
  X,
  Package,
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

const DEFAULT_ORDER = ["stats", "maintenance-due", "low-ammo", "recent", "ammo-summary"];
const STORAGE_KEY = "vault-dashboard-layout";

interface AmmoStockItem {
  id: string;
  caliber: string;
  brand: string;
  quantity: number;
  purchasePrice: number | null;
  lowStockAlert: number | null;
  grainWeight: number | null;
  bulletType: string | null;
}

interface RecentFirearm {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  type: string;
  caliber: string;
  imageUrl: string | null;
  acquisitionDate: Date | null;
  createdAt: Date;
}

interface MaintenanceDueItem {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  lastMaintenanceDate: string | null;
  maintenanceIntervalDays: number | null;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function MaintenanceDueWidget() {
  const [items, setItems] = useState<MaintenanceDueItem[]>([]);

  useEffect(() => {
    fetch("/api/firearms", { cache: "no-store" })
      .then((r) => r.json())
      .then((firearms) => {
        const now = new Date();
        const due = (Array.isArray(firearms) ? firearms : [])
          .filter((f) => f.lastMaintenanceDate && f.maintenanceIntervalDays)
          .map((f) => ({
            ...f,
            dueDate: addDays(new Date(f.lastMaintenanceDate), Number(f.maintenanceIntervalDays)),
          }))
          .filter((f) => f.dueDate <= now)
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
          .slice(0, 8);
        setItems(due);
      })
      .catch(() => setItems([]));
  }, []);

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#E53935]" />
        <h2 className="text-sm font-semibold tracking-widest uppercase text-[#E53935]">
          Maintenance Due
        </h2>
      </div>
      <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-vault-text-muted">No firearms currently due for maintenance</p>
          </div>
        ) : (
          <div className="divide-y divide-vault-border">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/vault/${item.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-vault-surface-2 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-vault-text">{item.name}</p>
                  <p className="text-xs text-vault-text-muted">{item.manufacturer} · {item.model}</p>
                </div>
                <span className="text-xs text-[#E53935] font-mono">Due</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface DashboardData {
  firearmCount: number;
  accessoryCount: number;
  totalAmmoRounds: number;
  totalInvestment: number;
  lowStockItems: AmmoStockItem[];
  recentFirearms: RecentFirearm[];
  ammoStocks: AmmoStockItem[];
}

interface StatsResponse {
  totals?: {
    firearms?: number;
    accessories?: number;
    ammoRounds?: number;
  };
  investment?: {
    totalCost?: number;
  };
  ammo?: {
    stocks?: AmmoStockItem[];
    lowStockItems?: AmmoStockItem[];
  };
  recent?: {
    firearms?: RecentFirearm[];
  };
}

function SortableWidget({
  id,
  editMode,
  children,
}: {
  id: string;
  editMode: boolean;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style}>
      {editMode && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-3 right-3 z-10 cursor-grab active:cursor-grabbing p-1.5 rounded bg-vault-surface-2 border border-vault-border text-vault-text-faint hover:text-vault-text-muted transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}
      <div
        className={
          editMode
            ? "rounded-lg ring-1 ring-[#00C2FF]/30 animate-pulse-ring transition-all"
            : ""
        }
      >
        {children}
      </div>
    </div>
  );
}

function StatsWidget({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Total Firearms"
        value={formatNumber(data.firearmCount)}
        subValue="in vault"
        icon={Shield}
        accent="blue"
      />
      <StatCard
        label="Total Accessories"
        value={formatNumber(data.accessoryCount)}
        subValue="parts & attachments"
        icon={Crosshair}
        accent="default"
      />
      <StatCard
        label="Total Ammo Rounds"
        value={formatNumber(data.totalAmmoRounds)}
        subValue="across all calibers"
        icon={Target}
        accent="amber"
      />
      <StatCard
        label="Total Investment"
        value={formatCurrency(data.totalInvestment)}
        subValue="firearms + accessories"
        icon={DollarSign}
        accent="green"
      />
    </div>
  );
}

function LowAmmoWidget({ items }: { items: AmmoStockItem[] }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-[#F5A623]" />
        <h2 className="text-sm font-semibold tracking-widest uppercase text-[#F5A623]">
          Low Ammo Alerts
        </h2>
        {items.length > 0 && (
          <span className="ml-auto text-xs font-mono bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] px-2 py-0.5 rounded">
            {items.length} alerts
          </span>
        )}
      </div>
      <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center mx-auto mb-3">
              <Target className="w-5 h-5 text-[#00C853]" />
            </div>
            <p className="text-sm text-vault-text-muted">All stocks are well supplied</p>
          </div>
        ) : (
          <div className="divide-y divide-vault-border">
            {items.map((item) => {
              const pct = item.lowStockAlert
                ? Math.round((item.quantity / item.lowStockAlert) * 100)
                : 100;
              const isCritical = item.lowStockAlert != null && item.quantity <= item.lowStockAlert / 2;
              const statusColor =
                item.quantity === 0 || isCritical ? "text-[#E53935]" : "text-[#F5A623]";
              const barColor =
                item.quantity === 0 || isCritical ? "bg-[#E53935]" : "bg-[#F5A623]";
              return (
                <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-mono font-semibold text-vault-text">
                        {item.caliber}
                      </span>
                      <span className="text-xs text-vault-text-faint">·</span>
                      <span className="text-xs text-vault-text-muted truncate">{item.brand}</span>
                    </div>
                    <div className="w-full bg-vault-border rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-mono font-bold ${statusColor}`}>
                      {formatNumber(item.quantity)}
                    </p>
                    <p className="text-xs text-vault-text-faint">
                      alert: {formatNumber(item.lowStockAlert ?? 0)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {items.length > 0 && (
        <div className="mt-2 text-right">
          <Link
            href="/ammo"
            className="text-xs text-[#00C2FF] hover:text-[#00C2FF]/80 flex items-center gap-1 justify-end"
          >
            View Ammo Depot
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </section>
  );
}

function RecentWidget({ firearms }: { firearms: RecentFirearm[] }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#00C2FF]" />
        <h2 className="text-sm font-semibold tracking-widest uppercase text-[#00C2FF]">
          Recent Acquisitions
        </h2>
      </div>
      <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
        {firearms.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-5 h-5 text-[#00C2FF]" />
            </div>
            <p className="text-sm text-vault-text-muted mb-3">No firearms in vault yet</p>
            <Link
              href="/vault/new"
              className="text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors"
            >
              Add First Firearm
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-vault-border">
            {firearms.map((firearm) => (
              <Link
                key={firearm.id}
                href={`/vault/${firearm.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-vault-surface-2 transition-colors group"
              >
                <div className="w-10 h-10 rounded bg-vault-border border border-vault-border overflow-hidden shrink-0 flex items-center justify-center">
                  {firearm.imageUrl ? (
                    <img
                      src={firearm.imageUrl}
                      alt={firearm.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Shield className="w-4 h-4 text-vault-text-faint" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-vault-text truncate group-hover:text-[#00C2FF] transition-colors">
                      {firearm.name}
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase shrink-0 ${
                        TYPE_BADGE_COLORS[firearm.type] ?? "border-vault-border text-vault-text-muted"
                      }`}
                    >
                      {FIREARM_TYPE_LABELS[firearm.type] ?? firearm.type}
                    </span>
                  </div>
                  <p className="text-xs text-vault-text-muted">
                    {firearm.manufacturer} · {firearm.caliber}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-vault-text-faint">
                    {formatDate(firearm.acquisitionDate)}
                  </p>
                  <ChevronRight className="w-3 h-3 text-vault-text-faint group-hover:text-[#00C2FF] ml-auto mt-1 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      {firearms.length > 0 && (
        <div className="mt-2 text-right">
          <Link
            href="/vault"
            className="text-xs text-[#00C2FF] hover:text-[#00C2FF]/80 flex items-center gap-1 justify-end"
          >
            View Full Vault
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </section>
  );
}

function AmmoSummaryWidget({ ammoStocks }: { ammoStocks: AmmoStockItem[] }) {
  const byCaliber = ammoStocks.reduce<Record<string, number>>((acc, stock) => {
    acc[stock.caliber] = (acc[stock.caliber] ?? 0) + stock.quantity;
    return acc;
  }, {});

  const sorted = Object.entries(byCaliber).sort(([, a], [, b]) => b - a);
  const maxQty = sorted[0]?.[1] ?? 1;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-4 h-4 text-[#00C853]" />
        <h2 className="text-sm font-semibold tracking-widest uppercase text-[#00C853]">
          Ammo by Caliber
        </h2>
      </div>
      <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center mx-auto mb-3">
              <Package className="w-5 h-5 text-[#00C853]" />
            </div>
            <p className="text-sm text-vault-text-muted mb-3">No ammo tracked yet</p>
            <Link
              href="/ammo"
              className="text-xs bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] hover:bg-[#00C853]/20 px-3 py-1.5 rounded transition-colors"
            >
              Add Ammo Stock
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-vault-border">
            {sorted.map(([caliber, qty]) => {
              const pct = Math.round((qty / maxQty) * 100);
              return (
                <div key={caliber} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-mono font-semibold text-vault-text">
                        {caliber}
                      </span>
                      <span className="text-sm font-mono font-bold text-[#00C853]">
                        {formatNumber(qty)}
                      </span>
                    </div>
                    <div className="w-full bg-vault-border rounded-full h-1">
                      <div
                        className="h-1 rounded-full bg-[#00C853] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {sorted.length > 0 && (
        <div className="mt-2 text-right">
          <Link
            href="/ammo"
            className="text-xs text-[#00C2FF] hover:text-[#00C2FF]/80 flex items-center gap-1 justify-end"
          >
            View Ammo Depot
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </section>
  );
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const [liveData, setLiveData] = useState<DashboardData>(data);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [order, setOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return DEFAULT_ORDER;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return DEFAULT_ORDER;
      const parsed: string[] = JSON.parse(saved);
      return [
        ...parsed.filter((id) => DEFAULT_ORDER.includes(id)),
        ...DEFAULT_ORDER.filter((id) => !parsed.includes(id)),
      ];
    } catch {
      return DEFAULT_ORDER;
    }
  });
  const [editMode, setEditMode] = useState(false);
  const [mounted] = useState(() => typeof window !== "undefined");
  const isFirstRun =
    liveData.firearmCount === 0 && liveData.accessoryCount === 0 && liveData.totalAmmoRounds === 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const refreshDashboardData = useCallback(async () => {
    try {
      const response = await fetch("/api/stats", { cache: "no-store" });
      if (!response.ok) return;
      const stats: StatsResponse = await response.json();
      setLiveData({
        firearmCount: stats.totals?.firearms ?? 0,
        accessoryCount: stats.totals?.accessories ?? 0,
        totalAmmoRounds: stats.totals?.ammoRounds ?? 0,
        totalInvestment: stats.investment?.totalCost ?? 0,
        lowStockItems: stats.ammo?.lowStockItems ?? [],
        recentFirearms: stats.recent?.firearms ?? [],
        ammoStocks: stats.ammo?.stocks ?? [],
      });
      setLastUpdated(new Date());
    } catch {
      // Keep server-provided data when refresh fails.
    }
  }, []);

  useEffect(() => {
    setLiveData(data);
  }, [data]);

  useEffect(() => {
    refreshDashboardData();

    const handleFocus = () => {
      refreshDashboardData();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshDashboardData();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshDashboardData]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        const newOrder = arrayMove(order, oldIndex, newIndex);
        setOrder(newOrder);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
      }
    },
    [order]
  );

  function renderWidget(id: string) {
    switch (id) {
      case "stats":
        return <StatsWidget data={liveData} />;
      case "maintenance-due":
        return <MaintenanceDueWidget />;
      case "low-ammo":
        return <LowAmmoWidget items={liveData.lowStockItems} />;
      case "recent":
        return <RecentWidget firearms={liveData.recentFirearms} />;
      case "ammo-summary":
        return <AmmoSummaryWidget ammoStocks={liveData.ammoStocks} />;
      default:
        return null;
    }
  }

  if (!mounted) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6 space-y-6 sm:space-y-8">
        {DEFAULT_ORDER.map((id) => (
          <div key={id}>{renderWidget(id)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs text-vault-text-faint">
          {lastUpdated
            ? `Last updated ${lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
            : ""}
        </p>

        {editMode ? (
          <div className="flex items-center gap-3">
            <p className="text-xs text-vault-text-muted">Drag widgets to reorder</p>
            <button
              onClick={() => setEditMode(false)}
              className="flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors"
            >
              <X className="w-3 h-3" />
              Done
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 text-xs text-vault-text-faint hover:text-vault-text-muted border border-vault-border px-3 py-1.5 rounded transition-colors"
          >
            <Settings2 className="w-3 h-3" />
            Customize
          </button>
        )}
      </div>

      {isFirstRun && (
        <section className="mb-6 rounded-lg border border-[#00C2FF]/25 bg-[#00C2FF]/5 p-4">
          <h2 className="text-sm font-semibold text-vault-text mb-1">Welcome to BlackVault</h2>
          <p className="text-xs text-vault-text-muted mb-3">
            Start by adding a firearm, then attach accessories, upload receipts or tax stamps, and track ammo and range sessions.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/vault/new" className="text-xs px-3 py-1.5 rounded border border-[#00C2FF]/30 text-[#00C2FF] bg-[#00C2FF]/10 hover:bg-[#00C2FF]/20 transition-colors">
              Add Firearm
            </Link>
            <Link href="/documents" className="text-xs px-3 py-1.5 rounded border border-vault-border text-vault-text-muted hover:text-vault-text hover:border-vault-text-muted/30 transition-colors">
              Upload Documents
            </Link>
            <Link href="/range/log-session" className="text-xs px-3 py-1.5 rounded border border-vault-border text-vault-text-muted hover:text-vault-text hover:border-vault-text-muted/30 transition-colors">
              Log Range Session
            </Link>
          </div>
        </section>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="space-y-8">
            {order.map((id) => (
              <SortableWidget key={id} id={id} editMode={editMode}>
                {renderWidget(id)}
              </SortableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
