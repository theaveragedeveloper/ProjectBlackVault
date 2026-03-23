import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function SectionCard({ title, description, actions, children, className, contentClassName }: SectionCardProps) {
  return (
    <section className={cn("rounded-xl border border-vault-border bg-vault-surface", className)}>
      {(title || description || actions) && (
        <div className="flex flex-col gap-3 border-b border-vault-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div>
            {title && <h2 className="text-sm font-semibold text-vault-text">{title}</h2>}
            {description && <p className="mt-1 text-xs text-vault-text-muted">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-4 sm:p-5", contentClassName)}>{children}</div>
    </section>
  );
}
