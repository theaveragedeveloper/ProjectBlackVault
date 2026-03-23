"use client";

import { useState } from "react";
import { Shield } from "lucide-react";

export function UnlockScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/session/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store",
      });

      if (!response.ok) {
        setError("Incorrect password. Please try again.");
        return;
      }

      sessionStorage.setItem("blackvault-unlocked", "1");
      window.location.href = "/";
    } catch {
      setError("Unable to unlock right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-vault-bg text-vault-text flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-vault-border bg-vault-surface p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded bg-[#00C2FF]/10 border border-[#00C2FF]/30 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-[#00C2FF]" />
          </div>
          <div>
            <p className="text-xs font-bold text-vault-text tracking-widest uppercase leading-none">
              BlackVault Locked
            </p>
            <p className="text-[11px] text-vault-text-faint tracking-wider uppercase mt-1">
              Enter app password
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="space-y-3">
          <label className="block text-xs uppercase tracking-wider text-vault-text-faint">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full px-3 py-2 rounded-md border border-vault-border bg-vault-bg text-sm focus:outline-none focus:ring-2 focus:ring-[#00C2FF]/40"
            autoFocus
            required
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 rounded-md bg-[#00C2FF]/15 border border-[#00C2FF]/40 text-[#00C2FF] text-sm font-medium hover:bg-[#00C2FF]/20 transition-colors disabled:opacity-60"
          >
            {submitting ? "Unlocking..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
