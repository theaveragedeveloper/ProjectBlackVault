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
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4 sm:py-5 px-4 sm:px-6 border-b border-vault-border", className)}>
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold leading-tight text-vault-text">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm sm:text-[15px] leading-relaxed text-vault-text-muted">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex w-full sm:w-auto items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}
