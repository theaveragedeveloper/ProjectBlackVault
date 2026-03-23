"use client";

import Link from "next/link";
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
  Archive,
  Database,
  Download,
} from "lucide-react";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

interface AppSettings {
  id: string;
  appPassword: string | null;
  encryptionEnabled?: boolean;
  includeUploadsInBackup?: boolean;
  autoBackupEnabled?: boolean;
  autoBackupCadence?: "daily" | "weekly" | "monthly";
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [appPassword, setAppPassword] = useState("");
  const [appPasswordDirty, setAppPasswordDirty] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [includeUploadsInBackup, setIncludeUploadsInBackup] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupCadence, setAutoBackupCadence] = useState<"daily" | "weekly" | "monthly">("weekly");

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
          setIncludeUploadsInBackup(data.includeUploadsInBackup ?? true);
          setAutoBackupEnabled(data.autoBackupEnabled ?? false);
          setAutoBackupCadence(data.autoBackupCadence ?? "weekly");
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
      includeUploadsInBackup,
      autoBackupEnabled,
      autoBackupCadence,
    };

    if (appPasswordDirty) {
      payload.appPassword = appPassword || null;
    }

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
        setAppPassword("");
        setAppPasswordDirty(false);
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

  return (
    <div className="min-h-full">
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
              Set an optional app password to restrict access to the vault. Leave blank to disable password protection.
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
                  onChange={(e) => {
                    setAppPassword(e.target.value);
                    setAppPasswordDirty(true);
                  }}
                  placeholder={
                    settings?.appPassword
                      ? "Leave unchanged to keep current password"
                      : "Leave blank to disable password protection"
                  }
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

          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-5">
            <div className="flex items-center justify-between">
              <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
                <Archive className="w-3.5 h-3.5" />
                Backup
              </legend>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                  autoBackupEnabled
                    ? "text-[#00C853] border-[#00C853]/40"
                    : "text-vault-text-faint border-vault-border"
                }`}
              >
                {autoBackupEnabled ? "Backup Plan Saved" : "Manual Export Only"}
              </span>
            </div>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Backup exports use the existing self-hosted storage layout. Data export files include
              database records, and can also include references to uploaded media in{" "}
              <code className="text-vault-text-faint font-mono">storage/uploads</code> so you can
              copy those files with your backup.
            </p>

            <button
              type="button"
              onClick={() => setIncludeUploadsInBackup((v) => !v)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md border transition-all ${
                includeUploadsInBackup
                  ? "border-[#00C2FF]/40 bg-[#00C2FF]/5"
                  : "border-vault-border hover:border-vault-text-muted/20"
              }`}
            >
              <div
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                  includeUploadsInBackup ? "bg-[#00C2FF]" : "bg-vault-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    includeUploadsInBackup ? "left-4" : "left-0.5"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-vault-text">Include Upload References</p>
                <p className="text-xs text-vault-text-faint mt-0.5">
                  Adds uploaded image/document paths to backup exports so storage files can be copied.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAutoBackupEnabled((v) => !v)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md border transition-all ${
                autoBackupEnabled
                  ? "border-[#00C2FF]/40 bg-[#00C2FF]/5"
                  : "border-vault-border hover:border-vault-text-muted/20"
              }`}
            >
              <div
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                  autoBackupEnabled ? "bg-[#00C2FF]" : "bg-vault-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                    autoBackupEnabled ? "left-4" : "left-0.5"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-vault-text">Enable Basic Auto Backup</p>
                <p className="text-xs text-vault-text-faint mt-0.5">
                  Saves your preferred cadence. This app does not run scheduled jobs by itself.
                </p>
              </div>
            </button>

            <div>
              <label htmlFor="autoBackupCadence" className={LABEL_CLASS}>
                <Database className="w-3 h-3 inline mr-1" />
                Auto Backup Cadence
              </label>
              <select
                id="autoBackupCadence"
                value={autoBackupCadence}
                onChange={(e) => setAutoBackupCadence(e.target.value as "daily" | "weekly" | "monthly")}
                disabled={!autoBackupEnabled}
                className={`${INPUT_CLASS} disabled:opacity-60`}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <p className="text-xs text-vault-text-faint mt-1">
                Use this with a cron job, compose schedule, or host script that calls the export endpoint.
              </p>
            </div>
          </fieldset>

          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
                <Download className="w-3.5 h-3.5" />
                Exports
              </legend>
            </div>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Generate full armory exports for backups, insurance records, or offline sharing.
            </p>

            <Link
              href="/exports/full-armory"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/10 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Open Full Armory Exports
            </Link>
          </fieldset>

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
              Encryption protects sensitive values before they are written to your database files.
              If someone copies the raw DB without your key, those encrypted values stay unreadable.
              Set <code className="text-vault-text-faint font-mono">VAULT_ENCRYPTION_KEY</code> in{" "}
              <code className="text-vault-text-faint font-mono">.blackvault.env</code> (or your
              Docker environment), then restart the app so the key is loaded.
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

          <div className="bg-vault-bg border border-vault-border rounded-lg p-4">
            <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-3 font-mono">
              Current Configuration Status
            </p>
            <div className="space-y-2">
              <StatusRow
                label="App Password"
                value={settings?.appPassword ? "Enabled" : "Disabled"}
                ok={!!settings?.appPassword}
              />
              <StatusRow
                label="Include Upload References"
                value={includeUploadsInBackup ? "Enabled" : "Disabled"}
                ok={includeUploadsInBackup}
              />
              <StatusRow
                label="Auto Backup"
                value={autoBackupEnabled ? `Plan saved (${autoBackupCadence})` : "No backup plan saved"}
                ok={autoBackupEnabled}
              />
              <StatusRow
                label="Encryption at Rest"
                value={settings?.encryptionEnabled ? "Active" : "Not configured"}
                ok={!!settings?.encryptionEnabled}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-md text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  const color = ok ? "text-[#00C853]" : "text-vault-text-faint";
  const dotColor = ok ? "bg-[#00C853]" : "bg-vault-border";

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
