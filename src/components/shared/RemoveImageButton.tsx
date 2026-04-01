"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  filename: string;
  entityType: "firearm" | "accessory";
  entityId: string;
  /** Called after successful deletion. If omitted, falls back to router.refresh(). */
  onSuccess?: () => void;
}

export function RemoveImageButton({ filename, entityType, entityId, onSuccess }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    const res = await fetch(
      `/api/images/delete?filename=${encodeURIComponent(filename)}&entityType=${entityType}&entityId=${entityId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    } else {
      setRemoving(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 bg-vault-bg/80 backdrop-blur-sm rounded px-2 py-1">
        <span className="text-xs text-vault-text-muted">Remove image?</span>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="text-xs text-[#E53935] hover:underline disabled:opacity-50"
        >
          {removing ? "Removing..." : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-vault-text-muted hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 bg-vault-bg/60 backdrop-blur-sm border border-[#1C2530]/60 text-vault-text-muted hover:text-[#E53935] hover:border-[#E53935]/40 px-2 py-1.5 rounded-md transition-colors text-xs"
      title="Remove image"
    >
      <X className="w-3.5 h-3.5" />
      Remove image
    </button>
  );
}
