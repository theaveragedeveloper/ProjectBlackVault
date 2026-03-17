"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Lock,
  Eye,
  EyeOff,
  Settings,
  ShieldCheck,
  HardDrive,
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
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import {
  buildExportQueryString,
  type ExportImageMode,
  type FullArmoryExportOptions,
  type FullArmoryExportResponse,
} from "@/lib/exports/full-armory";
import { generateFullArmoryPdf } from "@/lib/exports/full-armory-pdf";
import { formatCurrency } from "@/lib/utils";

const INPUT_CLASS =
  "w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors";
const LABEL_CLASS =
  "block text-sm font-medium text-vault-text-muted mb-1.5";

interface AppSettings {
  id: string;
  appPassword: string | null;
  defaultCurrency: string;
  encryptionEnabled?: boolean;
  encryptionViaEnv?: boolean;
}

interface SystemInfo {
  dbPath: string;
  canonicalUrl: string | null;
  port: string;
  localIPs: string[];
}

export default function SettingsPage() {
  const settingsSections = useMemo(
    () => [
      { id: "security", label: "Security", icon: ShieldCheck },
      { id: "encryption", label: "Encryption", icon: Lock },
      { id: "system", label: "System", icon: HardDrive },
      { id: "backup", label: "Backup", icon: Archive },
    ] as const,
    []
  );

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [appPassword, setAppPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [passwordUnlocked, setPasswordUnlocked] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [exportPreset, setExportPreset] = useState<"CLAIMS" | "BACKUP">("CLAIMS");
  const [exportIncludePhotos, setExportIncludePhotos] = useState(true);
  const [exportIncludeReceipts, setExportIncludeReceipts] = useState(true);
  const [exportImageMode, setExportImageMode] = useState<ExportImageMode>("PRIMARY_ONLY");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportAction, setExportAction] = useState<"PDF" | "CSV" | null>(null);
  const [exportSummary, setExportSummary] = useState<FullArmoryExportResponse["summary"] | null>(null);
  const [exportSummaryBusy, setExportSummaryBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const [backupBusy, setBackupBusy] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [backupConfirm, setBackupConfirm] = useState("");
  const [backupActionPassword, setBackupActionPassword] = useState("");
  const [includeDocumentFilesInBackup, setIncludeDocumentFilesInBackup] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupIntervalMin, setAutoBackupIntervalMin] = useState(15);
  const [autoBackupStatus, setAutoBackupStatus] = useState<string | null>(null);
  const [autoBackupError, setAutoBackupError] = useState<string | null>(null);
  const [autoBackupRunning, setAutoBackupRunning] = useState(false);

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassphrase, setRestorePassphrase] = useState("");
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);
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
  const [keyCopied, setKeyCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showMainLinkHelp, setShowMainLinkHelp] = useState(false);
  const [showTroubleshootingLinks, setShowTroubleshootingLinks] = useState(false);
  const [activeSection, setActiveSection] = useState<(typeof settingsSections)[number]["id"]>("security");
  const networkPort = sysInfo?.port ?? "3000";
  const localHostUrl = `http://localhost:${networkPort}`;
  const mainLink = sysInfo?.canonicalUrl ?? localHostUrl;
  const mainLinkConfigured = Boolean(sysInfo?.canonicalUrl);
  const troubleshootingLinks = Array.from(
    new Set([
      localHostUrl,
      ...(sysInfo?.localIPs ?? []).map((ip) => `http://${ip}:${networkPort}`),
    ])
  );

  const exportOptions = useMemo<FullArmoryExportOptions>(
    () => ({
      preset: exportPreset,
      includePhotos: exportIncludePhotos,
      includeReceipts: exportIncludeReceipts,
      imageMode: exportImageMode,
    }),
    [exportPreset, exportIncludePhotos, exportIncludeReceipts, exportImageMode]
  );

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

  useEffect(() => {
    const controller = new AbortController();

    async function loadExportSummary() {
      setExportSummaryBusy(true);
      try {
        const query = buildExportQueryString({
          preset: exportPreset,
          includePhotos: true,
          includeReceipts: true,
          imageMode: "PRIMARY_ONLY",
        });
        const res = await fetch(`/api/exports/full-armory?${query}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "Failed to load export summary");
        }
        setExportSummary(json.summary ?? null);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setExportSummary(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setExportSummaryBusy(false);
        }
      }
    }

    void loadExportSummary();
    return () => controller.abort();
  }, [exportPreset]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setSaving(true);

    const payload: Record<string, unknown> = {};

    // Only include password in payload if no current password is set, or if the user has verified it
    if (!settings?.appPassword || passwordUnlocked) {
      payload.appPassword = appPassword || null;
      if (passwordUnlocked && currentPassword) {
        payload.currentPassword = currentPassword;
      }
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
        setSaveSuccess(true);
        setAppPassword("");
        setCurrentPassword("");
        setPasswordUnlocked(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerifyPassword() {
    setVerifyError(null);
    setVerifyingPassword(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: currentPassword }),
      });
      const json = await res.json();
      if (!res.ok) {
        setVerifyError(json.error ?? "Incorrect password");
      } else {
        setPasswordUnlocked(true);
        setVerifyError(null);
      }
    } catch {
      setVerifyError("Network error. Please try again.");
    } finally {
      setVerifyingPassword(false);
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

  function copyLink(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(url);
      setTimeout(() => setCopiedLink(null), 2000);
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

  async function fetchFullArmoryExport(options: FullArmoryExportOptions): Promise<FullArmoryExportResponse> {
    const query = buildExportQueryString(options);
    const res = await fetch(`/api/exports/full-armory?${query}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to generate export");
    return json as FullArmoryExportResponse;
  }

  function downloadCsvCompanion(payload: FullArmoryExportResponse) {
    const timestamp = payload.meta.generatedAt.replace(/[:.]/g, "-");
    const files: Array<{ name: string; content: string }> = [
      { name: `inventory-items-${timestamp}.csv`, content: payload.csv.inventoryItems ?? "" },
      { name: `attachments-index-${timestamp}.csv`, content: payload.csv.attachmentsIndex ?? "" },
      { name: `valuation-summary-${timestamp}.csv`, content: payload.csv.valuationSummary ?? "" },
    ];

    for (const file of files) {
      const blob = new Blob([file.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function handleDownloadExportPdf() {
    setExportBusy(true);
    setExportAction("PDF");
    setExportError(null);
    setExportSuccess(null);

    try {
      const payload = await fetchFullArmoryExport(exportOptions);
      await generateFullArmoryPdf(payload, exportOptions);
      setExportSuccess("PDF generated and downloaded.");
      setShowExportModal(false);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Failed to generate PDF export");
    } finally {
      setExportBusy(false);
      setExportAction(null);
    }
  }

  async function handleDownloadCsvExport() {
    setExportBusy(true);
    setExportAction("CSV");
    setExportError(null);
    setExportSuccess(null);

    try {
      const payload = await fetchFullArmoryExport(exportOptions);
      downloadCsvCompanion(payload);
      setExportSuccess("CSV companion files downloaded.");
      setShowExportModal(false);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Failed to download CSV companion files");
    } finally {
      setExportBusy(false);
      setExportAction(null);
    }
  }

  function handleOpenExportPreview() {
    setExportError(null);
    setExportSuccess(null);
    const query = buildExportQueryString(exportOptions);
    const preview = window.open(`/exports/full-armory/preview?${query}`, "_blank");
    if (!preview) {
      setExportError("Popup blocked. Please allow popups and try again.");
      return;
    }
    preview.opener = null;
    setExportSuccess("Opened print preview in a new tab.");
    setShowExportModal(false);
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

  function buildSensitiveActionHeaders() {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (backupActionPassword) headers["x-vault-password"] = backupActionPassword;
    return headers;
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
        headers: buildSensitiveActionHeaders(),
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

  async function handleRestoreBackup() {
    setRestoreError(null);
    setRestoreSuccess(null);

    if (!restoreFile) {
      setRestoreError("Please choose a .bvault backup file.");
      return;
    }
    if (!restorePassphrase) {
      setRestoreError("Please enter the backup passphrase.");
      return;
    }
    if (!restoreConfirmed) {
      setRestoreError("Please confirm that you understand this will replace all existing data.");
      return;
    }

    setRestoreBusy(true);
    try {
      // Read file
      const arrayBuffer = await restoreFile.arrayBuffer();
      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(new TextDecoder().decode(arrayBuffer));
      } catch {
        throw new Error("File is not valid JSON. Make sure you selected a .bvault file.");
      }

      if (parsed.type !== "blackvault-encrypted-backup") {
        throw new Error("This file does not appear to be a ProjectBlackVault backup.");
      }

      // Decrypt using Web Crypto API
      const kdf = parsed.kdf as Record<string, unknown>;
      const cipher = parsed.cipher as Record<string, unknown>;

      const salt = Uint8Array.from(atob(kdf.salt as string), (c) => c.charCodeAt(0));
      const iv   = Uint8Array.from(atob(cipher.iv as string), (c) => c.charCodeAt(0));
      const ciphertext = Uint8Array.from(atob(cipher.ciphertext as string), (c) => c.charCodeAt(0));

      // Server-side backups have a separate auth tag; client-side ones append it to ciphertext
      let decryptInput: Uint8Array;
      if (cipher.tag) {
        const tag = Uint8Array.from(atob(cipher.tag as string), (c) => c.charCodeAt(0));
        decryptInput = new Uint8Array([...ciphertext, ...tag]);
      } else {
        decryptInput = ciphertext;
      }

      const keyMaterial = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(restorePassphrase),
        "PBKDF2",
        false,
        ["deriveKey"]
      );
      const aesKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", hash: "SHA-256", salt, iterations: kdf.iterations as number },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );

      let decrypted: ArrayBuffer;
      try {
        decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, decryptInput);
      } catch {
        throw new Error("Decryption failed. Check that your passphrase is correct.");
      }

      const backupJson = JSON.parse(new TextDecoder().decode(decrypted)) as Record<string, unknown>;

      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: buildSensitiveActionHeaders(),
        body: JSON.stringify(backupJson),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Restore failed");

      const counts = json.restored as Record<string, number>;
      const summary = [
        counts.firearms && `${counts.firearms} firearms`,
        counts.accessories && `${counts.accessories} accessories`,
        counts.rangeSessions && `${counts.rangeSessions} range sessions`,
        counts.ammoStocks && `${counts.ammoStocks} ammo stocks`,
      ]
        .filter(Boolean)
        .join(", ");

      setRestoreSuccess(
        `Vault restored — ${summary || "data restored"}. Reload the page to see your data.`
      );
      setRestoreFile(null);
      setRestorePassphrase("");
      setRestoreConfirmed(false);
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : "Restore failed");
    } finally {
      setRestoreBusy(false);
    }
  }

  async function handlePullUpdates() {
    setUpdateBusy(true);
    setUpdateError(null);
    setUpdateOutput(null);

    try {
      const statusRes = await fetch("/api/system-update");
      const statusJson = (await statusRes.json()) as Record<string, unknown>;
      const metadata = (statusJson.metadata ?? null) as Record<string, unknown> | null;
      const currentVersion = typeof metadata?.currentVersion === "string" ? metadata.currentVersion : "unknown";
      const latestVersion = typeof metadata?.latestVersion === "string" ? metadata.latestVersion : null;
      const checkedAt = typeof metadata?.checkedAt === "string" ? metadata.checkedAt : null;
      const checkedAtLine = checkedAt ? `Checked: ${new Date(checkedAt).toLocaleString()}` : null;
      const statusLines = [
        `Current: ${currentVersion}`,
        latestVersion ? `Latest: ${latestVersion}` : null,
        checkedAtLine,
      ]
        .filter(Boolean)
        .join("\n");

      const statusError = typeof statusJson.error === "string" ? statusJson.error : null;
      const statusMessage = typeof statusJson.message === "string" ? statusJson.message : null;
      const statusRecommendation = typeof statusJson.recommendation === "string" ? statusJson.recommendation : null;
      const statusDetails = typeof statusJson.details === "string" ? statusJson.details : null;

      if (!statusRes.ok) {
        const failureParts = [
          statusError ?? "Failed to check update status.",
          statusMessage,
          statusRecommendation,
          statusDetails,
        ].filter(Boolean);
        setUpdateError(failureParts.join("\n\n"));
        return;
      }

      if (typeof statusJson.unsupported === "string") {
        const unsupportedParts = [
          statusLines || null,
          statusMessage,
          statusJson.unsupported,
          statusRecommendation,
        ].filter(Boolean);
        setUpdateOutput(unsupportedParts.join("\n\n"));
        return;
      }

      if (!statusJson.writable) {
        const nonWritableParts = [
          statusLines || null,
          statusMessage ??
            "Update command execution is disabled. Set SYSTEM_UPDATE_EXEC_ENABLED=true (or unset it) to enable this button.",
          statusRecommendation,
        ].filter(Boolean);
        setUpdateOutput(nonWritableParts.join("\n\n"));
        return;
      }

      const updateRes = await fetch("/api/system-update", { method: "POST" });
      const updateJson = (await updateRes.json()) as Record<string, unknown>;

      if (!updateRes.ok) {
        const updateError = typeof updateJson.error === "string" ? updateJson.error : "Failed to update application.";
        const updateMessage = typeof updateJson.message === "string" ? updateJson.message : null;
        const updateRecommendation = typeof updateJson.recommendation === "string" ? updateJson.recommendation : null;
        const updateDetails = typeof updateJson.details === "string" ? updateJson.details : null;
        const failureParts = [updateError, updateMessage, updateRecommendation, updateDetails].filter(Boolean);
        setUpdateError(failureParts.join("\n\n"));
        return;
      }

      const updateMetadata = (updateJson.metadata ?? {}) as Record<string, unknown>;
      const updatedCurrentVersion = typeof updateMetadata.currentVersion === "string" ? updateMetadata.currentVersion : "unknown";
      const updatedLatestVersion = typeof updateMetadata.latestVersion === "string" ? updateMetadata.latestVersion : null;
      const updatedCheckedAt = typeof updateMetadata.checkedAt === "string" ? updateMetadata.checkedAt : null;
      const updatedCheckedAtLine = updatedCheckedAt ? `Checked: ${new Date(updatedCheckedAt).toLocaleString()}` : null;

      const versionLines = [
        `Current: ${updatedCurrentVersion}`,
        updatedLatestVersion ? `Latest: ${updatedLatestVersion}` : null,
        updatedCheckedAtLine,
        updateJson.changed === true
          ? "\nUpdate applied. Restart BlackVault if your process manager does not auto-reload."
          : updateJson.changed === false
            ? "\nUpdate command completed. Already on latest commit."
            : "\nUpdate command completed. Revision comparison is unavailable in this deployment.",
      ]
        .filter(Boolean)
        .join("\n");

      const commandOutput = typeof updateJson.output === "string" ? updateJson.output : "No command output available.";
      setUpdateOutput(`${versionLines}\n\n${commandOutput}`);
    } catch {
      setUpdateError("Network error. Please try again.");
    } finally {
      setUpdateBusy(false);
    }
  }

  function handleQuickSetupNavigate(anchor: string) {
    if (typeof window === "undefined") return;
    const target = document.querySelector(anchor);
    if (!(target instanceof HTMLElement)) return;

    target.scrollIntoView({ behavior: "smooth", block: "start" });

    // If this section is part of a collapsible/accordion UI, try to expand it.
    const collapsedTrigger = target.querySelector<HTMLElement>(
      'button[aria-expanded="false"], [role="button"][aria-expanded="false"]'
    );
    collapsedTrigger?.click();
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visibleEntries[0]?.target.id) {
          setActiveSection(visibleEntries[0].target.id as (typeof settingsSections)[number]["id"]);
        }
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.2, 0.4, 0.6] }
    );
    const sectionElements = settingsSections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));
    sectionElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [settingsSections]);

  useEffect(() => {
    function scrollToHashSection() {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      const targetSection = settingsSections.find((section) => section.id === hash);
      if (!targetSection) return;
      setActiveSection(targetSection.id);
      document.getElementById(targetSection.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const timer = window.setTimeout(scrollToHashSection, 0);
    window.addEventListener("hashchange", scrollToHashSection);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", scrollToHashSection);
    };
  }, [settingsSections]);

  function scrollToSection(sectionId: (typeof settingsSections)[number]["id"]) {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const wizardSteps = [
    {
      title: "Secure Access",
      description: "Set an app password so the vault is protected on startup.",
      done: !!settings?.appPassword,
      anchor: "#security",
    },
    {
      title: "Encryption",
      description: "Enable encryption at rest and save your encryption key offline.",
      done: !!settings?.encryptionEnabled,
      anchor: "#encryption",
    },
    {
      title: "Backups",
      description: "Create your first encrypted .bvault backup with document files included.",
      done: !!backupSuccess,
      anchor: "#backup",
    },
    {
      title: "Auto-Backup",
      description: "Enable automatic backup checks to protect new changes automatically.",
      done: autoBackupEnabled,
      anchor: "#backup",
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
            <h1 className="text-2xl font-semibold leading-tight text-vault-text">Settings</h1>
            <p className="text-sm text-vault-text-muted mt-1">Manage security, backups, and system preferences.</p>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 border-b border-vault-border bg-vault-bg/95 backdrop-blur supports-[backdrop-filter]:bg-vault-bg/80">
        <div className="max-w-2xl mx-auto px-6 py-3">
          <div className="flex gap-2 overflow-x-auto md:overflow-visible md:flex-wrap">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => scrollToSection(section.id)}
                  className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium tracking-wide transition-colors ${isActive ? "border-[#00C2FF]/40 bg-[#00C2FF]/10 text-[#00C2FF]" : "border-vault-border text-vault-text-faint hover:text-vault-text hover:border-vault-text-muted/40"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {section.label}
                </button>
              );
            })}
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

        <div className="mb-6 rounded-lg border border-vault-border bg-vault-surface p-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-[#00C2FF]" />
              <p className="text-sm font-semibold text-[#00C2FF]">Quick Setup</p>
            </div>
            <p className="text-xs text-vault-text-muted">{completedWizardSteps}/{wizardSteps.length} complete</p>
          </div>
          <div className="h-1.5 rounded bg-vault-border overflow-hidden">
            <div className="h-full bg-[#00C2FF] transition-all" style={{ width: `${(completedWizardSteps / wizardSteps.length) * 100}%` }} />
          </div>
          <div className="space-y-2">
            {wizardSteps.map((step, idx) => (
              <div
                key={step.title}
                className={`rounded-md border px-3 py-2 ${step.done ? "border-vault-border bg-vault-bg" : "border-[#F5A623]/40 bg-[#F5A623]/10"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-xs font-medium ${step.done ? "text-vault-text" : "text-[#F5A623]"}`}>
                      {idx + 1}. {step.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-vault-text-faint">{step.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickSetupNavigate(step.anchor)}
                    className="shrink-0 text-[11px] text-[#00C2FF] hover:text-[#00C2FF]/80 underline underline-offset-2"
                  >
                    Go to section
                  </button>
                </div>
                {!step.done && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest text-[#F5A623]">
                    <TriangleAlert className="h-3 w-3" />
                    Action needed
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* ── Security ────────────────────────────────────── */}
          <fieldset id="security" className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-5 scroll-mt-24">
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

            {settings?.appPassword && !passwordUnlocked ? (
              <div className="space-y-3">
                <div>
                  <label className={LABEL_CLASS}><Lock className="w-3 h-3 inline mr-1" />Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (currentPassword) handleVerifyPassword(); } }}
                      placeholder="Enter your current password to continue"
                      className={`${INPUT_CLASS} pr-10`}
                      autoComplete="current-password"
                    />
                    <button type="button" onClick={() => setShowCurrentPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-vault-text-faint hover:text-vault-text-muted">
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {verifyError && (
                    <p className="text-xs text-[#E53935] mt-1">{verifyError}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleVerifyPassword}
                  disabled={verifyingPassword || !currentPassword}
                  className="flex items-center gap-2 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 px-4 py-2 text-xs font-medium text-[#00C2FF] hover:bg-[#00C2FF]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifyingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                  Verify Password
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {passwordUnlocked && (
                  <div className="flex items-center gap-2 text-xs text-[#00C853]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Password verified — you can now view or change the password.
                  </div>
                )}
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
                  <p className="text-xs text-vault-text-faint mt-1">Min 8 characters. This is a simple access restriction, not end-to-end encryption.</p>
                </div>
              </div>
            )}
          </fieldset>

          {/* ── Encryption at Rest ──────────────────────────── */}
          <fieldset id="encryption" className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4 scroll-mt-24">
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

                {/* Key backup warning */}
                <div className="flex items-start gap-2 bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-md px-4 py-3">
                  <TriangleAlert className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-[#F5A623] font-semibold">Back up your encryption key</p>
                    <p className="text-xs text-vault-text-muted mt-0.5 leading-relaxed">
                      If you lose your encryption key, encrypted data (serial numbers, notes) will be permanently unreadable. Store your key in a secure, offline location.
                    </p>
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
                    <div className="bg-vault-bg border border-vault-border rounded-md px-4 py-3">
                      <p className="text-xs text-vault-text-muted leading-relaxed">
                        For security, full encryption key retrieval is disabled after setup. Keep your key backup from initial creation or your own secure records.
                      </p>
                    </div>

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
          <fieldset id="system" className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4 scroll-mt-24">
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

              <div className="rounded-md border border-vault-border bg-vault-bg px-4 py-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] text-[#00C2FF] font-mono mb-1">How to Open BlackVault</p>
                    <p className="text-xs text-vault-text-faint leading-relaxed">
                      Use this main link on all devices so everyone opens the same address.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMainLinkHelp((v) => !v)}
                    className="shrink-0 p-1.5 text-vault-text-faint hover:text-[#00C2FF] rounded transition-colors"
                    aria-expanded={showMainLinkHelp}
                    title="Show setup help"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 rounded-md border border-vault-border bg-vault-surface px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-widest text-vault-text-faint mb-0.5">Main Link</p>
                    <code className="text-xs font-mono text-vault-text break-all">{mainLink}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyLink(mainLink)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded border border-vault-border px-2.5 py-1.5 text-[11px] text-vault-text-faint hover:text-[#00C2FF] hover:border-[#00C2FF]/40 transition-colors"
                  >
                    {copiedLink === mainLink ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedLink === mainLink ? "Copied" : "Copy Link"}
                  </button>
                </div>

                <p className="text-xs text-vault-text-faint leading-relaxed">
                  {mainLinkConfigured
                    ? "Main link is set up. Share this link with everyone who uses BlackVault."
                    : "Main link not set up yet. BlackVault is using a local link for now."}
                </p>

                {showMainLinkHelp && (
                  <div className="rounded-md border border-[#00C2FF]/25 bg-[#00C2FF]/5 px-3 py-3 space-y-2">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#00C2FF]">Set Up Main Link</p>
                    <ol className="space-y-1.5 text-xs text-vault-text-muted list-decimal pl-4">
                      <li>Choose a web address you want everyone to use (example: <code className="font-mono">https://vault.yourdomain.com</code>).</li>
                      <li>Open your <code className="font-mono">.blackvault.env</code> file and set <code className="font-mono">APP_BASE_URL</code> to that address.</li>
                      <li>Restart BlackVault so the change is applied.</li>
                      <li>Come back to this page and confirm the Main Link above changed to your web address.</li>
                      <li>Install from that same link: Chrome/Edge <span className="font-medium">Install App</span>, Safari (macOS) <span className="font-medium">File → Add to Dock</span>.</li>
                    </ol>
                  </div>
                )}

                <div className="rounded-md border border-vault-border bg-vault-surface">
                  <button
                    type="button"
                    onClick={() => setShowTroubleshootingLinks((v) => !v)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left"
                    aria-expanded={showTroubleshootingLinks}
                  >
                    <span className="text-xs text-vault-text-muted">Troubleshooting links</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-vault-text-faint transition-transform ${showTroubleshootingLinks ? "rotate-180" : ""}`} />
                  </button>

                  {showTroubleshootingLinks && (
                    <div className="border-t border-vault-border px-3 py-2 space-y-2">
                      {troubleshootingLinks.map((url) => (
                        <div key={url} className="flex items-center gap-2 rounded border border-vault-border bg-vault-bg px-2.5 py-2">
                          <code className="text-xs font-mono text-vault-text-faint break-all flex-1">{url}</code>
                          <button
                            type="button"
                            onClick={() => copyLink(url)}
                            className="shrink-0 p-1.5 text-vault-text-faint hover:text-[#00C2FF] rounded transition-colors"
                            title="Copy link"
                          >
                            {copiedLink === url ? <CheckCircle2 className="w-3.5 h-3.5 text-[#00C853]" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </fieldset>

          {/* ── GitHub Updates ─────────────────────────────── */}
          <fieldset className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
              <DownloadCloud className="w-3.5 h-3.5" />
              GitHub Updates
            </legend>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Run the configured update command to pull and apply the newest version on this host. Source-checkout installs use git mode by default; container installs can set <code className="font-mono">SYSTEM_UPDATE_MODE=docker</code> with a host-level <code className="font-mono">SYSTEM_UPDATE_COMMAND</code>. If in-app updates are unsupported, use <code className="font-mono">./update.sh</code> or <code className="font-mono">update.bat</code> on the host.
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
                  <p className="text-xs text-[#00C853]">Update command completed.</p>
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
              {updateBusy ? "Applying update..." : "Update Now"}
            </button>

            <p className="text-[11px] text-vault-text-faint">
              By default this executes <code className="font-mono">git pull --ff-only</code>. Override <code className="font-mono">SYSTEM_UPDATE_COMMAND</code>, optional <code className="font-mono">SYSTEM_UPDATE_POST_COMMAND</code>, and <code className="font-mono">SYSTEM_UPDATE_TIMEOUT_MS</code> for custom deployment behavior.
            </p>
          </fieldset>

          {/* ── Full Armory Export ─────────────────────────── */}
          <fieldset id="backup" className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4 scroll-mt-24">
            <legend className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#00C2FF]">
              <FileText className="w-3.5 h-3.5" />
              Full Armory Export
            </legend>

            <p className="text-xs text-vault-text-muted leading-relaxed">
              Build an adjuster-ready packet with a direct PDF export, print preview mode, and optional CSV companion files.
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
              <p className="text-[10px] text-vault-text-faint font-mono uppercase tracking-widest">Evidence Readiness Snapshot</p>
              {exportSummaryBusy ? (
                <div className="text-xs text-vault-text-faint flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading current counts...
                </div>
              ) : exportSummary ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-md border border-vault-border px-3 py-2">
                    <p className="text-[10px] text-vault-text-faint">Missing Receipts</p>
                    <p className="text-sm font-semibold text-vault-text">{exportSummary.missingEvidence.missingReceipts}</p>
                  </div>
                  <div className="rounded-md border border-vault-border px-3 py-2">
                    <p className="text-[10px] text-vault-text-faint">Missing Photos</p>
                    <p className="text-sm font-semibold text-vault-text">{exportSummary.missingEvidence.missingPhotos}</p>
                  </div>
                  <div className="rounded-md border border-vault-border px-3 py-2">
                    <p className="text-[10px] text-vault-text-faint">Missing Values</p>
                    <p className="text-sm font-semibold text-vault-text">{exportSummary.missingEvidence.missingValues}</p>
                  </div>
                  <div className="rounded-md border border-vault-border px-3 py-2">
                    <p className="text-[10px] text-vault-text-faint">Missing Serials</p>
                    <p className="text-sm font-semibold text-vault-text">{exportSummary.missingEvidence.missingSerials}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-vault-text-faint">Unable to load summary counters right now.</p>
              )}
            </div>

            <div className="bg-vault-bg border border-vault-border rounded-md p-4 space-y-3">
              <p className="text-[10px] text-vault-text-faint font-mono uppercase tracking-widest">Default Export Profile</p>
              <ul className="space-y-1.5 text-xs text-vault-text-muted">
                <li>• Preset: `{exportPreset}` ({exportPreset === "CLAIMS" ? "full serial detail" : "masked serials"}).</li>
                <li>• Include item photos: {exportIncludePhotos ? "Yes" : "No"}.</li>
                <li>• Include receipt images: {exportIncludeReceipts ? "Yes" : "No"}.</li>
                <li>• Image depth mode: {exportImageMode === "PRIMARY_ONLY" ? "Primary only" : "All images"}.</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowExportModal(true)}
                disabled={exportBusy}
                className="flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {exportBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                Configure & Export
              </button>
              <p className="text-xs text-vault-text-faint">Choose PDF download, print preview, and CSV companion options.</p>
            </div>

            <p className="text-xs text-vault-text-faint">
              Specification reference: <code className="font-mono">docs/full-armory-export-format.md</code>
            </p>
          </fieldset>

          {showExportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="absolute inset-0 bg-black/70"
                aria-label="Close export configuration dialog"
              />
              <div className="relative z-10 w-full max-w-2xl rounded-lg border border-vault-border bg-vault-surface p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-vault-text">Configure Full Armory Export</h3>
                    <p className="text-xs text-vault-text-muted mt-1">
                      Select how the packet should be prepared for adjuster review.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExportModal(false)}
                    className="rounded-md border border-vault-border p-1.5 text-vault-text-faint hover:text-vault-text"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-vault-text-faint font-mono uppercase tracking-widest">Preset</p>
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
                      <p className="text-[11px] mt-1">Full serial numbers and maximum claim detail.</p>
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
                      <p className="text-[11px] mt-1">Masks serial numbers for safer sharing.</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-vault-text-faint font-mono uppercase tracking-widest">Evidence Toggles</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="rounded-md border border-vault-border px-3 py-2 flex items-center gap-2 text-xs text-vault-text-muted">
                      <input
                        type="checkbox"
                        checked={exportIncludePhotos}
                        onChange={(e) => setExportIncludePhotos(e.target.checked)}
                        className="accent-[#00C2FF]"
                      />
                      Include item photos
                    </label>
                    <label className="rounded-md border border-vault-border px-3 py-2 flex items-center gap-2 text-xs text-vault-text-muted">
                      <input
                        type="checkbox"
                        checked={exportIncludeReceipts}
                        onChange={(e) => setExportIncludeReceipts(e.target.checked)}
                        className="accent-[#00C2FF]"
                      />
                      Include receipt images
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-vault-text-faint font-mono uppercase tracking-widest">Image Depth</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportImageMode("PRIMARY_ONLY")}
                      className={`rounded-md border px-3 py-2 text-left transition-colors ${
                        exportImageMode === "PRIMARY_ONLY"
                          ? "border-[#00C2FF]/40 bg-[#00C2FF]/10 text-[#00C2FF]"
                          : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/30"
                      }`}
                    >
                      <p className="text-xs font-medium">Primary only</p>
                      <p className="text-[11px] mt-1">One image per evidence group for compact output.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportImageMode("ALL_IMAGES")}
                      className={`rounded-md border px-3 py-2 text-left transition-colors ${
                        exportImageMode === "ALL_IMAGES"
                          ? "border-[#00C2FF]/40 bg-[#00C2FF]/10 text-[#00C2FF]"
                          : "border-vault-border text-vault-text-muted hover:border-vault-text-muted/30"
                      }`}
                    >
                      <p className="text-xs font-medium">All images</p>
                      <p className="text-[11px] mt-1">Embed every eligible image receipt/photo.</p>
                    </button>
                  </div>
                </div>

                {exportSummary && (
                  <div className="rounded-md border border-vault-border bg-vault-bg p-3 text-xs text-vault-text-muted">
                    <p>
                      Current totals: {exportSummary.totalItems} items, {formatCurrency(exportSummary.totalPurchaseValue)} purchase value,
                      {` ${formatCurrency(exportSummary.totalReplacementValue)}`} replacement value.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadExportPdf}
                    disabled={exportBusy}
                    className="inline-flex items-center gap-2 rounded-md border border-[#00C2FF]/30 bg-[#00C2FF]/10 px-3 py-2 text-xs text-[#00C2FF] disabled:opacity-60"
                  >
                    {exportBusy && exportAction === "PDF" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DownloadCloud className="h-3.5 w-3.5" />}
                    {exportBusy && exportAction === "PDF" ? "Generating PDF..." : "Download PDF"}
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenExportPreview}
                    disabled={exportBusy}
                    className="inline-flex items-center gap-2 rounded-md border border-vault-border px-3 py-2 text-xs text-vault-text-muted disabled:opacity-60"
                  >
                    Open Print Preview
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCsvExport}
                    disabled={exportBusy}
                    className="inline-flex items-center gap-2 rounded-md border border-vault-border px-3 py-2 text-xs text-vault-text-muted disabled:opacity-60"
                  >
                    {exportBusy && exportAction === "CSV" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {exportBusy && exportAction === "CSV" ? "Downloading CSV..." : "Download CSV Companion"}
                  </button>
                </div>
              </div>
            </div>
          )}

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

              <label className={LABEL_CLASS}>App Password (Step-up for export/restore)</label>
              <input
                type="password"
                value={backupActionPassword}
                onChange={(e) => setBackupActionPassword(e.target.value)}
                placeholder="Required if app password is enabled"
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

          {/* ── Restore from Backup ─────────────────────────── */}
          <div className="bg-vault-surface border border-vault-border rounded-lg p-5 space-y-4">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-vault-text-muted mb-1">Restore from Backup</p>
              <p className="text-xs text-vault-text-faint">Decrypt and restore a <code className="font-mono">.bvault</code> backup file. All existing vault data will be permanently replaced.</p>
            </div>

            {restoreError && (
              <div className="flex items-start gap-2 bg-[#E53935]/10 border border-[#E53935]/30 rounded-md p-3">
                <AlertCircle className="w-4 h-4 text-[#E53935] mt-0.5 shrink-0" />
                <p className="text-xs text-[#E53935]">{restoreError}</p>
              </div>
            )}
            {restoreSuccess && (
              <div className="flex items-start gap-2 bg-[#00C853]/10 border border-[#00C853]/30 rounded-md p-3">
                <CheckCircle2 className="w-4 h-4 text-[#00C853] mt-0.5 shrink-0" />
                <p className="text-xs text-[#00C853]">{restoreSuccess}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className={LABEL_CLASS}>Backup File</label>
                <input
                  type="file"
                  accept=".bvault,.json"
                  className="block w-full text-xs text-vault-text-faint file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-vault-border file:bg-vault-surface file:text-xs file:text-vault-text-muted file:cursor-pointer cursor-pointer"
                  onChange={(e) => setRestoreFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <div>
                <label className={LABEL_CLASS}>Backup Passphrase</label>
                <input
                  type="password"
                  className={INPUT_CLASS}
                  value={restorePassphrase}
                  onChange={(e) => setRestorePassphrase(e.target.value)}
                  placeholder="Passphrase used when this backup was created"
                />
              </div>

              <button
                type="button"
                onClick={() => setRestoreConfirmed((v) => !v)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md border transition-all ${restoreConfirmed ? "border-[#E53935]/40 bg-[#E53935]/5" : "border-vault-border hover:border-vault-text-muted/20"}`}
              >
                <div className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${restoreConfirmed ? "bg-[#E53935]" : "bg-vault-border"}`}>
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${restoreConfirmed ? "left-4" : "left-0.5"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-vault-text">I understand this will replace all existing data</p>
                  <p className="text-xs text-vault-text-faint mt-0.5">This cannot be undone. Create a backup of your current data first if needed.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleRestoreBackup}
                disabled={restoreBusy || !restoreFile || !restorePassphrase || !restoreConfirmed}
                className="flex items-center justify-center gap-2 w-full bg-[#E53935]/10 border border-[#E53935]/30 text-[#E53935] hover:bg-[#E53935]/20 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2.5 rounded-md text-sm font-medium transition-colors"
              >
                {restoreBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {restoreBusy ? "Restoring Vault..." : "Restore Vault"}
              </button>
            </div>
          </div>

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

          <div className="pt-3 border-t border-vault-border">
            <p className="text-[11px] leading-relaxed text-vault-text-faint">
              Data Responsibility Notice: You are solely responsible for all data you create, upload, store, or share through this app, including keeping your own backups. To the maximum extent permitted by law, we are not liable for any data loss, corruption, unauthorized access, or damages related to your data or use of the app.
            </p>
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
