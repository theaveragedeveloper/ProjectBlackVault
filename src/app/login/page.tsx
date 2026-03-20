"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, AlertCircle, KeyRound, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5 font-mono";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    setRequestError(null);

    if (isSetupMode) {
      setPasswordTouched(true);
      setConfirmTouched(true);
      if (password.length < MIN_PASSWORD_LENGTH || password !== confirmPassword) {
        return;
      }
    }

    setSubmitting(true);
    setSetupSuccess(false);

    try {
      const res = await fetch(isSetupMode ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      let json: { error?: string } | null = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }

      if (!res.ok) {
        if (isSetupMode && res.status === 409) {
          const statusRes = await fetch("/api/auth/check", { cache: "no-store" });
          if (statusRes.ok) {
            const statusJson = await statusRes.json() as {
              authenticated?: unknown;
              requiresSetup?: unknown;
            };
            if (
              typeof statusJson.authenticated === "boolean"
              && typeof statusJson.requiresSetup === "boolean"
            ) {
              if (statusJson.authenticated) {
                router.replace("/");
                return;
              }
              if (!statusJson.requiresSetup) {
                setMode("login");
                setPassword("");
                setConfirmPassword("");
                setPasswordTouched(false);
                setConfirmTouched(false);
                setRequestError(null);
                setSubmitting(false);
                return;
              }
            }
          }
        }

        setRequestError(
          isSetupMode
            ? "Setup failed. Please try again."
            : (json?.error ?? "Invalid password")
        );
        setSubmitting(false);
        return;
      }

      if (isSetupMode) {
        setSetupSuccess(true);
        setSubmitting(false);
        await new Promise((resolve) => setTimeout(resolve, 900));
      }

      router.replace("/");
    } catch {
      setRequestError(
        isSetupMode ? "Setup failed. Please try again." : "Connection error. Please try again."
      );
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
      <div className="flex min-h-screen items-center justify-center bg-vault-bg">
        <div className="flex items-center gap-3 rounded-lg border border-vault-border bg-vault-surface px-4 py-3 text-sm text-vault-text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-[#00C2FF]" />
          Checking vault status...
        </div>
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
          <p className="text-sm text-vault-text-muted">
            Unable to verify vault state. Retry to continue.
          </p>
          <button
            type="button"
            onClick={() => void resolveAuthState()}
            className="mt-4 w-full rounded-md border border-[#00C2FF]/35 bg-[#00C2FF]/10 px-4 py-2.5 text-sm font-medium text-[#00C2FF] transition-colors hover:bg-[#00C2FF]/20"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const submitDisabled = submitting
    || setupSuccess
    || !password
    || (isSetupMode && (!confirmPassword || passwordTooShort || passwordMismatch));

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-vault-canvas px-6 py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,194,255,0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 tactical-grid opacity-60" />

      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#00C2FF]/35 bg-[#00C2FF]/10">
            <Shield className="h-7 w-7 text-[#00C2FF]" />
          </div>
          <h1 className="font-mono text-2xl font-bold uppercase tracking-[0.18em] text-vault-text">
            BlackVault
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-vault-text-muted">
            BlackVault is a self-hosted command center for securing your inventory, records, and builds.
          </p>

          {isSetupMode ? (
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-vault-text-faint">
              First-time setup
            </p>
          ) : (
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-vault-text-faint">
              Secure access
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-vault-border bg-vault-surface/95 p-6 shadow-2xl backdrop-blur">
          {isSetupMode && (
            <p className="mb-3 text-[11px] uppercase tracking-[0.18em] text-vault-text-faint">
              Step 1 of 1 — Initialize Vault
            </p>
          )}

          <h2 className="text-xl font-semibold text-vault-text">
            {isSetupMode ? "Initialize Your Vault" : "Unlock Vault"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-vault-text-muted">
            {isSetupMode
              ? "Set a master password to secure your data. This is the only key to access your vault."
              : "Enter your vault password to continue."}
          </p>
          {isSetupMode && (
            <p className="mt-2 text-xs leading-5 text-vault-text-faint">
              Initializing the vault means creating your local master key and locking this system behind it.
            </p>
          )}

          {requestError && (
            <div className="mb-4 mt-5 flex items-center gap-2 rounded-md border border-[#E53935]/30 bg-[#E53935]/10 px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#E53935]" />
              <p className="text-xs text-[#E53935]">{requestError}</p>
            </div>
          )}

          {isSetupMode && setupSuccess && (
            <div className="mb-4 mt-5 flex items-center gap-2 rounded-md border border-[#00C853]/30 bg-[#00C853]/12 px-3 py-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00C853]" />
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#00C853]">Vault Ready</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label className={LABEL_CLASS}>
                Vault Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (requestError) setRequestError(null);
                    if (setupSuccess) setSetupSuccess(false);
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder={isSetupMode ? "Create master password..." : "Enter vault password..."}
                  autoFocus
                  disabled={submitting || setupSuccess}
                  className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2.5 pr-10 text-sm text-vault-text transition-colors placeholder:text-vault-text-faint focus:border-[#00C2FF] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  autoComplete={isSetupMode ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting || setupSuccess}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-faint transition-colors hover:text-vault-text-muted disabled:cursor-not-allowed"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {isSetupMode && (
                <>
                  {passwordStrength && (
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-vault-text-faint">
                          Password Strength
                        </p>
                        <p className={`text-xs font-medium ${strengthStyles.textClass}`}>
                          {strengthStyles.label}
                        </p>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-vault-muted">
                        <div className={`h-full ${strengthStyles.barClass} ${strengthStyles.widthClass}`} />
                      </div>
                    </div>
                  )}
                  <p className="mt-2 text-[11px] text-vault-text-faint">
                    Use at least {MIN_PASSWORD_LENGTH} characters. Mix uppercase, lowercase, numbers, and
                    symbols for a stronger key.
                  </p>
                  {showPasswordLengthError && (
                    <p className="mt-1 text-xs text-[#E53935]">
                      Use at least {MIN_PASSWORD_LENGTH} characters.
                    </p>
                  )}
                </>
              )}
            </div>

            {isSetupMode && (
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-vault-text-faint">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (requestError) setRequestError(null);
                    }}
                    onBlur={() => setConfirmTouched(true)}
                    placeholder="Confirm vault password..."
                    disabled={submitting || setupSuccess}
                    className="w-full rounded-md border border-vault-border bg-vault-bg px-3 py-2.5 pr-10 text-sm text-vault-text transition-colors placeholder:text-vault-text-faint focus:border-[#00C2FF] focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    disabled={submitting || setupSuccess}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-faint transition-colors hover:text-vault-text-muted disabled:cursor-not-allowed"
                    aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {showPasswordMismatchError && (
                  <p className="mt-1 text-xs text-[#E53935]">Passwords do not match.</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitDisabled}
              className={`flex w-full items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                setupSuccess
                  ? "border-[#00C853]/35 bg-[#00C853]/15 text-[#00C853]"
                  : "border-[#00C2FF]/35 bg-[#00C2FF]/10 text-[#00C2FF] hover:bg-[#00C2FF]/20"
              }`}
            >
              {setupSuccess ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              {setupSuccess
                ? "Vault Ready"
                : submitting
                  ? (isSetupMode ? "Initializing Vault..." : "Authenticating...")
                  : (isSetupMode ? "Create Vault" : "Unlock Vault")}
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
      </div>
    </div>
  );
}
