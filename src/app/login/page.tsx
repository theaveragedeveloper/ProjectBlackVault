"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if password is required
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.passwordRequired) {
          // No password set — auto-login and redirect
          await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: "" }),
          });
          router.replace("/");
        } else if (data.authenticated) {
          router.replace("/");
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        setLoading(false);
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Invalid password");
        setSubmitting(false);
        return;
      }

      router.replace("/");
    } catch {
      setError("Connection error. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-vault-bg">
        <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-vault-bg tactical-grid">
      <div className="w-full max-w-sm mx-auto px-6">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/30 mb-4 p-2">
            <Image src="/blackvault-logo.png" alt="BlackVault logo" width={32} height={32} className="w-8 h-8" priority />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.2em] text-vault-text uppercase font-mono">
            BlackVault
          </h1>
          <p className="text-xs text-vault-text-muted mt-1 tracking-widest uppercase">
            Secure Access Required
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-vault-surface border border-vault-border rounded-xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-4 h-4 text-[#00C2FF]" />
            <h2 className="text-sm font-semibold text-vault-text tracking-widest uppercase">
              Authentication
            </h2>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
              <p className="text-xs text-[#E53935]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5 font-mono">
                Vault Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter vault password..."
                  autoFocus
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-faint hover:text-vault-text-muted transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full flex items-center justify-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {submitting ? "Authenticating..." : "Unlock Vault"}
            </button>
          </form>

          <p className="text-[10px] text-vault-text-faint text-center mt-4">
            Password can be changed in Settings
          </p>
        </div>

        {/* Corner brackets decoration */}
        <div className="mt-6 flex justify-between px-2">
          <div className="w-6 h-6 border-t border-l border-[#00C2FF]/20" />
          <div className="w-6 h-6 border-t border-r border-[#00C2FF]/20" />
        </div>
      </div>
    </div>
  );
}
