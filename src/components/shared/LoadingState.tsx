import { Loader2 } from "lucide-react";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center gap-2 rounded-lg border border-vault-border bg-vault-surface">
      <Loader2 className="h-5 w-5 animate-spin text-[#00C2FF]" />
      <span className="text-sm text-vault-text-muted">{label}</span>
    </div>
  );
}
