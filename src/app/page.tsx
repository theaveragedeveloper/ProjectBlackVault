import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import {
  Shield,
  Crosshair,
  Target,
  DollarSign,
  AlertTriangle,
  Clock,
  ChevronRight,
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

async function getDashboardData() {
  const [
    firearmCount,
    accessoryCount,
    ammoStocks,
    firearms,
    accessories,
    recentFirearms,
  ] = await Promise.all([
    prisma.firearm.count(),
    prisma.accessory.count(),
    prisma.ammoStock.findMany({
      select: {
        id: true,
        caliber: true,
        brand: true,
        quantity: true,
        purchasePrice: true,
        lowStockAlert: true,
        grainWeight: true,
        bulletType: true,
      },
    }),
    prisma.firearm.findMany({
      select: { id: true, purchasePrice: true, currentValue: true },
    }),
    prisma.accessory.findMany({
      select: { id: true, purchasePrice: true },
    }),
    prisma.firearm.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        manufacturer: true,
        model: true,
        type: true,
        caliber: true,
        imageUrl: true,
        acquisitionDate: true,
        createdAt: true,
      },
    }),
  ]);

  const totalAmmoRounds = ammoStocks.reduce((sum, s) => sum + s.quantity, 0);

  const totalFirearmInvestment = firearms.reduce((sum, f) => sum + (f.purchasePrice ?? 0), 0);
  const totalAccessoryInvestment = accessories.reduce((sum, a) => sum + (a.purchasePrice ?? 0), 0);
  const totalInvestment = totalFirearmInvestment + totalAccessoryInvestment;

  const lowStockItems = ammoStocks.filter(
    (s) => s.lowStockAlert != null && s.quantity <= s.lowStockAlert
  );

  return {
    firearmCount,
    accessoryCount,
    totalAmmoRounds,
    totalInvestment,
    lowStockItems,
    recentFirearms,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="tactical-grid min-h-full">
      <PageHeader
        title="COMMAND CENTER"
        subtitle="BlackVault Armory Platform — Tactical Inventory Overview"
      />

      <div className="p-6 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Low Ammo Alerts */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#F5A623]" />
              <h2 className="text-sm font-semibold tracking-widest uppercase text-[#F5A623]">
                Low Ammo Alerts
              </h2>
              {data.lowStockItems.length > 0 && (
                <span className="ml-auto text-xs font-mono bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] px-2 py-0.5 rounded">
                  {data.lowStockItems.length} alerts
                </span>
              )}
            </div>

            <div className="bg-[#0E1318] border border-[#1C2530] rounded-lg overflow-hidden">
              {data.lowStockItems.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#00C853]/10 border border-[#00C853]/20 flex items-center justify-center mx-auto mb-3">
                    <Target className="w-5 h-5 text-[#00C853]" />
                  </div>
                  <p className="text-sm text-[#8B9DB0]">All stocks are well supplied</p>
                </div>
              ) : (
                <div className="divide-y divide-[#1C2530]">
                  {data.lowStockItems.map((item) => {
                    const pct = item.lowStockAlert
                      ? Math.round((item.quantity / item.lowStockAlert) * 100)
                      : 100;
                    const isCritical = item.lowStockAlert != null && item.quantity <= item.lowStockAlert / 2;
                    const statusColor = item.quantity === 0
                      ? "text-[#E53935]"
                      : isCritical
                      ? "text-[#E53935]"
                      : "text-[#F5A623]";
                    const barColor = item.quantity === 0
                      ? "bg-[#E53935]"
                      : isCritical
                      ? "bg-[#E53935]"
                      : "bg-[#F5A623]";

                    return (
                      <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono font-semibold text-[#E8EDF2]">
                              {item.caliber}
                            </span>
                            <span className="text-xs text-[#4A5A6B]">·</span>
                            <span className="text-xs text-[#8B9DB0] truncate">{item.brand}</span>
                          </div>
                          <div className="w-full bg-[#1C2530] rounded-full h-1">
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
                          <p className="text-xs text-[#4A5A6B]">
                            alert: {formatNumber(item.lowStockAlert ?? 0)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {data.lowStockItems.length > 0 && (
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

          {/* Recent Acquisitions */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-[#00C2FF]" />
              <h2 className="text-sm font-semibold tracking-widest uppercase text-[#00C2FF]">
                Recent Acquisitions
              </h2>
            </div>

            <div className="bg-[#0E1318] border border-[#1C2530] rounded-lg overflow-hidden">
              {data.recentFirearms.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-5 h-5 text-[#00C2FF]" />
                  </div>
                  <p className="text-sm text-[#8B9DB0] mb-3">No firearms in vault yet</p>
                  <Link
                    href="/vault/new"
                    className="text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-3 py-1.5 rounded transition-colors"
                  >
                    Add First Firearm
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#1C2530]">
                  {data.recentFirearms.map((firearm) => (
                    <Link
                      key={firearm.id}
                      href={`/vault/${firearm.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#131A22] transition-colors group"
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded bg-[#1C2530] border border-[#1C2530] overflow-hidden shrink-0 flex items-center justify-center">
                        {firearm.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={firearm.imageUrl}
                            alt={firearm.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Shield className="w-4 h-4 text-[#4A5A6B]" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-[#E8EDF2] truncate group-hover:text-[#00C2FF] transition-colors">
                            {firearm.name}
                          </p>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border font-mono uppercase shrink-0 ${
                              TYPE_BADGE_COLORS[firearm.type] ?? "border-[#1C2530] text-[#8B9DB0]"
                            }`}
                          >
                            {FIREARM_TYPE_LABELS[firearm.type] ?? firearm.type}
                          </span>
                        </div>
                        <p className="text-xs text-[#8B9DB0]">
                          {firearm.manufacturer} · {firearm.caliber}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-[#4A5A6B]">
                          {formatDate(firearm.acquisitionDate)}
                        </p>
                        <ChevronRight className="w-3 h-3 text-[#4A5A6B] group-hover:text-[#00C2FF] ml-auto mt-1 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {data.recentFirearms.length > 0 && (
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
        </div>
      </div>
    </div>
  );
}
