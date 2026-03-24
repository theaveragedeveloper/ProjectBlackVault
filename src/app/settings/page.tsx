"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, Copy, Download, Files, Settings } from "lucide-react";
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
  const [manualLanHost, setManualLanHost] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [localIp, setLocalIp] = useState<string | null>(null);
  const [localPort, setLocalPort] = useState("3000");
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
          setManualLanHost(data.manualLanHost ?? "");
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
      })
      .catch(() => {
        setLocalIp(null);
        setLocalPort("3000");
      });
  }, []);

  const manualHost = manualLanHost.trim();
  const computedHost = manualHost || localIp || "";
  const finalLanUrl = computedHost ? `http://${computedHost}:${localPort}` : "";
  const lanStatusLabel = manualHost
    ? "Using your saved Mobile Access Host/IP"
    : localIp
      ? "Using auto-detected network address"
      : null;

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
          manualLanHost,
        }),
      });

      if (!res.ok) {
        setSaveError("Could not save mobile access settings. Please try again.");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError("Could not save mobile access settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyLocalUrl() {
    if (!finalLanUrl || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(finalLanUrl);
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
        {saveSuccess && <StatusMessage tone="success" message="Mobile access settings saved." />}

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
          title="Mobile Access (Local Network)"
          description="Set a trusted local address so phones and tablets on your network can reliably reach BlackVault."
        >
          <div className="space-y-4">
            <FormField
              label="Mobile Access Host/IP"
              hint="Enter the local IP address or hostname your other devices should always use for this app."
            >
              <input
                id="manualLanHost"
                type="text"
                value={manualLanHost}
                onChange={(e) => setManualLanHost(e.target.value)}
                className={INPUT_CLASS}
                placeholder="192.168.1.74"
              />
              <p className="mt-2 text-xs text-vault-text-muted">Example: 192.168.1.74 (recommended: reserve this IP in your router)</p>
            </FormField>

            {finalLanUrl ? (
              <div className="rounded-lg border border-vault-border bg-vault-bg p-3">
                <p className="text-xs uppercase tracking-widest text-vault-text-faint">Mobile URL</p>
                <p className="mt-1 break-all font-mono text-sm text-vault-text">{finalLanUrl}</p>
                {lanStatusLabel ? <p className="mt-1 text-xs text-vault-text-muted">{lanStatusLabel}</p> : null}
                {!manualHost && localIp ? (
                  <p className="mt-1 text-xs text-vault-text-muted">
                    Auto-detection is a fallback only. If this link does not work, enter and save your preferred local host/IP above.
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-vault-text-muted">
                  Keep devices on the same local network and open this exact address in your mobile browser.
                </p>
              </div>
            ) : (
              <StatusMessage
                tone="error"
                message="No mobile access address is available yet. Enter your preferred local host/IP above to generate a trusted mobile URL."
              />
            )}

            {finalLanUrl ? (
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
            ) : null}
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
              value={finalLanUrl ? "Yes" : "No"}
              ok={Boolean(finalLanUrl)}
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
