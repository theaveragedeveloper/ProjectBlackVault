import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  accent?: "blue" | "amber" | "green" | "red" | "default";
  className?: string;
}

const ACCENT_STYLES = {
  blue:    { border: "border-t-[#00C2FF]", icon: "text-[#00C2FF] bg-[#00C2FF]/10", value: "text-[#00C2FF]" },
  amber:   { border: "border-t-[#F5A623]", icon: "text-[#F5A623] bg-[#F5A623]/10", value: "text-[#F5A623]" },
  green:   { border: "border-t-[#00C853]", icon: "text-[#00C853] bg-[#00C853]/10", value: "text-[#00C853]" },
  red:     { border: "border-t-[#E53935]", icon: "text-[#E53935] bg-[#E53935]/10", value: "text-[#E53935]" },
  default: { border: "border-t-[#1C2530]", icon: "text-[#8B9DB0] bg-[#1C2530]",   value: "text-[#E8EDF2]" },
};

export function StatCard({ label, value, subValue, icon: Icon, accent = "default", className }: StatCardProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <div
      className={cn(
        "bg-[#0E1318] border border-[#1C2530] border-t-2 rounded-lg p-4 animate-slide-up",
        styles.border,
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-[#4A5A6B] font-medium mb-2">
            {label}
          </p>
          <p className={cn("text-2xl font-bold font-mono tabular-nums", styles.value)}>
            {value}
          </p>
          {subValue && (
            <p className="text-xs text-[#8B9DB0] mt-1">{subValue}</p>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2 rounded-md shrink-0", styles.icon)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
