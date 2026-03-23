"use client";

import { useMemo, useState } from "react";
import { Download, Eye, FileText, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  buildExportQueryString,
  type FullArmoryExportOptions,
  type FullArmoryExportResponse,
} from "@/lib/exports/full-armory";
import { generateFullArmoryPdf } from "@/lib/exports/full-armory-pdf";

const DEFAULT_OPTIONS: FullArmoryExportOptions = {
  preset: "CLAIMS",
  includeSerialNumbers: true,
  includeAmmo: true,
  includeValue: true,
  includeImages: true,
  includeDocuments: true,
  includePhotos: true,
  includeReceipts: true,
  imageMode: "PRIMARY_ONLY",
};

function downloadText(name: string, content: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function FullArmoryExportPage() {
  const [options, setOptions] = useState<FullArmoryExportOptions>(DEFAULT_OPTIONS);
  const [loading, setLoading] = useState(false);

  const queryString = useMemo(() => buildExportQueryString(options), [options]);

  function toggle<K extends keyof FullArmoryExportOptions>(key: K, value: FullArmoryExportOptions[K]) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  async function fetchPacket(): Promise<FullArmoryExportResponse> {
    const response = await fetch(`/api/exports/full-armory?${queryString}`);
    const json = await response.json();
    if (!response.ok) {
      throw new Error(json.error ?? "Failed to generate export");
    }
    return json;
  }

  async function handleJsonDownload() {
    setLoading(true);
    try {
      const packet = await fetchPacket();
      downloadText(
        `full-armory-export-${packet.meta.generatedAt.replace(/[:.]/g, "-")}.json`,
        JSON.stringify(packet, null, 2),
        "application/json;charset=utf-8"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCsvDownload() {
    setLoading(true);
    try {
      const packet = await fetchPacket();
      const stamp = packet.meta.generatedAt.replace(/[:.]/g, "-");
      downloadText(`full-armory-inventory-${stamp}.csv`, packet.csv.inventoryItems, "text/csv;charset=utf-8");
      if (options.includeDocuments) {
        downloadText(`full-armory-attachments-${stamp}.csv`, packet.csv.attachmentsIndex, "text/csv;charset=utf-8");
      }
      if (options.includeAmmo) {
        downloadText(`full-armory-ammo-${stamp}.csv`, packet.csv.ammoSummary, "text/csv;charset=utf-8");
      }
      if (options.preset === "BACKUP") {
        downloadText(`full-armory-backup-files-${stamp}.csv`, packet.csv.backupFiles, "text/csv;charset=utf-8");
      }
      downloadText(`full-armory-summary-${stamp}.csv`, packet.csv.valuationSummary, "text/csv;charset=utf-8");
    } finally {
      setLoading(false);
    }
  }

  async function handlePdfDownload() {
    setLoading(true);
    try {
      const packet = await fetchPacket();
      await generateFullArmoryPdf(packet, options);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      <PageHeader title="Full Armory Export" subtitle="V1 export packet with evidence and backup references." />

      <div className="p-6 max-w-4xl mx-auto space-y-5">
        <div className="rounded-xl border border-vault-border bg-vault-surface p-5 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-xs text-vault-text-muted space-y-1">
              <span className="uppercase tracking-widest">Preset</span>
              <select
                value={options.preset}
                onChange={(e) => toggle("preset", e.target.value === "BACKUP" ? "BACKUP" : "CLAIMS")}
                className="w-full bg-vault-bg border border-vault-border rounded px-3 py-2 text-sm text-vault-text"
              >
                <option value="CLAIMS">Claims</option>
                <option value="BACKUP">Backup</option>
              </select>
            </label>

            <label className="text-xs text-vault-text-muted space-y-1">
              <span className="uppercase tracking-widest">Image Appendix Mode</span>
              <select
                value={options.imageMode}
                onChange={(e) => toggle("imageMode", e.target.value === "ALL_IMAGES" ? "ALL_IMAGES" : "PRIMARY_ONLY")}
                className="w-full bg-vault-bg border border-vault-border rounded px-3 py-2 text-sm text-vault-text"
                disabled={!options.includeImages}
              >
                <option value="PRIMARY_ONLY">Primary Only</option>
                <option value="ALL_IMAGES">All Images</option>
              </select>
            </label>

            <div className="text-xs text-vault-text-faint rounded-md border border-vault-border bg-vault-bg p-3">
              <p className="uppercase tracking-widest mb-1">Preview Link</p>
              <a href={`/exports/full-armory/preview?${queryString}`} className="text-[#00C2FF] hover:underline break-all">
                /exports/full-armory/preview?{queryString}
              </a>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-vault-text-muted mb-2">Include In Export</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
              {([
                ["includeSerialNumbers", "Serial Numbers"],
                ["includeAmmo", "Ammo"],
                ["includeValue", "Value"],
                ["includeImages", "Images"],
                ["includeDocuments", "Documents"],
                ["includePhotos", "Item Photos"],
                ["includeReceipts", "Receipt Images"],
              ] as Array<[
                "includeSerialNumbers" | "includeAmmo" | "includeValue" | "includeImages" | "includeDocuments" | "includePhotos" | "includeReceipts",
                string
              ]>).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-vault-text">
                  <input
                    type="checkbox"
                    checked={Boolean(options[key])}
                    onChange={(e) => setOptions((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`/exports/full-armory/preview?${queryString}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-vault-border text-vault-text-muted hover:text-vault-text hover:bg-vault-bg text-sm"
            >
              <Eye className="w-4 h-4" />
              Open Preview
            </a>
            <button
              type="button"
              onClick={handleJsonDownload}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] text-sm hover:bg-[#00C2FF]/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download JSON
            </button>
            <button
              type="button"
              onClick={handleCsvDownload}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#00C853]/10 border border-[#00C853]/30 text-[#00C853] text-sm hover:bg-[#00C853]/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Download CSV
            </button>
            <button
              type="button"
              onClick={handlePdfDownload}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] text-sm hover:bg-[#F5A623]/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
