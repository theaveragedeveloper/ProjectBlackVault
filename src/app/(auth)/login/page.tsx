"use client";

import { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Lock, Eye, EyeOff, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace(from);
        } else {
          setIsFirstTime(!data.passwordSet);
          setCheckingStatus(false);
        }
      })
      .catch(() => setCheckingStatus(false));
  }, [from, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.replace(from);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Invalid password. Try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checkingStatus) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--vault-bg)" }}
      >
        <Loader2
          className="animate-spin"
          size={32}
          style={{ color: "#00C2FF" }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--vault-bg)" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: "rgba(0,194,255,0.1)", border: "1px solid rgba(0,194,255,0.3)" }}
          >
            <Shield size={32} style={{ color: "#00C2FF" }} />
          </div>
          <h1
            className="text-2xl font-bold tracking-wider uppercase"
            style={{ color: "var(--vault-text)" }}
          >
            BlackVault
          </h1>
          <p
            className="text-sm mt-1 tracking-widest uppercase"
            style={{ color: "var(--vault-text-muted)" }}
          >
            Armory Platform
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-lg p-6"
          style={{
            background: "var(--vault-surface)",
            border: "1px solid var(--vault-border)",
          }}
        >
          <h2
            className="text-sm font-semibold tracking-wider uppercase mb-5"
            style={{ color: "var(--vault-text-muted)" }}
          >
            {isFirstTime ? "Set Vault Password" : "Enter Vault Password"}
          </h2>

          {isFirstTime && (
            <p
              className="text-xs mb-4 leading-relaxed"
              style={{ color: "var(--vault-text-muted)" }}
            >
              No password has been set. Create a password to secure your vault.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--vault-text-faint)" }}
              >
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isFirstTime ? "Create a password" : "Password"}
                autoFocus
                className="w-full pl-9 pr-10 py-2.5 rounded text-sm outline-none"
                style={{
                  background: "var(--vault-surface-2)",
                  border: "1px solid var(--vault-border)",
                  color: "var(--vault-text)",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--vault-text-faint)" }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p className="text-xs" style={{ color: "#E53935" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full py-2.5 rounded text-sm font-semibold tracking-wider uppercase transition-opacity disabled:opacity-50"
              style={{
                background: "#00C2FF",
                color: "#000",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  {isFirstTime ? "Securing..." : "Unlocking..."}
                </span>
              ) : isFirstTime ? (
                "Secure & Enter"
              ) : (
                "Unlock Vault"
              )}
            </button>
          </form>
        </div>

        <p
          className="text-center text-xs mt-4"
          style={{ color: "var(--vault-text-faint)" }}
        >
          Self-hosted · Encrypted at rest · Private by default
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "var(--vault-bg)" }}
        >
          <Loader2 className="animate-spin" size={32} style={{ color: "#00C2FF" }} />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
