"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { DEFAULT_EXPORT_FIELDS } from "@/lib/exports/full-armory-fields";

export default function FullArmoryExportPage() {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [fields, setFields] = useState<string[]>([...DEFAULT_EXPORT_FIELDS]);
  const [loading, setLoading] = useState(false);

  async function runExport() {
    setLoading(true);
    try {
      const res = await fetch("/api/exports/full-armory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, fields }),
      });
      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = format === "csv" ? "full-armory-export.csv" : "full-armory-export.json";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full">
      <PageHeader title="FULL ARMORY EXPORT" subtitle="Choose fields and file format" />
      <div className="p-6 space-y-6">
        <div className="bg-vault-surface border border-vault-border rounded-lg p-4 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-vault-text-faint mb-2">File type</p>
            <select value={format} onChange={(e) => setFormat(e.target.value as "csv" | "json")} className="bg-vault-bg border border-vault-border rounded px-3 py-2 text-sm text-vault-text">
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-vault-text-faint mb-2">Fields</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DEFAULT_EXPORT_FIELDS.map((field) => {
                const checked = fields.includes(field);
                return (
                  <label key={field} className="text-sm text-vault-text flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setFields((prev) =>
                          e.target.checked ? [...prev, field] : prev.filter((f) => f !== field)
                        );
                      }}
                    />
                    {field}
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={runExport}
            disabled={loading || fields.length === 0}
            className="bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-60 px-4 py-2 rounded text-sm"
          >
            {loading ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
