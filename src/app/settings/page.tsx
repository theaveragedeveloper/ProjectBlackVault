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
  HardDrive,
  Network,
  Copy,
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

interface SystemInfo {
  localIPs: string[];
  port: string;
  hostname: string;
  dbPath: string;
  platform: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [enableImageSearch, setEnableImageSearch] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [searchEngineId, setSearchEngineId] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/system-info").then((r) => r.json()),
    ])
      .then(([data, info]) => {
        if (data.error) {
          setDataError(data.error);
        } else {
          setSettings(data);
          setEnableImageSearch(data.enableImageSearch ?? false);
          setSearchEngineId(data.googleCseSearchEngineId ?? "");
        }
        if (!info.error) setSysInfo(info);
        setDataLoading(false);
      })
      .catch(() => {
        setDataError("Failed to load settings");
        setDataLoading(false);
      });
  }, []);

  function handleCopyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  }

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
                Note: This is a simple access restriction, not end-to-end encryption.
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
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-[#00C853]/5 border border-[#00C853]/20 rounded-md px-4 py-3">
                  <ShieldCheck className="w-4 h-4 text-[#00C853] shrink-0" />
                  <p className="text-xs text-[#00C853]">
                    Encryption is active. Sensitive data is encrypted in the database using AES-256-GCM.
                  </p>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint font-mono">
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
              <div className="space-y-3">
                <div className="bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-md px-4 py-3 space-y-2">
                  <p className="text-xs text-[#F5A623] font-semibold">Encryption is not active</p>
                  <p className="text-xs text-vault-text-muted leading-relaxed">
                    To enable AES-256-GCM encryption for serial numbers and notes, follow these steps:
                  </p>
                  <ol className="space-y-2 text-xs text-vault-text-faint list-none">
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#F5A623]/20 text-[#F5A623] flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                      <span>Generate a key: <code className="font-mono bg-vault-surface px-1 rounded">openssl rand -hex 32</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#F5A623]/20 text-[#F5A623] flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                      <span>Add it to your <code className="font-mono bg-vault-surface px-1 rounded">.blackvault.env</code> file: <code className="font-mono bg-vault-surface px-1 rounded">VAULT_ENCRYPTION_KEY=&lt;your-key&gt;</code></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-[#F5A623]/20 text-[#F5A623] flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                      <span>Restart BlackVault for the change to take effect.</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </fieldset>

          {/* ── Data Storage ────────────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
              <HardDrive className="w-3.5 h-3.5" />
              Data Storage
            </legend>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              BlackVault stores all data in a local SQLite database file. No data is sent to
              external servers.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Database File</p>
                <div className="flex items-center gap-2 bg-vault-bg border border-vault-border rounded-md px-3 py-2">
                  <code className="text-xs font-mono text-vault-text-muted flex-1 break-all">
                    {sysInfo?.dbPath ?? "Loading..."}
                  </code>
                </div>
                <p className="text-xs text-vault-text-faint mt-1">
                  Back up this file to preserve all your firearms, accessories, and build data.
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Storage Type</p>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00C853]" />
                  <span className="text-xs text-vault-text-muted">Local SQLite — 100% offline, no cloud sync</span>
                </div>
              </div>
            </div>
          </fieldset>

          {/* ── Network Access ───────────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
              <Network className="w-3.5 h-3.5" />
              Network Access
            </legend>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Access BlackVault from any device on your local network using the addresses below.
              Make sure BlackVault is bound to <code className="text-vault-text-faint font-mono">0.0.0.0</code> (not just localhost).
            </p>

            <div className="space-y-2">
              {/* Localhost URL */}
              <div className="bg-vault-bg border border-vault-border rounded-md px-3 py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] text-vault-text-faint font-mono uppercase mb-0.5">This Device</p>
                  <code className="text-xs font-mono text-vault-text">
                    http://localhost:{sysInfo?.port ?? "3000"}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(`http://localhost:${sysInfo?.port ?? "3000"}`)}
                  className="shrink-0 p-1.5 text-vault-text-faint hover:text-[#00C2FF] transition-colors rounded"
                  title="Copy URL"
                >
                  {copiedUrl === `http://localhost:${sysInfo?.port ?? "3000"}`
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853]" />
                    : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* LAN URLs */}
              {sysInfo?.localIPs && sysInfo.localIPs.length > 0 ? (
                sysInfo.localIPs.map((ip) => (
                  <div key={ip} className="bg-vault-bg border border-vault-border rounded-md px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-vault-text-faint font-mono uppercase mb-0.5">Local Network</p>
                      <code className="text-xs font-mono text-vault-text">
                        http://{ip}:{sysInfo.port}
                      </code>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(`http://${ip}:${sysInfo.port}`)}
                      className="shrink-0 p-1.5 text-vault-text-faint hover:text-[#00C2FF] transition-colors rounded"
                      title="Copy URL"
                    >
                      {copiedUrl === `http://${ip}:${sysInfo.port}`
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853]" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-vault-text-faint italic">
                  No local network interfaces detected.
                </div>
              )}
            </div>

            <div className="bg-[#00C2FF]/5 border border-[#00C2FF]/20 rounded-md px-4 py-3">
              <p className="text-[11px] text-[#00C2FF] font-mono mb-1">Docker Users</p>
              <p className="text-xs text-vault-text-faint leading-relaxed">
                Ensure the container port is mapped with <code className="font-mono">-p 3000:3000</code> or equivalent in docker-compose.yml.
              </p>
            </div>
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
