"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Wrench,
  Award,
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

const DEFAULT_ORDER = ["stats", "range-sessions", "personal-records", "maintenance-due", "low-ammo", "recent", "ammo-summary"];
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

interface RangeStats {
  count: number;
  totalRounds: number;
  sessionsLast30Days: number;
  lastSession: {
    id: string;
    date: string | Date;
    rangeName: string | null;
    roundsFired: number;
    firearmName: string;
  } | null;
}

interface MaintenanceDueItem {
  id: string;
  type: "schedule" | "battery";
  name: string;
  entityName: string;
  entityId: string;
  entityHref: string;
  intervalType: "ROUNDS" | "DAYS";
  daysUntilDue: number | null;
  roundsUntilDue: number | null;
  overdue: boolean;
}

interface DashboardData {
  firearmCount: number;
  accessoryCount: number;
  totalAmmoRounds: number;
  totalInvestment: number;
  lowStockItems: AmmoStockItem[];
  recentFirearms: RecentFirearm[];
  ammoStocks: AmmoStockItem[];
  rangeStats: RangeStats;
  maintenanceDue: MaintenanceDueItem[];
}

// ── Sortable wrapper ──────────────────────────────────────────
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

// ── Widgets ───────────────────────────────────────────────────
function StatsWidget({ data }: { data: DashboardData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      <Link href="/vault" className="block group">
        <StatCard
          label="Total Firearms"
          value={formatNumber(data.firearmCount)}
          subValue="in vault"
          icon={Shield}
          accent="blue"
          className="cursor-pointer hover:bg-vault-surface-2 transition-colors"
        />
      </Link>
      <Link href="/accessories" className="block group">
        <StatCard
          label="Total Accessories"
          value={formatNumber(data.accessoryCount)}
          subValue="parts & attachments"
          icon={Crosshair}
          accent="default"
          className="cursor-pointer hover:bg-vault-surface-2 transition-colors"
        />
      </Link>
      <Link href="/ammo" className="block group">
        <StatCard
          label="Total Ammo Rounds"
          value={formatNumber(data.totalAmmoRounds)}
          subValue="across all calibers"
          icon={Target}
          accent="amber"
          className="cursor-pointer hover:bg-vault-surface-2 transition-colors"
        />
      </Link>
      <Link href="/vault" className="block group">
        <StatCard
          label="Total Investment"
          value={formatCurrency(data.totalInvestment)}
          subValue="firearms + accessories"
          icon={DollarSign}
          accent="green"
          className="cursor-pointer hover:bg-vault-surface-2 transition-colors"
        />
      </Link>
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
                <div className="relative w-10 h-10 rounded bg-vault-border border border-vault-border overflow-hidden shrink-0 flex items-center justify-center">
                  {firearm.imageUrl ? (
                    <Image
                      src={firearm.imageUrl}
                      alt={firearm.name}
                      fill
                      sizes="40px"
                      loading="lazy"
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

function RangeSessionsWidget({ stats }: { stats: RangeStats }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-[#00C2FF]" />
        <h2 className="text-sm font-semibold tracking-widest uppercase text-[#00C2FF]">
          Range Activity
        </h2>
      </div>
      <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
        {stats.count === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mx-auto mb-3">
              <Target className="w-5 h-5 text-[#00C2FF]" />
            </div>
            <p className="text-sm text-vault-text-muted mb-3">No range sessions logged yet</p>
            <Link
              href="/range"
              className="text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors"
            >
              Log First Session
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 divide-x divide-vault-border border-b border-vault-border">
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Sessions</p>
                <p className="text-lg font-bold font-mono text-vault-text">{formatNumber(stats.count)}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Rounds</p>
                <p className="text-lg font-bold font-mono text-[#00C2FF]">{formatNumber(stats.totalRounds)}</p>
              </div>
              <div className="px-4 py-3 text-center">
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Last 30 Days</p>
                <p className="text-lg font-bold font-mono text-vault-text">{stats.sessionsLast30Days}</p>
              </div>
            </div>
            {stats.lastSession && (
              <Link href={`/range/${stats.lastSession.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-vault-surface-2 transition-colors group">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-vault-text-faint mb-0.5">Last session</p>
                  <p className="text-sm text-vault-text truncate group-hover:text-[#00C2FF] transition-colors">
                    {stats.lastSession.firearmName}
                    {stats.lastSession.rangeName ? ` · ${stats.lastSession.rangeName}` : ""}
                  </p>
                  <p className="text-xs text-vault-text-faint">
                    {formatDate(stats.lastSession.date)} · {formatNumber(stats.lastSession.roundsFired)} rds
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-vault-text-faint group-hover:text-[#00C2FF] transition-colors shrink-0" />
              </Link>
            )}
          </>
        )}
      </div>
      {stats.count > 0 && (
        <div className="mt-2 flex items-center justify-end gap-4">
          <Link href="/range"
            className="text-xs text-[#00C2FF] hover:text-[#00C2FF]/80 flex items-center gap-1">
            Log Session <ChevronRight className="w-3 h-3" />
          </Link>
          <Link href="/range/history"
            className="text-xs text-[#00C2FF] hover:text-[#00C2FF]/80 flex items-center gap-1">
            View History <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </section>
  );
}

function AmmoSummaryWidget({ ammoStocks }: { ammoStocks: AmmoStockItem[] }) {
  // Group by caliber
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

interface PersonalRecord {
  templateId: string;
  templateName: string;
  metric: "time" | "score" | "accuracy";
  value: number;
  unit: string;
  date: string;
  source: string;
  sourceId: string;
}

function PersonalRecordsWidget() {
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/personal-records?limit=5")
      .then((r) => r.json())
      .then((data) => {
        setRecords(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const METRIC_LABELS: Record<string, string> = { time: "Best Time", score: "Best Score", accuracy: "Best Accuracy" };

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 text-[#F5A623]" />
        <h2 className="text-sm font-semibold tracking-widest uppercase text-[#F5A623]">
          Personal Records
        </h2>
      </div>
      <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-5 h-5 border-2 border-[#F5A623]/30 border-t-[#F5A623] rounded-full animate-spin mx-auto" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center mx-auto mb-3">
              <Award className="w-5 h-5 text-[#F5A623]" />
            </div>
            <p className="text-sm text-vault-text-muted">No personal records yet</p>
            <p className="text-xs text-vault-text-faint mt-1">Log drills to track your bests</p>
          </div>
        ) : (
          <div className="divide-y divide-vault-border">
            {records.map((pr, i) => {
              const href =
                pr.source === "drill_log"
                  ? `/range/log-drill/${pr.sourceId}`
                  : `/range/${pr.sourceId}`;
              const valueDisplay =
                pr.metric === "time"
                  ? `${pr.value}${pr.unit}`
                  : pr.metric === "accuracy"
                  ? `${pr.value.toFixed(1)}${pr.unit}`
                  : `${pr.value}${pr.unit}`;
              return (
                <Link
                  key={i}
                  href={href}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-vault-surface-2 transition-colors group"
                >
                  <Award className="w-4 h-4 text-[#F5A623] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-vault-text truncate group-hover:text-[#00C2FF] transition-colors">
                      {pr.templateName}
                    </p>
                    <p className="text-xs text-vault-text-faint">{METRIC_LABELS[pr.metric]}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-[#F5A623]">{valueDisplay}</p>
                    <p className="text-xs text-vault-text-faint">
                      {new Date(pr.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-vault-text-faint group-hover:text-[#00C2FF] transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-2 text-right">
        <Link href="/range/drill-performance" className="text-xs text-[#00C2FF] hover:text-[#00C2FF]/80 flex items-center gap-1 justify-end">
          View Drill Performance <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}

function MaintenanceDueWidget({ items }: { items: MaintenanceDueItem[] }) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="w-4 h-4 text-[#F5A623]" />
        <h2 className="text-sm font-semibold tracking-widest uppercase text-[#F5A623]">
          Maintenance Due
        </h2>
      </div>
      <div className="bg-vault-surface border border-vault-border rounded-lg overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center mx-auto mb-3">
              <Wrench className="w-5 h-5 text-[#00C853]" />
            </div>
            <p className="text-sm text-vault-text-muted">No upcoming maintenance</p>
            <p className="text-xs text-vault-text-faint mt-1">All schedules are current</p>
          </div>
        ) : (
          <div className="divide-y divide-vault-border">
            {items.map((item) => {
              const isOverdue = item.overdue;
              const isDueSoon = !isOverdue && (
                (item.daysUntilDue != null && item.daysUntilDue <= 14) ||
                (item.roundsUntilDue != null && item.roundsUntilDue <= 100)
              );
              const statusColor = isOverdue ? "text-red-400" : isDueSoon ? "text-orange-400" : "text-[#F5A623]";
              const dueText = item.intervalType === "ROUNDS" && item.roundsUntilDue != null
                ? isOverdue ? `Overdue by ${Math.abs(item.roundsUntilDue)} rounds` : `${item.roundsUntilDue} rounds`
                : item.daysUntilDue != null
                ? isOverdue ? `Overdue by ${Math.abs(item.daysUntilDue)} days` : `${item.daysUntilDue} days`
                : "Due";

              return (
                <Link
                  key={item.id}
                  href={item.entityHref}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-vault-surface-2 transition-colors group"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isOverdue ? "bg-red-400" : isDueSoon ? "bg-orange-400" : "bg-[#F5A623]"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-vault-text truncate group-hover:text-[#00C2FF] transition-colors">
                      {item.entityName}
                    </p>
                    <p className="text-xs text-vault-text-faint">{item.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-semibold ${statusColor}`}>{dueText}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-vault-text-faint group-hover:text-[#00C2FF] transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-2 text-right">
        <Link href="/vault" className="text-xs text-[#00C2FF] hover:text-[#00C2FF]/80 flex items-center gap-1 justify-end">
          View Firearms <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}

// ── Main client component ─────────────────────────────────────
export function DashboardClient({ data }: { data: DashboardData }) {
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [editMode, setEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        // Ensure all default widgets are present (in case new ones were added)
        const merged = [
          ...parsed.filter((id) => DEFAULT_ORDER.includes(id)),
          ...DEFAULT_ORDER.filter((id) => !parsed.includes(id)),
        ];
        setOrder(merged);
      }
    } catch {
      // ignore
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

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
        return <StatsWidget data={data} />;
      case "range-sessions":
        return <RangeSessionsWidget stats={data.rangeStats} />;
      case "personal-records":
        return <PersonalRecordsWidget />;
      case "maintenance-due":
        return <MaintenanceDueWidget items={data.maintenanceDue} />;
      case "low-ammo":
        return <LowAmmoWidget items={data.lowStockItems} />;
      case "recent":
        return <RecentWidget firearms={data.recentFirearms} />;
      case "ammo-summary":
        return <AmmoSummaryWidget ammoStocks={data.ammoStocks} />;
      default:
        return null;
    }
  }

  // Before hydration, render default order without drag to avoid mismatch
  if (!mounted) {
    return (
      <div className="p-6 space-y-8">
        {DEFAULT_ORDER.map((id) => (
          <div key={id}>{renderWidget(id)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Customize bar */}
      <div className="flex items-center justify-end mb-6">
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
