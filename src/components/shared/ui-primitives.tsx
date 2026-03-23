import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";

export const vaultInputClass =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";

export const vaultLabelClass = "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

export const vaultCardClass = "bg-vault-surface border border-vault-border rounded-lg p-4 sm:p-5";

export function VaultInput({ className, ...props }: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(vaultInputClass, className)} {...props} />;
}

export function VaultSelect({ className, ...props }: ComponentPropsWithoutRef<"select">) {
  return <select className={cn(vaultInputClass, className)} {...props} />;
}

export function VaultTextArea({ className, ...props }: ComponentPropsWithoutRef<"textarea">) {
  return <textarea className={cn(vaultInputClass, className)} {...props} />;
}

const BUTTON_VARIANTS = {
  primary: "bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20",
  success: "bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] hover:bg-[#00C853]/20",
  warning: "bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] hover:bg-[#F5A623]/20",
  ghost: "border border-vault-border text-vault-text-faint hover:text-vault-text",
} as const;

export function VaultButton({
  className,
  variant = "primary",
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: keyof typeof BUTTON_VARIANTS }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        BUTTON_VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
