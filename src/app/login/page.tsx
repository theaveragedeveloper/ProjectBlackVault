"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, Shield } from "lucide-react";

type AuthMode = "login" | "setup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/check")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace("/");
          return;
        }

        setMode(data.requiresSetup ? "setup" : "login");
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to verify authentication status.");
        setLoading(false);
      });
  }, [router]);

  const isSetupMode = mode === "setup";

  const validationError = useMemo(() => {
    if (!isSetupMode) return null;
    if (password && confirmPassword && password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  }, [confirmPassword, isSetupMode, password]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isSetupMode && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(isSetupMode ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? (isSetupMode ? "Setup failed" : "Invalid password"));
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

  const displayError = error ?? validationError;
  const submitDisabled = submitting
    || !password
    || (isSetupMode && (!confirmPassword || password !== confirmPassword));

  return (
    <div className="flex items-center justify-center min-h-screen bg-vault-bg tactical-grid">
      <div className="w-full max-w-sm mx-auto px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00C2FF]/10 border border-[#00C2FF]/30 mb-4">
            <Shield className="w-8 h-8 text-[#00C2FF]" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.2em] text-vault-text uppercase font-mono">
            BlackVault
          </h1>
          <p className="text-xs text-vault-text-muted mt-1 tracking-widest uppercase">
            {isSetupMode ? "First-Time Setup" : "Secure Access Required"}
          </p>
        </div>

        <div className="bg-vault-surface border border-vault-border rounded-xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-[#00C2FF]" />
            <h2 className="text-sm font-semibold text-vault-text tracking-widest uppercase">
              {isSetupMode ? "Initialize Vault" : "Authentication"}
            </h2>
          </div>

          {isSetupMode && (
            <p className="text-xs text-vault-text-muted mb-4">
              Create a vault password to complete first-run setup.
            </p>
          )}

          {displayError && (
            <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2 mb-4">
              <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
              <p className="text-xs text-[#E53935]">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5 font-mono">
                {isSetupMode ? "Create Vault Password" : "Vault Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSetupMode ? "Create vault password..." : "Enter vault password..."}
                  autoFocus
                  className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors"
                  autoComplete={isSetupMode ? "new-password" : "current-password"}
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

            {isSetupMode && (
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5 font-mono">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm vault password..."
                    className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-faint hover:text-vault-text-muted transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full flex items-center justify-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {submitting
                ? (isSetupMode ? "Initializing..." : "Authenticating...")
                : (isSetupMode ? "Initialize Vault" : "Unlock Vault")}
            </button>
          </form>

          <p className="text-[10px] text-vault-text-faint text-center mt-4">
            {isSetupMode
              ? "This password is required to unlock BlackVault."
              : "Password can be changed in Settings."}
          </p>
        </div>

        <div className="mt-6 flex justify-between px-2">
          <div className="w-6 h-6 border-t border-l border-[#00C2FF]/20" />
          <div className="w-6 h-6 border-t border-r border-[#00C2FF]/20" />
        </div>
      </div>
    </div>
  );
}
