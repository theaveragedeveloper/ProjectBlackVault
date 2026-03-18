"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { BUILD_STATUSES } from "@/lib/types";
import { useToast } from "@/lib/store";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

interface Firearm {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  type: string;
  caliber: string;
}

export default function NewBuildPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const firearmId = params.id;

  const [firearm, setFirearm] = useState<Firearm | null>(null);
  const [firearmLoading, setFirearmLoading] = useState(true);
  const [firearmError, setFirearmError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [buildStatus, setBuildStatus] = useState<string>("in-progress");
  const toast = useToast();

  useEffect(() => {
    fetch(`/api/firearms/${firearmId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setFirearmError(data.error);
        } else {
          setFirearm(data);
        }
        setFirearmLoading(false);
      })
      .catch(() => {
        setFirearmError("Failed to load firearm");
        setFirearmLoading(false);
      });
  }, [firearmId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: data.get("name") as string,
      description: (data.get("description") as string) || null,
      firearmId,
      isActive,
      status: buildStatus,
    };

    try {
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to create build");
        setLoading(false);
        return;
      }

      toast.success("Build created");
      router.push(`/vault/${firearmId}/builds/${json.id}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (firearmLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
      </div>
    );
  }

  if (firearmError || !firearm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4">
        <AlertCircle className="w-10 h-10 text-[#E53935]" />
        <p className="text-[#E53935]">{firearmError ?? "Firearm not found"}</p>
        <Link href="/vault" className="text-sm text-[#00C2FF] hover:underline">
          Back to Vault
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-vault-border flex-wrap">
        <Link
          href={`/vault/${firearmId}`}
          className="flex items-center gap-1.5 text-vault-text-muted hover:text-vault-text text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {firearm.name}
        </Link>
        <span className="text-vault-border">/</span>
        <h1 className="text-sm font-semibold text-vault-text tracking-wide uppercase">
          New Build
        </h1>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded border border-vault-border text-vault-text-muted font-mono uppercase">
              {firearm.type}
            </span>
            <span className="text-xs text-vault-text-faint">{firearm.caliber}</span>
          </div>
          <h2 className="text-xl font-bold text-vault-text mb-1">
            New Build for {firearm.name}
          </h2>
          <p className="text-sm text-vault-text-muted">
            Configure a new loadout for this firearm.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Build Details
            </legend>

            <div>
              <label htmlFor="name" className={LABEL_CLASS}>
                Build Name <span className="text-[#E53935]">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Home Defense Setup"
                className={INPUT_CLASS}
                autoFocus
              />
              <p className="text-xs text-vault-text-faint mt-1">
                Give this configuration a descriptive name.
              </p>
            </div>

            <div>
              <label htmlFor="description" className={LABEL_CLASS}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Optional notes about this build's purpose or configuration..."
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </fieldset>

          {/* Build status */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Build Status
            </legend>
            <div className="mt-3 flex gap-2 flex-wrap">
              {BUILD_STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setBuildStatus(s.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-all ${
                    buildStatus === s.value
                      ? s.value === "in-progress"
                        ? "border-[#00C2FF]/60 bg-[#00C2FF]/10 text-[#00C2FF]"
                        : s.value === "complete"
                          ? "border-[#00C853]/60 bg-[#00C853]/10 text-[#00C853]"
                          : "border-[#F5A623]/60 bg-[#F5A623]/10 text-[#F5A623]"
                      : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/40"
                  }`}
                >
                  {buildStatus === s.value && (
                    <CheckCircle2 className="w-3 h-3" />
                  )}
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Active toggle */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Activation
            </legend>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`mt-3 flex items-center gap-3 w-full text-left px-4 py-3 rounded-md border transition-all ${
                isActive
                  ? "border-[#00C853]/40 bg-[#00C853]/5"
                  : "border-vault-border hover:border-vault-text-muted/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                  isActive
                    ? "border-[#00C853] bg-[#00C853]"
                    : "border-vault-text-faint"
                }`}
              >
                {isActive && (
                  <CheckCircle2 className="w-3 h-3 text-vault-bg" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-vault-text">
                  Set as Active Build
                </p>
                <p className="text-xs text-vault-text-muted mt-0.5">
                  Active build will be shown on the firearm&apos;s detail page. Only one
                  build per firearm can be active.
                </p>
              </div>
            </button>
          </fieldset>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/vault/${firearmId}`}
              className="px-4 py-2 text-sm text-vault-text-muted hover:text-vault-text border border-vault-border rounded-md hover:border-vault-text-muted/30 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {loading ? "Creating..." : "Create Build"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
