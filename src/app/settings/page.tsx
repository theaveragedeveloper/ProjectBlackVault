"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Settings,
  Archive,
  Database,
  Download,
  Clock3,
  Files,
} from "lucide-react";
import { SettingToggleCard } from "@/components/settings/SettingToggleCard";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5";

export default function SettingsPage() {
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [includeUploadsInBackup, setIncludeUploadsInBackup] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupCadence, setAutoBackupCadence] = useState<"daily" | "weekly" | "monthly">("weekly");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [localPort, setLocalPort] = useState("3000");
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [localAccessMessage, setLocalAccessMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setDataError(data.error);
        } else {
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

  useEffect(() => {
    fetch("/api/network/local-access")
      .then((r) => r.json())
      .then((data) => {
        setLocalIp(data.ip ?? null);
        setLocalPort(data.port ?? "3000");
        setLocalUrl(data.url ?? null);
        setLocalAccessMessage(data.message ?? null);
      })
      .catch(() => {
        setLocalIp(null);
        setLocalPort("3000");
        setLocalUrl(null);
        setLocalAccessMessage("Unable to detect local network IP");
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
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLocalUrl() {
    if (!localUrl || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(localUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
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

            <SettingToggleCard
              enabled={includeUploadsInBackup}
              onToggle={() => setIncludeUploadsInBackup((v) => !v)}
              title="Include Upload References"
              description="Adds uploaded image/document paths to backup exports so storage files can be copied."
              enabledStateText="Included"
              disabledStateText="Skipped"
              icon={<Files className="w-3.5 h-3.5 text-vault-text-faint" />}
            />

            <SettingToggleCard
              enabled={autoBackupEnabled}
              onToggle={() => setAutoBackupEnabled((v) => !v)}
              title="Enable Basic Auto Backup"
              description="Saves your preferred cadence. This app does not run scheduled jobs by itself."
              enabledStateText="Cadence saved"
              disabledStateText="Manual only"
              icon={<Clock3 className="w-3.5 h-3.5 text-vault-text-faint" />}
            />

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
                {autoBackupEnabled
                  ? "Use this with a cron job, compose schedule, or host script that calls the export endpoint."
                  : "Turn on Basic Auto Backup above to pick a cadence."}
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
                <Database className="w-3.5 h-3.5" />
                Local Network Access
              </legend>
            </div>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Make sure your phone is on the same WiFi network.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-vault-text-muted">Device IP</span>
                <span className="font-mono text-vault-text">{localIp ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-vault-text-muted">Port</span>
                <span className="font-mono text-vault-text">{localPort}</span>
              </div>
            </div>

            {localUrl ? (
              <div className="space-y-3">
                <div className="rounded-md border border-vault-border bg-vault-bg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-vault-text-faint font-mono">
                    Access URL
                  </p>
                  <p className="font-mono text-sm text-vault-text break-all">{localUrl}</p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLocalUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/10 transition-colors text-sm font-medium"
                >
                  <Copy className="w-4 h-4" />
                  {copySuccess ? "Copied!" : "Copy URL"}
                </button>
              </div>
            ) : (
              <div className="rounded-md border border-[#E53935]/30 bg-[#E53935]/10 px-3 py-2">
                <p className="text-sm text-[#E53935]">
                  {localAccessMessage ?? "Unable to detect local network IP"}
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
                label="Include Upload References"
                value={includeUploadsInBackup ? "Enabled" : "Disabled"}
                ok={includeUploadsInBackup}
              />
              <StatusRow
                label="Auto Backup"
                value={autoBackupEnabled ? `Plan saved (${autoBackupCadence})` : "No backup plan saved"}
                ok={autoBackupEnabled}
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
