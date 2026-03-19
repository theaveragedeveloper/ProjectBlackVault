"use client";

import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Settings,
  ShieldCheck,
  HardDrive,
  Network,
  Copy,
  ShieldOff,
  Download,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

interface AppSettings {
  id: string;
  appPassword: string | null;
  defaultCurrency: string;
  encryptionEnabled?: boolean;
  encryptionViaEnv?: boolean;
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

  const [appPassword, setAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Encryption UI state
  const [encBusy, setEncBusy] = useState(false);
  const [encError, setEncError] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [keySaved, setKeySaved] = useState(false);
  const [showOwnKey, setShowOwnKey] = useState(false);
  const [ownKeyInput, setOwnKeyInput] = useState("");
  const [ownKeyError, setOwnKeyError] = useState<string | null>(null);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [disableInput, setDisableInput] = useState("");
  const [exportedKey, setExportedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [exportingData, setExportingData] = useState(false);
  const [exportDataError, setExportDataError] = useState<string | null>(null);
  const [exportDataSuccess, setExportDataSuccess] = useState<string | null>(null);
  const [exportFirearms, setExportFirearms] = useState(true);
  const [exportAccessories, setExportAccessories] = useState(true);
  const [exportBuilds, setExportBuilds] = useState(true);
  const [exportAmmo, setExportAmmo] = useState(true);
  const [exportRangeSessions, setExportRangeSessions] = useState(true);
  const [exportDocuments, setExportDocuments] = useState(true);
  const [exportSettings, setExportSettings] = useState(false);
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [exportIncludeSerialNumbers, setExportIncludeSerialNumbers] = useState(true);

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
      appPassword: appPassword || null,
    };

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
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Encryption helpers ───────────────────────────────────────────

  async function handleEnableEncryption() {
    setEncError(null);
    setEncBusy(true);
    try {
      const res = await fetch("/api/encryption", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setEncError(json.error ?? "Failed to generate encryption key.");
        return;
      }
      setGeneratedKey(json.key);
      setKeySaved(false);
      setSettings((s) => s ? { ...s, encryptionEnabled: true, encryptionViaEnv: false } : s);
    } catch {
      setEncError("Network error. Please try again.");
    } finally {
      setEncBusy(false);
    }
  }

  async function handleUseOwnKey() {
    setOwnKeyError(null);
    const key = ownKeyInput.trim();
    if (!/^[0-9a-fA-F]{64}$/.test(key)) {
      setOwnKeyError("Key must be exactly 64 hexadecimal characters.");
      return;
    }
    setEncBusy(true);
    try {
      const res = await fetch("/api/encryption", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOwnKeyError(json.error ?? "Failed to save key.");
        return;
      }
      setOwnKeyInput("");
      setShowOwnKey(false);
      setSettings((s) => s ? { ...s, encryptionEnabled: true, encryptionViaEnv: false } : s);
    } catch {
      setOwnKeyError("Network error. Please try again.");
    } finally {
      setEncBusy(false);
    }
  }

  async function handleExportKey() {
    setEncError(null);
    try {
      const res = await fetch("/api/encryption");
      const json = await res.json();
      if (!res.ok) {
        setEncError(json.error ?? "Could not retrieve key.");
        return;
      }
      setExportedKey(json.key);
    } catch {
      setEncError("Network error. Please try again.");
    }
  }

  async function handleDisableEncryption() {
    if (disableInput !== "DISABLE") return;
    setEncBusy(true);
    try {
      const res = await fetch("/api/encryption", { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setEncError(json.error ?? "Failed to disable encryption.");
        return;
      }
      setSettings((s) => s ? { ...s, encryptionEnabled: false } : s);
      setShowDisableConfirm(false);
      setDisableInput("");
      setExportedKey(null);
      setGeneratedKey(null);
    } catch {
      setEncError("Network error. Please try again.");
    } finally {
      setEncBusy(false);
    }
  }

  function copyKey(key: string) {
    navigator.clipboard.writeText(key).then(() => {
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    });
  }

  function downloadKey(key: string) {
    const blob = new Blob(
      [`BlackVault Encryption Key\n\nVAULT_ENCRYPTION_KEY=${key}\n\nKeep this file safe. Losing it means your encrypted data cannot be recovered.\n`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "blackvault-encryption-key.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDownloadDataExport() {
    setExportDataError(null);
    setExportDataSuccess(null);
    setExportingData(true);

    try {
      const params = new URLSearchParams({
        firearms: String(exportFirearms),
        accessories: String(exportAccessories),
        builds: String(exportBuilds),
        ammo: String(exportAmmo),
        rangeSessions: String(exportRangeSessions),
        documents: String(exportDocuments),
        settings: String(exportSettings),
        includeSerialNumbers: String(exportIncludeSerialNumbers),
        format: exportFormat,
      });

      const res = await fetch(`/api/exports/data?${params.toString()}`);
      if (!res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          const json = await res.json();
          setExportDataError(json.error ?? "Failed to export data.");
        } else {
          const text = await res.text();
          setExportDataError(text || "Failed to export data.");
        }
        return;
      }

      const blob =
        exportFormat === "csv"
          ? new Blob([await res.text()], { type: "text/csv;charset=utf-8" })
          : new Blob([JSON.stringify(await res.json(), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const a = document.createElement("a");
      a.href = url;
      a.download = `blackvault-export-${timestamp}.${exportFormat}`;
      a.click();
      URL.revokeObjectURL(url);
      setExportDataSuccess(`Export downloaded (${exportFormat.toUpperCase()}).`);
    } catch {
      setExportDataError("Network error. Please try again.");
    } finally {
      setExportingData(false);
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

  return (
    <div className="min-h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-vault-border">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-[#00C2FF]" />
          <div>
            <h1 className="text-lg font-bold tracking-widest text-vault-text uppercase">Settings</h1>
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

          {/* ── Security ────────────────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-5">
            <div className="flex items-center justify-between">
              <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
                <Lock className="w-3.5 h-3.5" />
                Security
              </legend>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${settings?.appPassword ? "text-[#F5A623] border-[#F5A623]/40" : "text-vault-text-faint border-vault-border"}`}>
                {settings?.appPassword ? "Password Set" : "No Password"}
              </span>
            </div>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Set an optional app password to restrict access to the vault. Leave blank to disable password protection.
            </p>

            <div>
              <label className={LABEL_CLASS}><Lock className="w-3 h-3 inline mr-1" />App Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={appPassword} onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="Leave blank to disable password protection" className={`${INPUT_CLASS} pr-10`} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-faint hover:text-vault-text-muted">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-vault-text-faint mt-1">Note: This is a simple access restriction, not end-to-end encryption.</p>
            </div>
          </fieldset>

          {/* ── Encryption at Rest ──────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Encryption at Rest
              </legend>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${settings?.encryptionEnabled ? "text-[#00C853] border-[#00C853]/40" : "text-vault-text-faint border-vault-border"}`}>
                {settings?.encryptionEnabled ? "Active" : "Not Active"}
              </span>
            </div>

            {encError && (
              <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-[#E53935] shrink-0" />
                <p className="text-xs text-[#E53935]">{encError}</p>
              </div>
            )}

            {/* ── NOT ACTIVE ── */}
            {!settings?.encryptionEnabled && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-vault-bg border border-vault-border rounded-md px-4 py-3">
                  <Shield className="w-5 h-5 text-vault-text-faint shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-vault-text">Protect Your Sensitive Data</p>
                    <p className="text-xs text-vault-text-muted mt-1 leading-relaxed">
                      When encryption is on, your serial numbers and notes are scrambled in the database. Even if someone gets your data file, they can&apos;t read those details without your key.
                    </p>
                  </div>
                </div>

                {/* Generated key panel */}
                {generatedKey ? (
                  <div className="space-y-3 bg-[#00C853]/5 border border-[#00C853]/20 rounded-md p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00C853] shrink-0" />
                      <p className="text-sm font-semibold text-[#00C853]">Encryption is now active!</p>
                    </div>

                    <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-md px-3 py-2">
                      <p className="text-xs text-[#F5A623] font-semibold mb-1">Save your key before leaving this page</p>
                      <p className="text-xs text-vault-text-muted">If you lose this key, your serial numbers and notes cannot be recovered. There is no way to reset it.</p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5 font-mono">Your Encryption Key</p>
                      <div className="flex items-center gap-2 bg-vault-bg border border-vault-border rounded-md px-3 py-2">
                        <code className="text-xs font-mono text-vault-text flex-1 break-all select-all">{generatedKey}</code>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button type="button" onClick={() => copyKey(generatedKey)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-vault-surface border border-vault-border text-vault-text-muted hover:text-vault-text rounded-md text-xs transition-colors">
                        {keyCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853]" /> : <Copy className="w-3.5 h-3.5" />}
                        {keyCopied ? "Copied!" : "Copy Key"}
                      </button>
                      <button type="button" onClick={() => downloadKey(generatedKey)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-vault-surface border border-vault-border text-vault-text-muted hover:text-vault-text rounded-md text-xs transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Download Key File
                      </button>
                    </div>

                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={keySaved} onChange={(e) => setKeySaved(e.target.checked)}
                        className="mt-0.5 accent-[#00C853]" />
                      <span className="text-xs text-vault-text-muted">
                        I&apos;ve saved my key in a safe place (a password manager, USB drive, or printed copy).
                      </span>
                    </label>

                    {keySaved && (
                      <button type="button" onClick={() => setGeneratedKey(null)}
                        className="w-full py-2 bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] rounded-md text-sm font-medium hover:bg-[#00C853]/20 transition-colors">
                        Done — close this panel
                      </button>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={handleEnableEncryption} disabled={encBusy}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-sm font-medium transition-colors">
                    {encBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                    {encBusy ? "Generating key..." : "Enable Encryption"}
                  </button>
                )}

                {/* Already have a key */}
                {!generatedKey && (
                  <div>
                    <button type="button" onClick={() => setShowOwnKey((v) => !v)}
                      className="flex items-center gap-1 text-xs text-vault-text-faint hover:text-vault-text-muted transition-colors">
                      <KeyRound className="w-3 h-3" />
                      Already have a key?
                      {showOwnKey ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    {showOwnKey && (
                      <div className="mt-2 space-y-2">
                        <input type="text" value={ownKeyInput} onChange={(e) => setOwnKeyInput(e.target.value)}
                          placeholder="Paste your 64-character hex key here"
                          className={`${INPUT_CLASS} font-mono text-xs`} />
                        {ownKeyError && <p className="text-xs text-[#E53935]">{ownKeyError}</p>}
                        <button type="button" onClick={handleUseOwnKey} disabled={encBusy || !ownKeyInput}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-vault-surface border border-vault-border text-vault-text-muted hover:text-vault-text disabled:opacity-50 rounded-md text-xs transition-colors">
                          {encBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
                          Use This Key
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── ACTIVE ── */}
            {settings?.encryptionEnabled && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-[#00C853]/5 border border-[#00C853]/20 rounded-md px-4 py-3">
                  <ShieldCheck className="w-4 h-4 text-[#00C853] shrink-0" />
                  <div>
                    <p className="text-xs text-[#00C853] font-semibold">Encryption is active</p>
                    <p className="text-xs text-vault-text-muted mt-0.5">Serial numbers and notes are encrypted in your database.</p>
                  </div>
                </div>

                {settings.encryptionViaEnv ? (
                  <div className="bg-vault-bg border border-vault-border rounded-md px-4 py-3">
                    <p className="text-xs text-vault-text-muted leading-relaxed">
                      Your encryption key is managed via the <code className="font-mono text-vault-text-faint">VAULT_ENCRYPTION_KEY</code> environment variable. To change or disable it, update your <code className="font-mono text-vault-text-faint">.blackvault.env</code> file and restart the app.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Export key panel */}
                    {exportedKey ? (
                      <div className="space-y-3 bg-vault-bg border border-vault-border rounded-md p-4">
                        <p className="text-xs font-semibold text-vault-text">Your Encryption Key</p>
                        <div className="flex items-center gap-2 bg-vault-surface border border-vault-border rounded-md px-3 py-2">
                          <code className="text-xs font-mono text-vault-text flex-1 break-all select-all">{exportedKey}</code>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button type="button" onClick={() => copyKey(exportedKey)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-vault-surface border border-vault-border text-vault-text-muted hover:text-vault-text rounded-md text-xs transition-colors">
                            {keyCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853]" /> : <Copy className="w-3.5 h-3.5" />}
                            {keyCopied ? "Copied!" : "Copy Key"}
                          </button>
                          <button type="button" onClick={() => downloadKey(exportedKey)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-vault-surface border border-vault-border text-vault-text-muted hover:text-vault-text rounded-md text-xs transition-colors">
                            <Download className="w-3.5 h-3.5" />
                            Download Key File
                          </button>
                          <button type="button" onClick={() => setExportedKey(null)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-vault-surface border border-vault-border text-vault-text-faint hover:text-vault-text rounded-md text-xs transition-colors">
                            Hide
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={handleExportKey}
                        className="flex items-center gap-1.5 text-xs text-vault-text-muted hover:text-[#00C2FF] transition-colors">
                        <Download className="w-3.5 h-3.5" />
                        Back Up Your Key
                      </button>
                    )}

                    {/* Disable encryption */}
                    {showDisableConfirm ? (
                      <div className="bg-[#E53935]/5 border border-[#E53935]/20 rounded-md p-4 space-y-3">
                        <p className="text-xs font-semibold text-[#E53935]">Disable Encryption</p>
                        <p className="text-xs text-vault-text-muted leading-relaxed">
                          This removes the encryption key from the app. Existing encrypted data will remain encrypted and unreadable until you re-enable encryption with the same key. New data will be saved as plaintext.
                        </p>
                        <p className="text-xs text-vault-text-muted">Type <strong className="text-vault-text">DISABLE</strong> to confirm:</p>
                        <input type="text" value={disableInput} onChange={(e) => setDisableInput(e.target.value)}
                          placeholder="DISABLE" className={`${INPUT_CLASS} font-mono`} />
                        <div className="flex gap-2">
                          <button type="button" onClick={handleDisableEncryption} disabled={disableInput !== "DISABLE" || encBusy}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E53935]/10 border border-[#E53935]/30 text-[#E53935] hover:bg-[#E53935]/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-xs transition-colors">
                            {encBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                            Disable Encryption
                          </button>
                          <button type="button" onClick={() => { setShowDisableConfirm(false); setDisableInput(""); }}
                            className="px-3 py-1.5 bg-vault-surface border border-vault-border text-vault-text-muted hover:text-vault-text rounded-md text-xs transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowDisableConfirm(true)}
                        className="flex items-center gap-1.5 text-xs text-vault-text-faint hover:text-[#E53935] transition-colors">
                        <ShieldOff className="w-3.5 h-3.5" />
                        Disable Encryption
                      </button>
                    )}
                  </div>
                )}
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
              BlackVault stores all data in a local SQLite database file. No data is sent to external servers.
            </p>

            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-1.5">Database File</p>
                <div className="flex items-center gap-2 bg-vault-bg border border-vault-border rounded-md px-3 py-2">
                  <code className="text-xs font-mono text-vault-text-muted flex-1 break-all">{sysInfo?.dbPath ?? "Loading..."}</code>
                </div>
                <p className="text-xs text-vault-text-faint mt-1">Back up this file to preserve all your firearms, accessories, and build data.</p>
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

          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
              <Download className="w-3.5 h-3.5" />
              Data Export
            </legend>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Choose a format and sections, then download an export for backup or analysis.
            </p>

            {exportDataError && (
              <div className="flex items-center gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-[#E53935] shrink-0" />
                <p className="text-xs text-[#E53935]">{exportDataError}</p>
              </div>
            )}

            {exportDataSuccess && (
              <div className="flex items-center gap-2 bg-[#00C853]/10 border border-[#00C853]/30 rounded-md px-3 py-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853] shrink-0" />
                <p className="text-xs text-[#00C853]">{exportDataSuccess}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs text-vault-text-muted">
                <span className="block mb-1">Format</span>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as "json" | "csv")}
                  className={`${INPUT_CLASS} text-xs py-2`}
                >
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-vault-text-muted mt-6 sm:mt-0 sm:self-end">
                <input
                  type="checkbox"
                  checked={exportIncludeSerialNumbers}
                  onChange={(e) => setExportIncludeSerialNumbers(e.target.checked)}
                  className="accent-[#00C2FF]"
                />
                Include serial numbers
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-xs text-vault-text-muted"><input type="checkbox" checked={exportFirearms} onChange={(e) => setExportFirearms(e.target.checked)} className="accent-[#00C2FF]" />Firearms</label>
              <label className="flex items-center gap-2 text-xs text-vault-text-muted"><input type="checkbox" checked={exportAccessories} onChange={(e) => setExportAccessories(e.target.checked)} className="accent-[#00C2FF]" />Accessories</label>
              <label className="flex items-center gap-2 text-xs text-vault-text-muted"><input type="checkbox" checked={exportBuilds} onChange={(e) => setExportBuilds(e.target.checked)} className="accent-[#00C2FF]" />Builds & Slots</label>
              <label className="flex items-center gap-2 text-xs text-vault-text-muted"><input type="checkbox" checked={exportAmmo} onChange={(e) => setExportAmmo(e.target.checked)} className="accent-[#00C2FF]" />Ammo & Transactions</label>
              <label className="flex items-center gap-2 text-xs text-vault-text-muted"><input type="checkbox" checked={exportRangeSessions} onChange={(e) => setExportRangeSessions(e.target.checked)} className="accent-[#00C2FF]" />Range Sessions</label>
              <label className="flex items-center gap-2 text-xs text-vault-text-muted"><input type="checkbox" checked={exportDocuments} onChange={(e) => setExportDocuments(e.target.checked)} className="accent-[#00C2FF]" />Documents</label>
              <label className="flex items-center gap-2 text-xs text-vault-text-muted sm:col-span-2"><input type="checkbox" checked={exportSettings} onChange={(e) => setExportSettings(e.target.checked)} className="accent-[#00C2FF]" />Settings (safe subset)</label>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleDownloadDataExport}
                disabled={exportingData}
                className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {exportingData ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exportingData ? "Exporting..." : `Download ${exportFormat.toUpperCase()} Export`}
              </button>
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
              <div className="bg-vault-bg border border-vault-border rounded-md px-3 py-2 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] text-vault-text-faint font-mono uppercase mb-0.5">This Device</p>
                  <code className="text-xs font-mono text-vault-text">http://localhost:{sysInfo?.port ?? "3000"}</code>
                </div>
                <button type="button" onClick={() => handleCopyUrl(`http://localhost:${sysInfo?.port ?? "3000"}`)}
                  className="shrink-0 p-1.5 text-vault-text-faint hover:text-[#00C2FF] transition-colors rounded" title="Copy URL">
                  {copiedUrl === `http://localhost:${sysInfo?.port ?? "3000"}` ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853]" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {sysInfo?.localIPs && sysInfo.localIPs.length > 0 ? (
                sysInfo.localIPs.map((ip) => (
                  <div key={ip} className="bg-vault-bg border border-vault-border rounded-md px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[10px] text-vault-text-faint font-mono uppercase mb-0.5">Local Network</p>
                      <code className="text-xs font-mono text-vault-text">http://{ip}:{sysInfo.port}</code>
                    </div>
                    <button type="button" onClick={() => handleCopyUrl(`http://${ip}:${sysInfo.port}`)}
                      className="shrink-0 p-1.5 text-vault-text-faint hover:text-[#00C2FF] transition-colors rounded" title="Copy URL">
                      {copiedUrl === `http://${ip}:${sysInfo.port}` ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-vault-text-faint italic">No local network interfaces detected.</div>
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
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-3 font-mono">Current Configuration Status</p>
            <div className="space-y-2">
              <StatusRow label="App Password" value={settings?.appPassword ? "Enabled" : "Disabled"} ok={!!settings?.appPassword} neutralIfFalse />
              <StatusRow label="Encryption at Rest" value={settings?.encryptionEnabled ? "Active" : "Not configured"} ok={!!settings?.encryptionEnabled} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-md text-sm font-medium transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusRow({ label, value, ok, neutralIfFalse }: { label: string; value: string; ok: boolean; neutralIfFalse?: boolean }) {
  void neutralIfFalse;
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-vault-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-[#00C853]" : "bg-vault-border"}`} />
        <span className={`text-xs font-mono ${ok ? "text-[#00C853]" : "text-vault-text-faint"}`}>{value}</span>
      </div>
    </div>
  );
}
