"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, Copy, Download, Files, HardDriveDownload, RotateCcw, Settings, Upload } from "lucide-react";
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
  const [isDocker, setIsDocker] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  const [backupStatus, setBackupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [backupResult, setBackupResult] = useState<{ filename: string; savedToPath?: string; sizeMB: string } | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreCounts, setRestoreCounts] = useState<Record<string, number> | null>(null);

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
        setIsDocker(data.isDocker ?? false);
      })
      .catch(() => {
        setLocalIp(null);
        setLocalPort("3000");
      });
  }, []);

  const manualHost = manualLanHost.trim();
  const computedHost = manualHost || localIp || "";
  const finalLanUrl = computedHost ? `http://${computedHost}:${localPort}` : "";

  useEffect(() => {
    if (finalLanUrl) {
      import("qrcode").then((QRCode) => {
        QRCode.toDataURL(finalLanUrl, { width: 160, margin: 2 }).then(setQrDataUrl).catch(() => {});
      });
    } else {
      setQrDataUrl("");
    }
  }, [finalLanUrl]);
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

  async function handleBackupNow() {
    setBackupStatus("loading");
    setBackupError(null);
    setBackupResult(null);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setBackupStatus("error");
        setBackupError(json.error ?? "Backup failed.");
        return;
      }
      const filename = json.filename as string;
      const blob = new Blob([JSON.stringify({ meta: json.meta, ...json.data }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setBackupResult({ filename, savedToPath: json.savedToPath, sizeMB: json.sizeMB });
      setBackupStatus("success");
      setTimeout(() => { setBackupStatus("idle"); setBackupResult(null); }, 8000);
    } catch {
      setBackupStatus("error");
      setBackupError("Network error. Could not reach the backup endpoint.");
    }
  }

  function handleRestoreFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPendingRestoreFile(e.target.files?.[0] ?? null);
    setShowRestoreConfirm(false);
    setRestoreStatus("idle");
    setRestoreError(null);
    setRestoreCounts(null);
  }

  async function handleRestoreConfirm() {
    if (!pendingRestoreFile) return;
    setShowRestoreConfirm(false);
    setRestoreStatus("loading");
    setRestoreError(null);
    try {
      const text = await pendingRestoreFile.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setRestoreStatus("error");
        setRestoreError("The selected file is not valid JSON. Please select a .json backup file.");
        return;
      }
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setRestoreStatus("error");
        setRestoreError(json.error ?? "Restore failed. Your data was not modified.");
        return;
      }
      setRestoreCounts(json.counts);
      setRestoreStatus("success");
      setPendingRestoreFile(null);
    } catch {
      setRestoreStatus("error");
      setRestoreError("Network error during restore.");
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
              hint="If set, Backup Now will also save the file here on the server in addition to downloading it."
            >
              <input
                id="backupDestinationPath"
                type="text"
                value={backupDestinationPath}
                onChange={(e) => setBackupDestinationPath(e.target.value)}
                className={INPUT_CLASS}
                placeholder="/srv/blackvault/backups or D:\\Backups\\BlackVault"
              />
              <p className="mt-1 text-xs text-vault-text-muted">
                When running in Docker, this path must be inside a mounted volume (e.g.{" "}
                <span className="font-mono">/app/data/backups</span>).
              </p>
            </FormField>

            {/* Backup Now */}
            <div className="rounded-lg border border-vault-border bg-vault-bg p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-vault-text">Backup Now</p>
                  <p className="mt-0.5 text-xs text-vault-text-muted">
                    Downloads a complete JSON backup of all vault data.
                    {backupDestinationPath && " Also saves to your configured destination."}
                  </p>
                </div>
                <StandardButton
                  type="button"
                  variant="primary"
                  onClick={handleBackupNow}
                  disabled={backupStatus === "loading"}
                  loading={backupStatus === "loading"}
                  loadingLabel="Backing up…"
                  icon={<HardDriveDownload className="h-4 w-4" />}
                >
                  Backup Now
                </StandardButton>
              </div>
              {backupStatus === "success" && backupResult && (
                <div className="rounded-md border border-[#00C853]/30 bg-[#00C853]/10 px-3 py-2 flex flex-col gap-0.5">
                  <p className="text-xs font-medium text-[#00C853]">Backup complete</p>
                  <p className="font-mono text-xs text-[#00C853]/80">{backupResult.filename}</p>
                  <p className="text-xs text-[#00C853]/70">{backupResult.sizeMB} MB</p>
                  {backupResult.savedToPath && (
                    <p className="text-xs text-[#00C853]/70">
                      Also saved to: <span className="font-mono">{backupResult.savedToPath}</span>
                    </p>
                  )}
                </div>
              )}
              {backupStatus === "error" && backupError && (
                <StatusMessage tone="error" message={backupError} />
              )}
            </div>

            {/* Restore from Backup */}
            <div className="rounded-lg border border-vault-border bg-vault-bg p-4 flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium text-vault-text">Restore from Backup</p>
                <p className="mt-0.5 text-xs text-vault-text-muted">
                  Replaces ALL current data with the contents of a backup file. This cannot be undone.
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <label
                  htmlFor="restore-file-input"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-vault-border bg-vault-surface px-3 py-2 text-sm text-vault-text-muted hover:text-vault-text transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  {pendingRestoreFile ? pendingRestoreFile.name : "Choose .json backup file"}
                </label>
                <input
                  id="restore-file-input"
                  type="file"
                  accept=".json,application/json"
                  className="sr-only"
                  onChange={handleRestoreFileChange}
                />
                {pendingRestoreFile && !showRestoreConfirm && restoreStatus === "idle" && (
                  <StandardButton
                    type="button"
                    variant="danger"
                    onClick={() => setShowRestoreConfirm(true)}
                    icon={<RotateCcw className="h-4 w-4" />}
                  >
                    Restore
                  </StandardButton>
                )}
              </div>
              {showRestoreConfirm && pendingRestoreFile && (
                <div className="rounded-lg border border-[#E53935]/30 bg-[#E53935]/10 p-3 flex flex-col gap-2">
                  <p className="text-sm font-medium text-[#E53935]">
                    This will wipe all current data and replace it with the backup. Are you sure?
                  </p>
                  <p className="text-xs text-[#E53935]/70">File: {pendingRestoreFile.name}</p>
                  <p className="text-xs text-[#E53935]/70">Do not navigate away while restore is in progress.</p>
                  <div className="flex gap-2">
                    <StandardButton
                      type="button"
                      variant="danger"
                      onClick={handleRestoreConfirm}
                      disabled={restoreStatus === "loading"}
                      loading={restoreStatus === "loading"}
                      loadingLabel="Restoring…"
                      icon={<RotateCcw className="h-4 w-4" />}
                    >
                      Yes, Restore
                    </StandardButton>
                    <StandardButton
                      type="button"
                      variant="secondary"
                      onClick={() => { setShowRestoreConfirm(false); setPendingRestoreFile(null); }}
                    >
                      Cancel
                    </StandardButton>
                  </div>
                </div>
              )}
              {restoreStatus === "loading" && (
                <p className="text-xs text-vault-text-muted">Restoring data, please wait…</p>
              )}
              {restoreStatus === "success" && restoreCounts && (
                <div className="rounded-md border border-[#00C853]/30 bg-[#00C853]/10 px-3 py-2 flex flex-col gap-0.5">
                  <p className="text-xs font-medium text-[#00C853]">Restore complete. Data has been replaced.</p>
                  <p className="text-xs text-[#00C853]/70">
                    {restoreCounts.firearms ?? 0} firearms · {restoreCounts.accessories ?? 0} accessories ·{" "}
                    {restoreCounts.ammoStocks ?? 0} ammo stocks · {restoreCounts.rangeSessions ?? 0} range sessions
                  </p>
                </div>
              )}
              {restoreStatus === "error" && restoreError && (
                <StatusMessage tone="error" message={restoreError} />
              )}
            </div>
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

            {isDocker && !manualHost && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-400">
                <p className="font-medium mb-1">Running in Docker — auto-detection unavailable</p>
                <p className="text-xs text-amber-400/80">
                  Enter your host machine&apos;s LAN IP above (e.g. <span className="font-mono">192.168.1.100</span>).
                  Find it with <span className="font-mono">ipconfig</span> (Windows) or <span className="font-mono">ifconfig</span> / <span className="font-mono">ip a</span> (Mac/Linux).
                </p>
              </div>
            )}

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

            {qrDataUrl && (
              <div className="flex flex-col items-center gap-2 mt-4">
                <img src={qrDataUrl} alt="QR code for mobile access" width={160} height={160} className="rounded-lg" />
                <p className="text-xs text-vault-text-faint">Scan to open on your phone</p>
              </div>
            )}
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
