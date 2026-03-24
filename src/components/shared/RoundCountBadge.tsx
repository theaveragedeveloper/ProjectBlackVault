import { formatNumber } from "@/lib/utils";

export function RoundCountBadge({ roundCount, className = "" }: { roundCount: number; className?: string }) {
  return (
    <span className={`shrink-0 text-[10px] font-mono text-[#F5A623] bg-[#F5A623]/10 border border-[#F5A623]/20 px-1.5 py-0.5 rounded ${className}`}>
      Rounds {formatNumber(Math.max(0, roundCount ?? 0))}
    </span>
  );
}
