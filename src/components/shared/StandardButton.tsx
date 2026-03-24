import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary:
    "bg-[#00C2FF]/12 border-[#00C2FF]/35 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:bg-[#00C2FF]/8",
  secondary:
    "bg-vault-surface-2 border-vault-border text-vault-text-muted hover:text-vault-text hover:border-vault-text-faint/30",
  danger:
    "bg-[#E53935]/12 border-[#E53935]/35 text-[#E53935] hover:bg-[#E53935]/20 disabled:bg-[#E53935]/8",
  ghost:
    "bg-transparent border-vault-border text-vault-text-faint hover:text-vault-text hover:bg-vault-surface-2",
};

export function buttonClassName(variant: ButtonVariant = "secondary", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
    "disabled:opacity-60 disabled:cursor-not-allowed min-h-10",
    VARIANT_CLASS[variant],
    className
  );
}

interface StandardButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
}

export function StandardButton({
  variant = "secondary",
  loading,
  loadingLabel,
  icon,
  children,
  className,
  disabled,
  ...props
}: StandardButtonProps) {
  return (
    <button
      className={buttonClassName(variant, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
