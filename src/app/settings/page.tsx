"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, Copy, Download, Files, Settings, Database } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusMessage } from "@/components/shared/StatusMessage";
import { LoadingState } from "@/components/shared/LoadingState";
import { SettingToggleCard } from "@/components/settings/SettingToggleCard";
import { FormField, INPUT_CLASS } from "@/components/shared/FormField";
import { StandardButton, buttonClassName } from "@/components/shared/StandardButton";

export default function SettingsPage() {
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [includeUploadsInBackup, setIncludeUploadsInBackup] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupCadence, setAutoBackupCadence] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [backupDestinationPath, setBackupDestinationPath] = useState("");

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
          setBackupDestinationPath(data.backupDestinationPath ?? "");
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

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          includeUploadsInBackup,
          autoBackupEnabled,
          autoBackupCadence,
          backupDestinationPath,
        }),
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
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <LoadingState label="Loading settings..." />
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <StatusMessage tone="error" message={dataError} />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <PageHeader
        title="Settings"
        subtitle="Vault preferences, backup behavior, and deployment access details."
      />

      <form onSubmit={handleSave} className="mx-auto grid max-w-4xl gap-4 p-4 sm:gap-6 sm:p-6">
        {saveError && <StatusMessage tone="error" message={saveError} />}
        {saveSuccess && <StatusMessage tone="success" message="Settings saved successfully." />}

        <SectionCard
          title="Backup"
          description="Configure export behavior for self-hosted backups."
          actions={
            <span className="text-xs uppercase tracking-widest text-vault-text-faint">
              {autoBackupEnabled ? "Plan saved" : "Manual only"}
            </span>
          }
        >
          <div className="space-y-4">
            <SettingToggleCard
              enabled={includeUploadsInBackup}
              onToggle={() => setIncludeUploadsInBackup((v) => !v)}
              title="Include Upload References"
              description="Includes uploaded image and document paths so storage files can be copied with backups."
              enabledStateText="Included"
              disabledStateText="Skipped"
              icon={<Files className="w-3.5 h-3.5 text-vault-text-faint" />}
            />

            <SettingToggleCard
              enabled={autoBackupEnabled}
              onToggle={() => setAutoBackupEnabled((v) => !v)}
              title="Enable Basic Auto Backup"
              description="Stores backup cadence preferences. Scheduling is handled externally by cron, Docker, or host jobs."
              enabledStateText="Cadence saved"
              disabledStateText="Manual only"
              icon={<Archive className="w-3.5 h-3.5 text-vault-text-faint" />}
            />

            <FormField
              label="Auto Backup Cadence"
              hint={
                autoBackupEnabled
                  ? "Use this cadence with your host scheduler calling the export workflow."
                  : "Enable basic auto backup first to select cadence."
              }
            >
              <select
                id="autoBackupCadence"
                value={autoBackupCadence}
                onChange={(e) =>
                  setAutoBackupCadence(e.target.value as "daily" | "weekly" | "monthly")
                }
                disabled={!autoBackupEnabled}
                className={`${INPUT_CLASS} disabled:opacity-60`}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </FormField>

            <FormField
              label="Preferred Backup Destination Path"
              hint="Saved as a reference path for your backup process. Exports are still downloaded through your browser in V1."
            >
              <input
                id="backupDestinationPath"
                type="text"
                value={backupDestinationPath}
                onChange={(e) => setBackupDestinationPath(e.target.value)}
                className={INPUT_CLASS}
                placeholder="/srv/blackvault/backups or D:\\Backups\\BlackVault"
              />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard
          title="App access"
          description="Use this URL to open BlackVault from another device on the same local network."
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-vault-border bg-vault-bg p-3">
              <p className="text-xs uppercase tracking-widest text-vault-text-faint">Device IP</p>
              <p className="mt-1 font-mono text-sm text-vault-text">{localIp ?? "Unavailable"}</p>
            </div>

            <div className="rounded-lg border border-vault-border bg-vault-bg p-3">
              <p className="text-xs uppercase tracking-widest text-vault-text-faint">Port</p>
              <p className="mt-1 font-mono text-sm text-vault-text">{localPort}</p>
            </div>

            <div className="rounded-lg border border-vault-border bg-vault-bg p-3">
              <p className="text-xs uppercase tracking-widest text-vault-text-faint">Access URL</p>
              <p className="mt-1 break-all font-mono text-sm text-vault-text">
                {localUrl ?? "Unavailable"}
              </p>
              <p className="mt-1 text-xs text-vault-text-muted">
                Make sure your phone is on the same Wi-Fi or LAN. Example:
                <span className="ml-1 font-mono">http://192.168.1.50:3000</span>
              </p>
            </div>

            {localUrl ? (
              <div className="flex flex-wrap gap-2">
                <StandardButton
                  type="button"
                  variant="secondary"
                  onClick={handleCopyLocalUrl}
                  icon={<Copy className="h-4 w-4" />}
                >
                  {copySuccess ? "Copied!" : "Copy URL"}
                </StandardButton>
              </div>
            ) : (
              <StatusMessage
                tone="error"
                message={localAccessMessage ?? "Unable to detect local network IP."}
              />
            )}

            <div className="rounded-md border border-vault-border bg-vault-bg px-3 py-2">
              <div className="flex items-start gap-2">
                <Database className="mt-0.5 h-4 w-4 text-vault-text-faint" />
                <div className="text-xs text-vault-text-muted">
                  For LAN access to work reliably, the app must be bound to <span className="font-mono">0.0.0.0</span>
                  , not just <span className="font-mono">localhost</span>.
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Exports"
          description="Generate complete full-armory exports for backup, insurance records, or offline storage."
        >
          <Link href="/exports/full-armory" className={buttonClassName("secondary", "w-full sm:w-auto")}>
            <Download className="h-4 w-4" />
            Open Full Armory Exports
          </Link>
        </SectionCard>

        <SectionCard
          title="Current configuration"
          description="Quick status of high-impact settings."
        >
          <div className="space-y-2 text-sm">
            <StatusRow
              label="Include Upload References"
              value={includeUploadsInBackup ? "Enabled" : "Disabled"}
              ok={includeUploadsInBackup}
            />
            <StatusRow
              label="Auto Backup"
              value={autoBackupEnabled ? `Enabled (${autoBackupCadence})` : "Disabled"}
              ok={autoBackupEnabled}
            />
            <StatusRow
              label="Backup Destination Preference"
              value={backupDestinationPath ? "Saved" : "Not set"}
              ok={Boolean(backupDestinationPath)}
            />
            <StatusRow
              label="LAN URL Available"
              value={localUrl ? "Yes" : "No"}
              ok={Boolean(localUrl)}
            />
          </div>
        </SectionCard>

        <div className="flex justify-end">
          <StandardButton
            type="submit"
            variant="primary"
            loading={saving}
            loadingLabel="Saving..."
            icon={<Settings className="h-4 w-4" />}
          >
            Save Settings
          </StandardButton>
        </div>
      </form>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-vault-border bg-vault-bg px-3 py-2">
      <span className="text-xs text-vault-text-muted">{label}</span>
      <span className={ok ? "font-mono text-xs text-[#00C853]" : "font-mono text-xs text-vault-text-faint"}>
        {value}
      </span>
    </div>
  );
}
