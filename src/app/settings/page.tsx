"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Lock,
  Eye,
  EyeOff,
  Image as ImageIcon,
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
  FileText,
  DownloadCloud,
  Archive,
  Rocket,
  RefreshCw,
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

  const [enableImageSearch, setEnableImageSearch] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [searchEngineId, setSearchEngineId] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const [exportPreset, setExportPreset] = useState<"CLAIMS" | "BACKUP">("CLAIMS");
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const [backupBusy, setBackupBusy] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [backupConfirm, setBackupConfirm] = useState("");
  const [includeDocumentFilesInBackup, setIncludeDocumentFilesInBackup] = useState(true);
  const [wizardStep, setWizardStep] = useState(0);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupIntervalMin, setAutoBackupIntervalMin] = useState(15);
  const [autoBackupStatus, setAutoBackupStatus] = useState<string | null>(null);
  const [autoBackupError, setAutoBackupError] = useState<string | null>(null);
  const [autoBackupRunning, setAutoBackupRunning] = useState(false);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateOutput, setUpdateOutput] = useState<string | null>(null);

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

  useEffect(() => {
    const enabled = localStorage.getItem("blackvault:auto-backup-enabled");
    const interval = localStorage.getItem("blackvault:auto-backup-interval");
    if (enabled === "true") setAutoBackupEnabled(true);
    if (interval && !Number.isNaN(Number(interval))) {
      setAutoBackupIntervalMin(Math.max(5, Number(interval)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("blackvault:auto-backup-enabled", String(autoBackupEnabled));
    localStorage.setItem("blackvault:auto-backup-interval", String(autoBackupIntervalMin));
  }, [autoBackupEnabled, autoBackupIntervalMin]);

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

    if (apiKey) {
      payload.googleCseApiKey = apiKey;
    }

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
        setApiKey("");
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

  async function handleDownloadFullArmoryExport() {
    setExportBusy(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const res = await fetch(`/api/exports/full-armory?preset=${exportPreset}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate export");

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      const files: Array<{ name: string; content: string }> = [
        { name: `full-armory-export-${timestamp}.json`, content: JSON.stringify(json, null, 2) },
        { name: `inventory-items-${timestamp}.csv`, content: json.csv?.inventoryItems ?? "" },
        { name: `attachments-index-${timestamp}.csv`, content: json.csv?.attachmentsIndex ?? "" },
        { name: `valuation-summary-${timestamp}.csv`, content: json.csv?.valuationSummary ?? "" },
      ];

      for (const file of files) {
        const blob = new Blob([file.content], { type: file.name.endsWith(".json") ? "application/json" : "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }

      setExportSuccess("Full Armory Export generated. JSON + CSV files downloaded.");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Failed to generate export");
    } finally {
      setExportBusy(false);
    }
  }


  async function encryptBackupPayload(payload: unknown, passphrase: string) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const iterations = 250000;

    const baseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    const plaintext = encoder.encode(JSON.stringify(payload));
    const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
    const encrypted = new Uint8Array(encryptedBuffer);

    const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));

    return {
      type: "blackvault-encrypted-backup",
      version: 1,
      generatedAt: new Date().toISOString(),
      kdf: { algorithm: "PBKDF2", hash: "SHA-256", iterations, salt: b64(salt) },
      cipher: { algorithm: "AES-GCM", iv: b64(iv), ciphertext: b64(encrypted) },
    };
  }

  async function handleCreateSecureBackup() {
    setBackupError(null);
    setBackupSuccess(null);

    if (!backupPassphrase || backupPassphrase.length < 12) {
      setBackupError("Use a backup passphrase with at least 12 characters.");
      return;
    }

    if (backupPassphrase !== backupConfirm) {
      setBackupError("Passphrase confirmation does not match.");
      return;
    }

    setBackupBusy(true);

    try {
      const res = await fetch("/api/backup/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ includeDocumentFiles: includeDocumentFilesInBackup }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to generate backup");

      const encryptedPayload = await encryptBackupPayload(json, backupPassphrase);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const blob = new Blob([JSON.stringify(encryptedPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `blackvault-backup-${timestamp}.bvault`;
      a.click();
      URL.revokeObjectURL(url);

      setBackupPassphrase("");
      setBackupConfirm("");
      setBackupSuccess("Encrypted backup created. Save the file and your passphrase in separate safe locations.");
    } catch (error) {
      setBackupError(error instanceof Error ? error.message : "Failed to create backup");
    } finally {
      setBackupBusy(false);
    }
  }

  const runAutoBackupCheck = useCallback(async (force = false) => {
    setAutoBackupError(null);
    setAutoBackupRunning(true);
    try {
      const res = await fetch("/api/backup/auto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeDocumentFiles: includeDocumentFilesInBackup,
          force,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Automatic backup failed");

      if (json.created) {
        setAutoBackupStatus(`Automatic backup created: ${json.fileName}`);
      } else {
        setAutoBackupStatus(json.reason ?? "No changes detected since last backup.");
      }
    } catch (error) {
      setAutoBackupError(error instanceof Error ? error.message : "Automatic backup failed");
    } finally {
      setAutoBackupRunning(false);
    }
  }, [includeDocumentFilesInBackup]);

  async function handlePullUpdates() {
    setUpdateBusy(true);
    setUpdateError(null);
    setUpdateOutput(null);

    try {
      const checkRes = await fetch("/api/system-update");
      const checkJson = await checkRes.json();

      if (!checkRes.ok) {
        const details = typeof checkJson.details === "string" ? `\n\n${checkJson.details}` : "";
        setUpdateError(`${checkJson.error ?? "Failed to check for updates."}${details}`);
        return;
      }

      if (checkJson.updateAvailable) {
        const commitLabel = checkJson.commitsBehind === 1 ? "1 new commit" : `${checkJson.commitsBehind} new commits`;
        const confirmed = window.confirm(`A new version is available (${commitLabel}). Pull updates now?`);
        if (!confirmed) {
          setUpdateOutput("Update canceled.");
          return;
        }
      }

      const res = await fetch("/api/system-update", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        const details = typeof json.details === "string" ? `\n\n${json.details}` : "";
        setUpdateError(`${json.error ?? "Failed to pull updates from GitHub."}${details}`);
        return;
      }

      const remoteLine = json.remote ? `Remote: ${json.remote}` : null;
      const branchLine = json.branch ? `Branch: ${json.branch}` : null;
      const outputLine = json.output ? `\n\n${json.output}` : "";
      const refreshNote = "\n\n✅ Update successful. Please refresh the app to load the latest version.";
      const header = [remoteLine, branchLine].filter(Boolean).join("\n");
      setUpdateOutput(`${header}${outputLine}${refreshNote}`.trim());
    } catch {
      setUpdateError("Network error. Please try again.");
    } finally {
      setUpdateBusy(false);
    }
  }

  useEffect(() => {
    if (!autoBackupEnabled) return;

    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      runAutoBackupCheck(false);
    }

    const ms = Math.max(5, autoBackupIntervalMin) * 60 * 1000;
    const timer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      runAutoBackupCheck(false);
    }, ms);

    return () => clearInterval(timer);
  }, [autoBackupEnabled, autoBackupIntervalMin, runAutoBackupCheck]);



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

  const wizardSteps = [
    {
      title: "Secure Access",
      description: "Set an app password so the vault is protected on startup.",
      done: !!settings?.appPassword,
    },
    {
      title: "Encryption",
      description: "Enable encryption at rest and save your encryption key offline.",
      done: !!settings?.encryptionEnabled,
    },
    {
      title: "Backups",
      description: "Create your first encrypted .bvault backup with document files included.",
      done: !!backupSuccess,
    },
    {
      title: "Auto-Backup",
      description: "Enable automatic backup checks to protect new changes automatically.",
      done: autoBackupEnabled,
    },
  ] as const;

  const completedWizardSteps = wizardSteps.filter((step) => step.done).length;

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
          {/* ── Image Search ────────────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-5">
            <div className="flex items-center justify-between">
              <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
                <ImageIcon className="w-3.5 h-3.5" />
                Image Search
              </legend>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${imageSearchConfigured ? "text-[#00C853] border-[#00C853]/40" : "text-vault-text-faint border-vault-border"}`}>
                {imageSearchConfigured ? "Configured" : "Not Configured"}
              </span>
            </div>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Enable Google Custom Search to automatically find images for firearms and accessories. Requires a Google Cloud CSE API key and a configured search engine.
            </p>

            <div>
              <button type="button" onClick={() => setEnableImageSearch((v) => !v)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md border transition-all ${enableImageSearch ? "border-[#00C2FF]/40 bg-[#00C2FF]/5" : "border-vault-border hover:border-vault-text-muted/20"}`}>
                <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${enableImageSearch ? "bg-[#00C2FF]" : "bg-vault-border"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${enableImageSearch ? "left-4" : "left-0.5"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-vault-text">Enable Image Search</p>
                  <p className="text-xs text-vault-text-faint mt-0.5">Adds a &quot;Search Images&quot; button to firearm and accessory forms.</p>
                </div>
              </button>
            </div>

            <div>
              <label className={LABEL_CLASS}>
                <Search className="w-3 h-3 inline mr-1" />
                Google CSE API Key
                {settings?._googleCseApiKeyIsSet && (
                  <span className="ml-2 text-[#00C853] text-[10px] normal-case tracking-normal">(currently set)</span>
                )}
              </label>
              <div className="relative">
                <input type={showApiKey ? "text" : "password"} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                  placeholder={settings?._googleCseApiKeyIsSet ? "Leave blank to keep existing key" : "AIza..."}
                  className={`${INPUT_CLASS} pr-10 font-mono`} />
                <button type="button" onClick={() => setShowApiKey((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-faint hover:text-vault-text-muted">
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-vault-text-faint mt-1">From the Google Cloud Console. Leave blank to keep the existing key.</p>
            </div>

            <div>
              <label htmlFor="searchEngineId" className={LABEL_CLASS}>
                <Search className="w-3 h-3 inline mr-1" />
                Search Engine ID (cx)
              </label>
              <input id="searchEngineId" type="text" value={searchEngineId} onChange={(e) => setSearchEngineId(e.target.value)}
                placeholder="e.g. 017576662512468239146:omuauf_lfve" className={`${INPUT_CLASS} font-mono`} />
              <p className="text-xs text-vault-text-faint mt-1">The &quot;cx&quot; parameter from your Programmable Search Engine dashboard.</p>
            </div>
          </fieldset>

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

          {/* ── GitHub Updates ─────────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
              <DownloadCloud className="w-3.5 h-3.5" />
              GitHub Updates
            </legend>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Pull the latest commits from your configured <code className="font-mono text-vault-text-faint">origin</code> remote with one click.
            </p>

            {updateError && (
              <div className="flex items-start gap-2 rounded-md border border-[#E53935]/30 bg-[#E53935]/10 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-[#E53935] mt-0.5 shrink-0" />
                <p className="text-xs text-[#E53935] whitespace-pre-wrap">{updateError}</p>
              </div>
            )}

            {updateOutput && (
              <div className="rounded-md border border-[#00C853]/30 bg-[#00C853]/10 px-3 py-2 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#00C853]" />
                  <p className="text-xs text-[#00C853]">Update check completed.</p>
                </div>
                <pre className="text-[11px] text-vault-text-faint whitespace-pre-wrap break-words font-mono">{updateOutput}</pre>
              </div>
            )}

            <button
              type="button"
              onClick={handlePullUpdates}
              disabled={updateBusy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-60 disabled:cursor-not-allowed text-xs transition-colors"
            >
              {updateBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {updateBusy ? "Pulling updates..." : "Pull Updates from GitHub"}
            </button>

            <p className="text-[11px] text-vault-text-faint">
              This performs a fast-forward-only <code className="font-mono">git pull origin &lt;current-branch&gt;</code>. If files changed, restart BlackVault to apply updates.
            </p>
          </fieldset>

          {/* ── Setup Wizard ───────────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
              <Rocket className="w-3.5 h-3.5" />
              Setup Wizard
            </legend>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Guided onboarding for non-technical users. Complete each step to harden security and automate backup protection.
            </p>

            <div className="bg-vault-bg border border-vault-border rounded-md p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-vault-text-faint font-mono">Progress</p>
                <p className="text-xs text-vault-text-muted">{completedWizardSteps} / {wizardSteps.length} complete</p>
              </div>
              <div className="h-2 rounded bg-vault-border overflow-hidden">
                <div className="h-full bg-[#00C2FF] transition-all" style={{ width: `${(completedWizardSteps / wizardSteps.length) * 100}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {wizardSteps.map((step, idx) => (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setWizardStep(idx)}
                  className={`text-left rounded-md border px-3 py-2 text-xs transition-colors ${wizardStep === idx ? "border-[#00C2FF]/40 bg-[#00C2FF]/10" : "border-vault-border hover:border-vault-text-muted/30"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium ${wizardStep === idx ? "text-[#00C2FF]" : "text-vault-text"}`}>{idx + 1}. {step.title}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${step.done ? "text-[#00C853] border-[#00C853]/40" : "text-vault-text-faint border-vault-border"}`}>
                      {step.done ? "DONE" : "PENDING"}
                    </span>
                  </div>
                  <p className="text-[11px] text-vault-text-faint mt-1">{step.description}</p>
                </button>
              ))}
            </div>

            <div className="bg-vault-bg border border-vault-border rounded-md p-4 space-y-2">
              <p className="text-xs text-vault-text font-medium">Current Step: {wizardSteps[wizardStep].title}</p>
              <p className="text-xs text-vault-text-faint">{wizardSteps[wizardStep].description}</p>
              {wizardStep === 3 && (
                <button
                  type="button"
                  onClick={() => runAutoBackupCheck(true)}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs border border-vault-border text-vault-text-muted hover:text-[#00C2FF] hover:border-[#00C2FF]/30"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Run First Auto-Backup Check
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setWizardStep((s) => Math.max(0, s - 1))}
                disabled={wizardStep === 0}
                className="px-3 py-1.5 text-xs rounded-md border border-vault-border text-vault-text-faint disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setWizardStep((s) => Math.min(wizardSteps.length - 1, s + 1))}
                disabled={wizardStep === wizardSteps.length - 1}
                className="px-3 py-1.5 text-xs rounded-md border border-[#00C2FF]/30 text-[#00C2FF] disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </fieldset>

          {/* ── Full Armory Export ─────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
              <FileText className="w-3.5 h-3.5" />
              Full Armory Export
            </legend>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Build a claim-ready package with missing-evidence flags, uploaded receipts, and CSV companion files.
            </p>

            {exportError && (
              <div className="flex items-center gap-2 rounded-md border border-[#E53935]/30 bg-[#E53935]/10 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-[#E53935]" />
                <p className="text-xs text-[#E53935]">{exportError}</p>
              </div>
            )}

            {exportSuccess && (
              <div className="flex items-center gap-2 rounded-md border border-[#00C853]/30 bg-[#00C853]/10 px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#00C853]" />
                <p className="text-xs text-[#00C853]">{exportSuccess}</p>
              </div>
            )}

            <div className="bg-vault-bg border border-vault-border rounded-md p-4 space-y-3">
              <p className="text-[10px] text-vault-text-faint font-mono uppercase tracking-widest">Claims Preset</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setExportPreset("CLAIMS")}
                  className={`rounded-md border px-3 py-2 text-left transition-colors ${
                    exportPreset === "CLAIMS"
                      ? "border-[#00C2FF]/40 bg-[#00C2FF]/10 text-[#00C2FF]"
                      : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/30"
                  }`}
                >
                  <p className="text-xs font-medium">Insurance / Law Enforcement</p>
                  <p className="text-[11px] mt-1">Full details, unmasked serials, all receipts included.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setExportPreset("BACKUP")}
                  className={`rounded-md border px-3 py-2 text-left transition-colors ${
                    exportPreset === "BACKUP"
                      ? "border-[#00C2FF]/40 bg-[#00C2FF]/10 text-[#00C2FF]"
                      : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/30"
                  }`}
                >
                  <p className="text-xs font-medium">General Backup</p>
                  <p className="text-[11px] mt-1">Masked serials with the same document/receipt coverage.</p>
                </button>
              </div>
            </div>

            <div className="bg-vault-bg border border-vault-border rounded-md p-4 space-y-3">
              <p className="text-[10px] text-vault-text-faint font-mono uppercase tracking-widest">What gets generated</p>
              <ul className="space-y-1.5 text-xs text-vault-text-muted">
                <li>• `full-armory-export-*.json` with complete item + attachment data.</li>
                <li>• `inventory-items-*.csv` for line-item adjuster workflows.</li>
                <li>• `attachments-index-*.csv` with uploaded receipt/document linkage.</li>
                <li>• `valuation-summary-*.csv` including missing evidence counters.</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadFullArmoryExport}
                disabled={exportBusy}
                className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {exportBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                {exportBusy ? "Generating Export..." : "Generate Full Armory Export"}
              </button>
              <p className="text-xs text-vault-text-faint">Includes all uploaded receipts in the attachment index output.</p>
            </div>

            <p className="text-xs text-vault-text-faint">
              Specification reference: <code className="font-mono">docs/full-armory-export-format.md</code>
            </p>
          </fieldset>

          {/* ── Secure System Backup ─────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
              <Archive className="w-3.5 h-3.5" />
              Secure System Backup
            </legend>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              One-click encrypted backup for self-hosted deployments. Great for non-technical users: enter a passphrase, click create, and save one backup file.
            </p>

            {backupError && (
              <div className="flex items-center gap-2 rounded-md border border-[#E53935]/30 bg-[#E53935]/10 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-[#E53935]" />
                <p className="text-xs text-[#E53935]">{backupError}</p>
              </div>
            )}

            {backupSuccess && (
              <div className="flex items-center gap-2 rounded-md border border-[#00C853]/30 bg-[#00C853]/10 px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#00C853]" />
                <p className="text-xs text-[#00C853]">{backupSuccess}</p>
              </div>
            )}

            <div className="bg-vault-bg border border-vault-border rounded-md p-4 space-y-3">
              <label className={LABEL_CLASS}>Backup Passphrase</label>
              <input
                type="password"
                value={backupPassphrase}
                onChange={(e) => setBackupPassphrase(e.target.value)}
                placeholder="At least 12 characters"
                className={INPUT_CLASS}
              />

              <label className={LABEL_CLASS}>Confirm Passphrase</label>
              <input
                type="password"
                value={backupConfirm}
                onChange={(e) => setBackupConfirm(e.target.value)}
                placeholder="Re-enter passphrase"
                className={INPUT_CLASS}
              />

              <button
                type="button"
                onClick={() => setIncludeDocumentFilesInBackup((v) => !v)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md border transition-all ${includeDocumentFilesInBackup ? "border-[#00C2FF]/40 bg-[#00C2FF]/5" : "border-vault-border hover:border-vault-text-muted/20"}`}
              >
                <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${includeDocumentFilesInBackup ? "bg-[#00C2FF]" : "bg-vault-border"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${includeDocumentFilesInBackup ? "left-4" : "left-0.5"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-vault-text">Include uploaded document files</p>
                  <p className="text-xs text-vault-text-faint mt-0.5">Keeps receipts and other uploaded files inside the encrypted backup.</p>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCreateSecureBackup}
                disabled={backupBusy}
                className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {backupBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                {backupBusy ? "Creating Secure Backup..." : "Create Encrypted Backup"}
              </button>
              <p className="text-xs text-vault-text-faint">Uses AES-256-GCM encryption in your browser with PBKDF2 key stretching.</p>
            </div>

            <div className="bg-vault-bg border border-vault-border rounded-md p-4 space-y-3">
              <p className="text-[10px] text-vault-text-faint font-mono uppercase tracking-widest">Automatic Backup (After Changes)</p>

              {autoBackupError && (
                <p className="text-xs text-[#E53935]">{autoBackupError}</p>
              )}
              {autoBackupStatus && (
                <p className="text-xs text-[#00C853]">{autoBackupStatus}</p>
              )}

              <button
                type="button"
                onClick={() => setAutoBackupEnabled((v) => !v)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md border transition-all ${autoBackupEnabled ? "border-[#00C2FF]/40 bg-[#00C2FF]/5" : "border-vault-border hover:border-vault-text-muted/20"}`}
              >
                <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${autoBackupEnabled ? "bg-[#00C2FF]" : "bg-vault-border"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${autoBackupEnabled ? "left-4" : "left-0.5"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-vault-text">Enable automatic backup checks</p>
                  <p className="text-xs text-vault-text-faint mt-0.5">When enabled, the app checks for data changes and triggers a secure server backup.</p>
                </div>
              </button>

              <div>
                <label className={LABEL_CLASS}>Check Interval (minutes)</label>
                <input
                  type="number"
                  min={5}
                  value={autoBackupIntervalMin}
                  onChange={(e) => setAutoBackupIntervalMin(Math.max(5, Number(e.target.value || 5)))}
                  className={INPUT_CLASS}
                />
              </div>

              <button
                type="button"
                onClick={() => runAutoBackupCheck(true)}
                disabled={autoBackupRunning}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm border border-vault-border text-vault-text-muted hover:text-[#00C2FF] hover:border-[#00C2FF]/30 disabled:opacity-50"
              >
                {autoBackupRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {autoBackupRunning ? "Running..." : "Run Backup Check Now"}
              </button>

              <p className="text-xs text-vault-text-faint">Server requirement: set <code className="font-mono">AUTO_BACKUP_PASSPHRASE</code> for automatic encrypted backup files in <code className="font-mono">/backups</code>.</p>
            </div>
          </fieldset>

          {/* ── Status Summary ──────────────────────────────── */}
          <div className="bg-vault-bg border border-vault-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-3 font-mono">Current Configuration Status</p>
            <div className="space-y-2">
              <StatusRow label="Image Search" value={enableImageSearch ? "Enabled" : "Disabled"} ok={enableImageSearch} />
              <StatusRow label="CSE API Key" value={settings?._googleCseApiKeyIsSet ? "Configured" : "Not set"} ok={!!settings?._googleCseApiKeyIsSet} />
              <StatusRow label="Search Engine ID" value={settings?.googleCseSearchEngineId ? "Configured" : "Not set"} ok={!!settings?.googleCseSearchEngineId} />
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
