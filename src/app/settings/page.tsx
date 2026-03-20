"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Lock,
  Eye,
  EyeOff,
  Image,
  Settings,
  ShieldCheck,
} from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

interface AppSettings {
  id: string;
  enableImageSearch: boolean;
  googleCseApiKey: string | null;
  _googleCseApiKeyIsSet?: boolean;
  googleCseSearchEngineId: string | null;
  appPassword: string | null;
  defaultCurrency: string;
  encryptionEnabled?: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [enableImageSearch, setEnableImageSearch] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [searchEngineId, setSearchEngineId] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setDataError(data.error);
        } else {
          setSettings(data);
          setEnableImageSearch(data.enableImageSearch ?? false);
          // Don't pre-fill the masked key — show placeholder instead
          setSearchEngineId(data.googleCseSearchEngineId ?? "");
        }
        setDataLoading(false);
      })
      .catch(() => {
        setDataError("Failed to load settings");
        setDataLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);

    const payload: Record<string, unknown> = {
      enableImageSearch,
      googleCseSearchEngineId: searchEngineId || null,
    };

    // Only send apiKey if the user typed something (otherwise keep existing)
    if (apiKey) {
      payload.googleCseApiKey = apiKey;
    }

    // App password: if blank send null (disable), if typed send the value
    payload.appPassword = appPassword || null;

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setSaveError(json.error ?? "Failed to save settings");
      } else {
        setSettings(json);
        setApiKey(""); // clear after save
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4">
        <AlertCircle className="w-10 h-10 text-[#E53935]" />
        <p className="text-[#E53935]">{dataError}</p>
      </div>
    );
  }

  const imageSearchConfigured =
    settings?._googleCseApiKeyIsSet && !!settings?.googleCseSearchEngineId;

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-vault-border">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-[#00C2FF]" />
          <div>
            <h1 className="text-lg font-bold tracking-widest text-vault-text uppercase">
              Settings
            </h1>
            <p className="text-xs text-vault-text-muted mt-0.5">Configure your vault preferences</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {saveError && (
          <div className="flex items-center gap-3 bg-[#E53935]/10 border border-[#E53935]/30 rounded-lg px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 text-[#E53935] shrink-0" />
            <p className="text-sm text-[#E53935]">{saveError}</p>
          </div>
        )}

        {saveSuccess && (
          <div className="flex items-center gap-3 bg-[#00C853]/10 border border-[#00C853]/30 rounded-lg px-4 py-3 mb-6 animate-slide-up">
            <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
            <p className="text-sm text-[#00C853]">Settings saved successfully.</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* ── Image Search ────────────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-5">
            <div className="flex items-center justify-between">
              <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
                <Image className="w-3.5 h-3.5" />
                Image Search
              </legend>
              {/* Status badge */}
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  imageSearchConfigured
                    ? "text-[#00C853] border-[#00C853]/40"
                    : "text-vault-text-faint border-vault-border"
                }`}
              >
                {imageSearchConfigured ? "Configured" : "Not Configured"}
              </span>
            </div>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Enable Google Custom Search to automatically find images for firearms and
              accessories. Requires a Google Cloud CSE API key and a configured search engine.
            </p>

            {/* Enable toggle */}
            <div>
              <button
                type="button"
                onClick={() => setEnableImageSearch((v) => !v)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md border transition-all ${
                  enableImageSearch
                    ? "border-[#00C2FF]/40 bg-[#00C2FF]/5"
                    : "border-vault-border hover:border-vault-text-muted/20"
                }`}
              >
                <div
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                    enableImageSearch ? "bg-[#00C2FF]" : "bg-vault-border"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                      enableImageSearch ? "left-4" : "left-0.5"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-vault-text">Enable Image Search</p>
                  <p className="text-xs text-vault-text-faint mt-0.5">
                    Adds a &quot;Search Images&quot; button to firearm and accessory forms.
                  </p>
                </div>
              </button>
            </div>

            {/* API Key */}
            <div>
              <label className={LABEL_CLASS}>
                <Search className="w-3 h-3 inline mr-1" />
                Google CSE API Key
                {settings?._googleCseApiKeyIsSet && (
                  <span className="ml-2 text-[#00C853] text-[10px] normal-case tracking-normal">
                    (currently set)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={
                    settings?._googleCseApiKeyIsSet
                      ? "Leave blank to keep existing key"
                      : "AIza..."
                  }
                  className={`${INPUT_CLASS} pr-10 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-faint hover:text-vault-text-muted"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-vault-text-faint mt-1">
                From the Google Cloud Console. Leave blank to keep the existing key.
              </p>
            </div>

            {/* Search Engine ID */}
            <div>
              <label htmlFor="searchEngineId" className={LABEL_CLASS}>
                <Search className="w-3 h-3 inline mr-1" />
                Search Engine ID (cx)
              </label>
              <input
                id="searchEngineId"
                type="text"
                value={searchEngineId}
                onChange={(e) => setSearchEngineId(e.target.value)}
                placeholder="e.g. 017576662512468239146:omuauf_lfve"
                className={`${INPUT_CLASS} font-mono`}
              />
              <p className="text-xs text-vault-text-faint mt-1">
                The &quot;cx&quot; parameter from your Programmable Search Engine dashboard.
              </p>
            </div>
          </fieldset>

          {/* ── Security ────────────────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-5">
            <div className="flex items-center justify-between">
              <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
                <Lock className="w-3.5 h-3.5" />
                Security
              </legend>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  settings?.appPassword
                    ? "text-[#F5A623] border-[#F5A623]/40"
                    : "text-vault-text-faint border-vault-border"
                }`}
              >
                {settings?.appPassword ? "Password Set" : "No Password"}
              </span>
            </div>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Set an optional app password to restrict access to the vault. Leave blank to
              disable password protection.
            </p>

            <div>
              <label className={LABEL_CLASS}>
                <Lock className="w-3 h-3 inline mr-1" />
                App Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="Leave blank to disable password protection"
                  className={`${INPUT_CLASS} pr-10`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-faint hover:text-vault-text-muted"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-vault-text-faint mt-1">
                Note: Password setting is saved but enforcement requires the auth system (not active in this build).
              </p>
            </div>
          </fieldset>

          {/* ── Encryption at Rest ──────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Encryption at Rest
              </legend>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  settings?.encryptionEnabled
                    ? "text-[#00C853] border-[#00C853]/40"
                    : "text-vault-text-faint border-vault-border"
                }`}
              >
                {settings?.encryptionEnabled ? "Active" : "Not Configured"}
              </span>
            </div>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              When a <code className="text-vault-text-faint font-mono">VAULT_ENCRYPTION_KEY</code> is
              set, sensitive fields are encrypted in the database using AES-256-GCM. The key is
              set via the installer or manually in your <code className="text-vault-text-faint font-mono">.blackvault.env</code> file.
            </p>

            {settings?.encryptionEnabled ? (
              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint font-mono mb-2">
                  Encrypted Fields
                </p>
                {["Serial Number", "Notes"].map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00C853]" />
                    <span className="text-xs text-vault-text-muted">{field}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-md px-4 py-3">
                <p className="text-xs text-[#F5A623] font-mono">
                  To enable encryption, generate a key and add it to your environment:
                </p>
                <p className="text-[11px] font-mono text-vault-text-faint mt-1 break-all">
                  openssl rand -hex 32
                </p>
                <p className="text-[11px] text-vault-text-faint mt-1">
                  Then set <code className="font-mono">VAULT_ENCRYPTION_KEY=&lt;key&gt;</code> in{" "}
                  <code className="font-mono">.blackvault.env</code> and restart.
                </p>
              </div>
            )}
          </fieldset>

          {/* ── Status Summary ──────────────────────────────── */}
          <div className="bg-vault-bg border border-vault-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-3 font-mono">
              Current Configuration Status
            </p>
            <div className="space-y-2">
              <StatusRow
                label="Image Search"
                value={enableImageSearch ? "Enabled" : "Disabled"}
                ok={enableImageSearch}
              />
              <StatusRow
                label="CSE API Key"
                value={settings?._googleCseApiKeyIsSet ? "Configured" : "Not set"}
                ok={!!settings?._googleCseApiKeyIsSet}
              />
              <StatusRow
                label="Search Engine ID"
                value={settings?.googleCseSearchEngineId ? "Configured" : "Not set"}
                ok={!!settings?.googleCseSearchEngineId}
              />
              <StatusRow
                label="App Password"
                value={settings?.appPassword ? "Enabled" : "Disabled"}
                ok={!!settings?.appPassword}
                neutralIfFalse
              />
              <StatusRow
                label="Encryption at Rest"
                value={settings?.encryptionEnabled ? "Active" : "Not configured"}
                ok={!!settings?.encryptionEnabled}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  ok,
  neutralIfFalse,
}: {
  label: string;
  value: string;
  ok: boolean;
  neutralIfFalse?: boolean;
}) {
  const color = ok
    ? "text-[#00C853]"
    : neutralIfFalse
    ? "text-vault-text-faint"
    : "text-vault-text-faint";

  const dotColor = ok
    ? "bg-[#00C853]"
    : "bg-vault-border";

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-vault-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className={`text-xs font-mono ${color}`}>{value}</span>
      </div>
    </div>
  );
}
