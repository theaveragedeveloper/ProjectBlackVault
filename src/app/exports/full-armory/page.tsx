"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { buildExportQueryString, type FullArmoryExportOptions } from "@/lib/exports/full-armory";

const DEFAULT_OPTIONS: FullArmoryExportOptions = {
  preset: "CLAIMS",
  includeSerialNumbers: true,
  includeAmmo: true,
  includeValue: true,
  includeImages: true,
  includeDocuments: true,
};

export default function FullArmoryExportPage() {
  const [options, setOptions] = useState<FullArmoryExportOptions>(DEFAULT_OPTIONS);
  const [loadingFormat, setLoadingFormat] = useState<"csv" | "pdf" | null>(null);

  const previewHref = useMemo(
    () => `/exports/full-armory/preview?${buildExportQueryString(options)}`,
    [options]
  );

  function setToggle<K extends keyof FullArmoryExportOptions>(key: K, value: FullArmoryExportOptions[K]) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  type ToggleKey = Exclude<keyof FullArmoryExportOptions, "preset">;

  async function runExport(format: "csv" | "pdf") {
    setLoadingFormat(format);
    try {
      const query = buildExportQueryString(options, format);
      const response = await fetch(`/api/exports/full-armory?${query}`);
      if (!response.ok) return;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = format === "csv" ? "full-armory-export.csv" : "full-armory-export.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoadingFormat(null);
    }
  }

  return (
    <div className="min-h-full">
      <PageHeader title="FULL ARMORY EXPORT" subtitle="CSV + PDF export with explicit include controls" />
      <div className="p-6 space-y-6">
        <div className="bg-vault-surface border border-vault-border rounded-lg p-4 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-vault-text-faint mb-2">Preset</p>
            <select
              value={options.preset}
              onChange={(e) => setToggle("preset", e.target.value === "BACKUP" ? "BACKUP" : "CLAIMS")}
              className="bg-vault-bg border border-vault-border rounded px-3 py-2 text-sm text-vault-text"
            >
              <option value="CLAIMS">Claims (full detail)</option>
              <option value="BACKUP">Backup (masked serials)</option>
            </select>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-vault-text-faint mb-2">Include in export</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                ["includeSerialNumbers", "Serial Numbers"],
                ["includeAmmo", "Ammo"],
                ["includeValue", "Value"],
                ["includeImages", "Images"],
                ["includeDocuments", "Documents"],
              ].map(([key, label]) => {
                const optionKey = key as ToggleKey;
                return (
                  <label key={key} className="text-sm text-vault-text flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(options[optionKey])}
                      onChange={(e) => setToggle(optionKey, e.target.checked)}
                    />
                    {label}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runExport("csv")}
              disabled={loadingFormat !== null}
              className="bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-60 px-4 py-2 rounded text-sm"
            >
              {loadingFormat === "csv" ? "Exporting CSV..." : "Download CSV"}
            </button>
            <button
              type="button"
              onClick={() => runExport("pdf")}
              disabled={loadingFormat !== null}
              className="bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] hover:bg-[#F5A623]/20 disabled:opacity-60 px-4 py-2 rounded text-sm"
            >
              {loadingFormat === "pdf" ? "Exporting PDF..." : "Download PDF"}
            </button>
            <Link
              href={previewHref}
              className="px-4 py-2 rounded text-sm border border-vault-border text-vault-text hover:bg-vault-bg"
            >
              Open Preview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
