import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-vault-border bg-vault-bg px-4 py-10 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-vault-border bg-vault-surface-2">
        <Icon className="h-5 w-5 text-vault-text-faint" />
      </div>
      <h3 className="text-sm font-semibold text-vault-text">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-vault-text-muted">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-4 inline-flex min-h-10 items-center rounded-md border border-[#00C2FF]/30 bg-[#00C2FF]/12 px-3 py-2 text-sm font-medium text-[#00C2FF] hover:bg-[#00C2FF]/20"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
