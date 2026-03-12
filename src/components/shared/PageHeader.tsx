import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 px-4 sm:px-6 border-b border-vault-border", className)}>
      <div>
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-vault-text">{title}</h1>
        {subtitle && (
          <p className="text-xs sm:text-sm text-vault-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full sm:w-auto items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
