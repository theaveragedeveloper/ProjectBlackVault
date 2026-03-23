import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Tone = "success" | "error" | "warning" | "info";

const TONE_STYLES: Record<Tone, string> = {
  success: "border-[#00C853]/30 bg-[#00C853]/10 text-[#00C853]",
  error: "border-[#E53935]/30 bg-[#E53935]/10 text-[#E53935]",
  warning: "border-[#F5A623]/30 bg-[#F5A623]/10 text-[#F5A623]",
  info: "border-[#00C2FF]/30 bg-[#00C2FF]/10 text-[#00C2FF]",
};

const TONE_ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertCircle,
  info: Info,
} as const;

export function StatusMessage({ tone, message, className }: { tone: Tone; message: string; className?: string }) {
  const Icon = TONE_ICON[tone];
  return (
    <div className={cn("flex items-start gap-2 rounded-lg border px-4 py-3 text-sm", TONE_STYLES[tone], className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
