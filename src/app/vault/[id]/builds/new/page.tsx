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

const INPUT_CLASS =
  "w-full bg-[#0E1318] border border-[#1C2530] text-[#E8EDF2] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-[#4A5A6B] transition-colors";
const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-widest text-[#8B9DB0] mb-1.5";

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
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#1C2530] flex-wrap">
        <Link
          href={`/vault/${firearmId}`}
          className="flex items-center gap-1.5 text-[#8B9DB0] hover:text-[#E8EDF2] text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {firearm.name}
        </Link>
        <span className="text-[#1C2530]">/</span>
        <h1 className="text-sm font-semibold text-[#E8EDF2] tracking-wide uppercase">
          New Build
        </h1>
      </div>

      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded border border-[#1C2530] text-[#8B9DB0] font-mono uppercase">
              {firearm.type}
            </span>
            <span className="text-xs text-[#4A5A6B]">{firearm.caliber}</span>
          </div>
          <h2 className="text-xl font-bold text-[#E8EDF2] mb-1">
            New Build for {firearm.name}
          </h2>
          <p className="text-sm text-[#8B9DB0]">
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
          <fieldset className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-5 space-y-4">
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
              <p className="text-xs text-[#4A5A6B] mt-1">
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

          {/* Active toggle */}
          <fieldset className="bg-[#0E1318] border border-[#1C2530] rounded-lg p-5">
            <legend className="text-xs font-mono uppercase tracking-widest text-[#00C2FF] px-1 -ml-1">
              Status
            </legend>
            <button
              type="button"
              onClick={() => setIsActive((v) => !v)}
              className={`mt-3 flex items-center gap-3 w-full text-left px-4 py-3 rounded-md border transition-all ${
                isActive
                  ? "border-[#00C853]/40 bg-[#00C853]/5"
                  : "border-[#1C2530] hover:border-[#8B9DB0]/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                  isActive
                    ? "border-[#00C853] bg-[#00C853]"
                    : "border-[#4A5A6B]"
                }`}
              >
                {isActive && (
                  <CheckCircle2 className="w-3 h-3 text-[#080B0F]" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[#E8EDF2]">
                  Set as Active Build
                </p>
                <p className="text-xs text-[#8B9DB0] mt-0.5">
                  Active build will be shown on the firearm&apos;s detail page. Only one
                  build per firearm can be active.
                </p>
              </div>
            </button>
          </fieldset>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={`/vault/${firearmId}`}
              className="px-4 py-2 text-sm text-[#8B9DB0] hover:text-[#E8EDF2] border border-[#1C2530] rounded-md hover:border-[#8B9DB0]/30 transition-colors"
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
