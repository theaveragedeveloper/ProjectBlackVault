import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const INPUT_CLASS =
  "w-full rounded-md border border-vault-border bg-vault-surface px-3 py-2.5 text-sm text-vault-text placeholder-vault-text-faint transition-colors focus:border-[#00C2FF] focus:outline-none";

export function FormField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-widest text-vault-text-muted">{label}</label>
      {children}
      {error ? <p className="text-xs text-[#E53935]">{error}</p> : hint ? <p className="text-xs text-vault-text-faint">{hint}</p> : null}
    </div>
  );
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid gap-4 md:grid-cols-2", className)}>{children}</div>;
}
