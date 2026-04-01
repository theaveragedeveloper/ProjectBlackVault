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
  Settings,
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

interface BatteryDueItem {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  batteryType: string | null;
  lastBatteryChangeDate: string;
  replacementIntervalDays: number;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const UPCOMING_MS = 30 * 24 * 60 * 60 * 1000;

interface MaintenanceDueItemWithDue extends MaintenanceDueItem {
  dueDate: Date;
}

interface BatteryDueItemWithDue extends BatteryDueItem {
  dueDate: Date;
}

function MaintenanceDueWidget() {
  const [overdueFirearms, setOverdueFirearms] = useState<MaintenanceDueItemWithDue[]>([]);
  const [dueSoonFirearms, setDueSoonFirearms] = useState<MaintenanceDueItemWithDue[]>([]);
  const [overdueItems, setOverdueItems] = useState<BatteryDueItemWithDue[]>([]);
  const [dueSoonItems, setDueSoonItems] = useState<BatteryDueItemWithDue[]>([]);

  useEffect(() => {
    fetch("/api/firearms", { cache: "no-store" })
      .then((r) => r.json())
      .then((firearms) => {
        const now = new Date();
        const upcoming = new Date(now.getTime() + UPCOMING_MS);
        const allDue = (Array.isArray(firearms) ? firearms : [])
          .filter((f) => f.lastMaintenanceDate && f.maintenanceIntervalDays)
          .map((f) => ({
            ...f,
            dueDate: addDays(new Date(f.lastMaintenanceDate), Number(f.maintenanceIntervalDays)),
          }))
          .filter((f) => f.dueDate <= upcoming)
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

        const overdue = allDue.filter((f) => f.dueDate <= now);
        const dueSoon = allDue.filter((f) => f.dueDate > now);
        const MAX = 8;
        const overdueDisplay = overdue.slice(0, MAX);
        const dueSoonDisplay = dueSoon.slice(0, MAX - overdueDisplay.length);
        setOverdueFirearms(overdueDisplay);
        setDueSoonFirearms(dueSoonDisplay);
      })
      .catch(() => {
        setOverdueFirearms([]);
        setDueSoonFirearms([]);
      });

    fetch("/api/accessories", { cache: "no-store" })
      .then((r) => r.json())
      .then((accessories) => {
        const now = new Date();
        const upcoming = new Date(now.getTime() + UPCOMING_MS);
        const allDue = (Array.isArray(accessories) ? accessories : [])
          .filter(
            (a) =>
              a.hasBattery === true &&
              a.lastBatteryChangeDate != null &&
              a.replacementIntervalDays != null
          )
          .map((a) => ({
            ...a,
            dueDate: addDays(new Date(a.lastBatteryChangeDate), Number(a.replacementIntervalDays)),
          }))
          .filter((a) => a.dueDate <= upcoming)
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

        const overdue = allDue.filter((a) => a.dueDate <= now);
        const dueSoon = allDue.filter((a) => a.dueDate > now);
        const MAX = 8;
        const overdueDisplay = overdue.slice(0, MAX);
        const dueSoonDisplay = dueSoon.slice(0, MAX - overdueDisplay.length);
        setOverdueItems(overdueDisplay);
        setDueSoonItems(dueSoonDisplay);
      })
      .catch(() => {
        setOverdueItems([]);
        setDueSoonItems([]);
      });
  }, []);

  const hasFirearmItems = overdueFirearms.length > 0 || dueSoonFirearms.length > 0;
  const hasBatteryItems = overdueItems.length > 0 || dueSoonItems.length > 0;
  const renderNow = Date.now();

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#E53935]" />
        <h2 className="text-sm font-semibold tracking-widest uppercase text-[#E53935]">
          Maintenance Due
        </h2>
      </div>
      <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
        {!hasFirearmItems ? (
          <div className="p-8 text-center">
            <p className="text-sm text-vault-text-muted">No firearms currently due for maintenance</p>
          </div>
        ) : (
          <div className="divide-y divide-vault-border">
            {overdueFirearms.length > 0 && (
              <>
                <div className="px-4 py-1.5 bg-[#E53935]/5">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-[#E53935]/70">Overdue</span>
                </div>
                {overdueFirearms.map((item) => {
                  const daysOverdue = Math.ceil((renderNow - item.dueDate.getTime()) / 86400000);
                  return (
                    <Link
                      key={item.id}
                      href={`/vault/${item.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-vault-surface-2 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-vault-text">{item.name}</p>
                        <p className="text-xs text-vault-text-muted">{item.manufacturer} · {item.model}</p>
                      </div>
                      <span className="text-xs text-[#E53935] font-mono">{daysOverdue}d overdue</span>
                    </Link>
                  );
                })}
              </>
            )}
            {dueSoonFirearms.length > 0 && (
              <>
                <div className="px-4 py-1.5 bg-yellow-400/5">
                  <span className="text-[10px] font-semibold tracking-widest uppercase text-yellow-400/70">Due Soon</span>
                </div>
                {dueSoonFirearms.map((item) => {
                  const daysUntil = Math.ceil((item.dueDate.getTime() - renderNow) / 86400000);
                  return (
                    <Link
                      key={item.id}
                      href={`/vault/${item.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-vault-surface-2 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-vault-text">{item.name}</p>
                        <p className="text-xs text-vault-text-muted">{item.manufacturer} · {item.model}</p>
                      </div>
                      <span className="text-xs text-yellow-400 font-mono">Due in {daysUntil}d</span>
                    </Link>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {hasBatteryItems && (
        <>
          <div className="flex items-center gap-2 mt-5 mb-3">
            <Clock className="w-4 h-4 text-[#F5A623]" />
            <h2 className="text-sm font-semibold tracking-widest uppercase text-[#F5A623]">
              Battery Changes Due
            </h2>
          </div>
          <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
            <div className="divide-y divide-vault-border">
              {overdueItems.length > 0 && (
                <>
                  <div className="px-4 py-1.5 bg-[#E53935]/5">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-[#E53935]/70">Overdue</span>
                  </div>
                  {overdueItems.map((item) => {
                    const daysOverdue = Math.ceil((renderNow - item.dueDate.getTime()) / 86400000);
                    return (
                      <Link
                        key={item.id}
                        href={`/accessories/${item.id}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-vault-surface-2 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-vault-text">{item.name}</p>
                          <p className="text-xs text-vault-text-muted">
                            {item.manufacturer} · {item.model}
                            {item.batteryType ? ` — ${item.batteryType}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-[#E53935] font-mono">{daysOverdue}d overdue</span>
                      </Link>
                    );
                  })}
                </>
              )}
              {dueSoonItems.length > 0 && (
                <>
                  <div className="px-4 py-1.5 bg-yellow-400/5">
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-yellow-400/70">Due Soon</span>
                  </div>
                  {dueSoonItems.map((item) => {
                    const daysUntil = Math.ceil((item.dueDate.getTime() - renderNow) / 86400000);
                    return (
                      <Link
                        key={item.id}
                        href={`/accessories/${item.id}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-vault-surface-2 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-vault-text">{item.name}</p>
                          <p className="text-xs text-vault-text-muted">
                            {item.manufacturer} · {item.model}
                            {item.batteryType ? ` — ${item.batteryType}` : ""}
                          </p>
                        </div>
                        <span className="text-xs text-yellow-400 font-mono">Due in {daysUntil}d</span>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </>
      )}
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
      <Link href="/vault" className="block group">
        <StatCard
          label="Total Firearms"
          value={formatNumber(data.firearmCount)}
          subValue="in vault"
          icon={Shield}
          accent="blue"
          className="group-hover:border-vault-accent/40 transition-colors cursor-pointer"
        />
      </Link>
      <Link href="/accessories" className="block group">
        <StatCard
          label="Total Accessories"
          value={formatNumber(data.accessoryCount)}
          subValue="parts & attachments"
          icon={Crosshair}
          accent="default"
          className="group-hover:border-vault-accent/40 transition-colors cursor-pointer"
        />
      </Link>
      <Link href="/ammo" className="block group">
        <StatCard
          label="Total Ammo Rounds"
          value={formatNumber(data.totalAmmoRounds)}
          subValue="across all calibers"
          icon={Target}
          accent="amber"
          className="group-hover:border-vault-accent/40 transition-colors cursor-pointer"
        />
      </Link>
      <Link href="/vault" className="block group">
        <StatCard
          label="Total Investment"
          value={formatCurrency(data.totalInvestment)}
          subValue="firearms + accessories"
          icon={DollarSign}
          accent="green"
          className="group-hover:border-vault-accent/40 transition-colors cursor-pointer"
        />
      </Link>
    </div>
  );
}

function LowAmmoWidget({ items, totalStocks }: { items: AmmoStockItem[]; totalStocks: number }) {
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
            <p className="text-sm text-vault-text-muted">{totalStocks === 0 ? "No ammo entered" : "All stocks are well supplied"}</p>
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
  // Always initialise with DEFAULT_ORDER so server and client render identically,
  // avoiding React hydration mismatch #418.  localStorage is read in useEffect below.
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [editMode, setEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const [settingsHintDismissed, setSettingsHintDismissed] = useState(false);
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
    setMounted(true);
    setWelcomeDismissed(localStorage.getItem("bv-welcome-dismissed") === "1");
    setSettingsHintDismissed(localStorage.getItem("bv-settings-hint-shown") === "1");
    // Restore saved widget order now that we're safely on the client
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        setOrder([
          ...parsed.filter((id) => DEFAULT_ORDER.includes(id)),
          ...DEFAULT_ORDER.filter((id) => !parsed.includes(id)),
        ]);
      }
    } catch {
      // keep DEFAULT_ORDER
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
        return <LowAmmoWidget items={liveData.lowStockItems} totalStocks={liveData.ammoStocks.length} />;
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

      {mounted && !settingsHintDismissed && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <Settings className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-amber-400 font-medium">New here? Configure mobile access</p>
            <p className="text-xs text-amber-400/80 mt-0.5">
              Go to Settings to set up mobile access from your phone and tablet.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/settings"
              className="text-xs text-amber-400 hover:text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded transition-colors whitespace-nowrap"
            >
              Open Settings
            </Link>
            <button
              onClick={() => {
                localStorage.setItem("bv-settings-hint-shown", "1");
                setSettingsHintDismissed(true);
              }}
              className="text-amber-400/60 hover:text-amber-400 transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {mounted && !welcomeDismissed && liveData.firearmCount === 0 && liveData.accessoryCount === 0 && (
        <div className="mb-6 bg-vault-surface border border-vault-border rounded-lg p-5 relative">
          <button
            onClick={() => {
              localStorage.setItem("bv-welcome-dismissed", "1");
              setWelcomeDismissed(true);
            }}
            className="absolute top-3 right-3 text-vault-text-faint hover:text-vault-text-muted transition-colors p-1"
            aria-label="Dismiss welcome card"
          >
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-base font-semibold text-vault-text mb-1">Welcome to BlackVault</h2>
          <p className="text-xs text-vault-text-muted mb-4">Here&apos;s how to get started:</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#00C2FF] shrink-0">①</span>
                <span className="text-sm text-vault-text-muted">Add your first firearm</span>
              </div>
              <Link
                href="/vault/new"
                className="text-xs text-[#00C2FF] hover:text-[#00C2FF]/80 flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                Go to Vault
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#00C2FF] shrink-0">②</span>
                <span className="text-sm text-vault-text-muted">Set up mobile access</span>
              </div>
              <Link
                href="/settings"
                className="text-xs text-[#00C2FF] hover:text-[#00C2FF]/80 flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                Open Settings
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[#00C2FF] shrink-0">③</span>
                <span className="text-sm text-vault-text-muted">Log a range session</span>
              </div>
              <Link
                href="/range"
                className="text-xs text-[#00C2FF] hover:text-[#00C2FF]/80 flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                Go to Range
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
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
