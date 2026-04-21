"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";

interface ArchiveButtonProps {
  id: string;
  entityType: "firearms" | "accessories";
  redirectTo: string;
  label?: string;
  unarchive?: boolean;  // when true, sends { archived: false }
}

export function ArchiveButton({ id, entityType, redirectTo, label = "Archive", unarchive = false }: ArchiveButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/${entityType}/${id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !unarchive }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Failed to archive");
      }
      router.refresh();
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-vault-text-muted">
          {unarchive ? "Unarchive this item?" : "Archive this item?"}
        </span>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="text-xs px-3 py-1.5 rounded border border-[#F5A623]/40 text-[#F5A623] hover:bg-[#F5A623]/10 transition-colors disabled:opacity-50"
        >
          {loading ? "Archiving…" : "Yes, archive"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-3 py-1.5 rounded border border-vault-border text-vault-text-muted hover:bg-vault-surface-2 transition-colors"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-[#E53935]">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 text-sm border border-vault-border text-vault-text-muted hover:text-vault-text hover:border-[#F5A623]/40 px-3 py-1.5 rounded transition-colors"
    >
      <Archive className="w-4 h-4" />
      {label}
    </button>
  );
}
