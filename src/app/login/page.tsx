"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, KeyRound, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5 font-mono";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recovery state
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySecret, setRecoverySecret] = useState("");
  const [recoverPassword, setRecoverPassword] = useState("");
  const [recoverConfirmPassword, setRecoverConfirmPassword] = useState("");
  const [recoverBusy, setRecoverBusy] = useState(false);
  const [recoverError, setRecoverError] = useState<string | null>(null);
  const [recoverSuccess, setRecoverSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Check if password is required
    fetch("/api/auth/check")
      .then(async (r) => ({ ok: r.ok, data: await r.json() }))
      .then(async (data) => {
        if (!data.ok || data.data?.error) {
          setError(data.data?.error ?? "Authentication service is unavailable.");
          setLoading(false);
          return;
        }

        if (!data.data.passwordRequired) {
          // No password set — auto-login and redirect
          const autoLoginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: "" }),
          });

          if (!autoLoginRes.ok) {
            const json = await autoLoginRes.json().catch(() => null);
            setError(json?.error ?? "Auto-login failed. Set SESSION_SECRET in your .env and restart dev mode.");
            setLoading(false);
            return;
          }


          router.replace("/");
        } else if (data.data.authenticated) {
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

  async function handleRecoverReset(e: React.FormEvent) {
    e.preventDefault();
    setRecoverError(null);
    setRecoverSuccess(null);

    if (!recoverySecret.trim()) {
      setRecoverError("Recovery secret is required.");
      return;
    }

    if (!recoverPassword || recoverPassword.length < 8) {
      setRecoverError("New password must be at least 8 characters.");
      return;
    }

    if (recoverPassword !== recoverConfirmPassword) {
      setRecoverError("New password and confirmation do not match.");
      return;
    }

    setRecoverBusy(true);
    try {
      const res = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recoverySecret,
          newPassword: recoverPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setRecoverError(json.error ?? "Recovery failed.");
        return;
      }

      setRecoverSuccess("Password reset successful. You can now log in with your new password.");
      setShowRecovery(false);
      setRecoverySecret("");
      setRecoverPassword("");
      setRecoverConfirmPassword("");
    } catch {
      setRecoverError("Network error. Please try again.");
    } finally {
      setRecoverBusy(false);
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
            <img src="/blackvault-logo.svg" alt="BlackVault logo" width={32} height={32} className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.2em] text-vault-text uppercase font-mono">
            BlackVault
          </h1>
          <p className="text-xs text-vault-text-muted mt-1 tracking-widest uppercase">
            Secure Access Required
          </p>
        </div>

        {recoverSuccess && (
          <div className="flex items-center gap-2 bg-[#00C853]/10 border border-[#00C853]/30 rounded-md px-3 py-2 mb-4">
            <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
            <p className="text-xs text-[#00C853]">{recoverSuccess}</p>
          </div>
        )}

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
              <label className={LABEL_CLASS}>
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

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setShowRecovery((prev) => {
                  if (prev) {
                    setRecoverError(null);
                    setRecoverySecret("");
                    setRecoverPassword("");
                    setRecoverConfirmPassword("");
                  }
                  return !prev;
                });
              }}
              className="inline-flex items-center gap-1 text-[10px] text-vault-text-faint hover:text-vault-text-muted transition-colors"
            >
              <KeyRound className="w-3 h-3" />
              Forgot password?
              {showRecovery ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {showRecovery && (
            <div className="mt-3 border-t border-vault-border pt-3 space-y-3">
              <p className="text-[10px] text-vault-text-faint leading-relaxed">
                Enter your recovery secret (PASSWORD_RECOVERY_SECRET from your .env) to reset your vault password.
              </p>

              {recoverError && (
                <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 text-[#E53935] shrink-0" />
                  <p className="text-xs text-[#E53935]">{recoverError}</p>
                </div>
              )}

              <form onSubmit={handleRecoverReset} className="space-y-3">
                <div>
                  <label className={LABEL_CLASS}>Recovery Secret</label>
                  <input
                    type="password"
                    value={recoverySecret}
                    onChange={(e) => setRecoverySecret(e.target.value)}
                    className={INPUT_CLASS}
                    autoComplete="off"
                    placeholder="Enter recovery secret"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>New Password</label>
                  <input
                    type="password"
                    value={recoverPassword}
                    onChange={(e) => setRecoverPassword(e.target.value)}
                    className={INPUT_CLASS}
                    autoComplete="new-password"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS}>Confirm New Password</label>
                  <input
                    type="password"
                    value={recoverConfirmPassword}
                    onChange={(e) => setRecoverConfirmPassword(e.target.value)}
                    className={INPUT_CLASS}
                    autoComplete="new-password"
                    placeholder="Re-enter new password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={recoverBusy || !recoverySecret || !recoverPassword}
                  className="w-full flex items-center justify-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 text-[#E53935] hover:bg-[#E53935]/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-xs font-medium transition-colors"
                >
                  {recoverBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  {recoverBusy ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </div>
          )}

          {!showRecovery && (
            <p className="text-[10px] text-vault-text-faint text-center mt-2">
              Password can be changed in Settings
            </p>
          )}
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
