"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock, Shield } from "lucide-react";

type AuthMode = "login" | "setup";
type PasswordStrength = "weak" | "medium" | "strong";

const MIN_PASSWORD_LENGTH = 8;

function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) return null;

  const checks = [
    password.length >= MIN_PASSWORD_LENGTH,
    password.length >= 12,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (score <= 2) return "weak";
  if (score <= 4) return "medium";
  return "strong";
}

function getStrengthStyles(strength: PasswordStrength | null) {
  if (strength === "weak") {
    return {
      label: "Weak",
      textClass: "text-[#E53935]",
      barClass: "bg-[#E53935]",
      widthClass: "w-1/3",
    };
  }
  if (strength === "medium") {
    return {
      label: "Medium",
      textClass: "text-[#F5A623]",
      barClass: "bg-[#F5A623]",
      widthClass: "w-2/3",
    };
  }
  return {
    label: "Strong",
    textClass: "text-[#00C853]",
    barClass: "bg-[#00C853]",
    widthClass: "w-full",
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const resolveAuthState = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setRequestError(null);

    try {
      const res = await fetch("/api/auth/check", { cache: "no-store", signal });
      if (!res.ok) {
        throw new Error("bootstrap_check_failed");
      }

      const data = await res.json() as {
        authenticated?: unknown;
        requiresSetup?: unknown;
      };
      if (typeof data.authenticated !== "boolean" || typeof data.requiresSetup !== "boolean") {
        throw new Error("bootstrap_check_invalid_payload");
      }

      // Setup state has higher priority than auth redirect.
      if (data.authenticated && !data.requiresSetup) {
        router.replace("/");
        return;
      }

      setMode(data.requiresSetup ? "setup" : "login");
      if (!data.requiresSetup) {
        setConfirmPassword("");
        setShowConfirmPassword(false);
      }
    } catch {
      if (signal?.aborted) return;
      setMode(null);
      setRequestError("Unable to verify authentication status. Please try again.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [router]);

  useEffect(() => {
    const controller = new AbortController();
    void resolveAuthState(controller.signal);
    return () => controller.abort();
  }, [resolveAuthState]);

  const isSetupMode = mode === "setup";
  const passwordStrength = useMemo(
    () => (isSetupMode ? getPasswordStrength(password) : null),
    [isSetupMode, password]
  );
  const strengthStyles = getStrengthStyles(passwordStrength);
  const passwordTooShort = isSetupMode && password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const passwordMismatch = isSetupMode && confirmPassword.length > 0 && password !== confirmPassword;
  const showPasswordLengthError = passwordTouched && passwordTooShort;
  const showPasswordMismatchError = confirmTouched && passwordMismatch;

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
          const statusJson = await statusRes.json();
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

  if (!mode) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-vault-canvas px-6 py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,194,255,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 tactical-grid opacity-60" />
        <div className="relative mx-auto w-full max-w-md rounded-2xl border border-vault-border bg-vault-surface/95 p-6 shadow-2xl backdrop-blur">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#E53935]" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-vault-text">
              Authentication Check Failed
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
              <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-widest text-vault-text-faint">
                {isSetupMode ? "Master Password" : "Vault Password"}
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

          <p className="mt-4 text-center text-[11px] text-vault-text-faint">
            {isSetupMode
              ? "Your data is stored locally and never leaves your system."
              : "Password can be changed in Settings."}
          </p>
        </div>
      </div>
    </div>
  );
}
