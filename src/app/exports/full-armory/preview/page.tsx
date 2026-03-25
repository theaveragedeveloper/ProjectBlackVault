"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Printer, RefreshCw } from "lucide-react";
import {
  buildExportQueryString,
  parseExportOptionsFromSearchParams,
  selectVisualEvidence,
  type FullArmoryExportResponse,
} from "@/lib/exports/full-armory";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function FullArmoryPreviewPage() {
  const [queryString, setQueryString] = useState("");
  const [data, setData] = useState<FullArmoryExportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQueryString(window.location.search.replace(/^\?/, ""));
  }, []);

  const options = useMemo(
    () => parseExportOptionsFromSearchParams(new URLSearchParams(queryString)),
    [queryString]
  );

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const query = buildExportQueryString(options);
        const response = await fetch(`/api/exports/full-armory?${query}`, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json.error ?? "Failed to load export preview");
        }
        setData(json);
      } catch (loadError) {
        if ((loadError as Error).name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load export preview");
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [options]);

  const visuals = useMemo(() => {
    if (!data) return [];
    return selectVisualEvidence(data, options);
  }, [data, options]);

  if (loading) {
    return (
      <main className="min-h-screen bg-vault-bg text-vault-text px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-lg border border-vault-border bg-vault-surface p-6 flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading export preview...
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-vault-bg text-vault-text px-4 py-10">
        <div className="mx-auto max-w-4xl rounded-lg border border-[#E53935]/30 bg-[#E53935]/10 p-6 space-y-3">
          <p className="text-sm text-[#E53935]">{error ?? "Unable to load preview"}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-md border border-vault-border bg-vault-surface px-3 py-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-vault-bg text-vault-text px-4 py-8">
      <div className="armory-preview-print mx-auto max-w-5xl space-y-5">
        <section className="print:hidden rounded-lg border border-vault-border bg-vault-surface p-4 flex flex-wrap gap-2 items-center justify-between">
          <div>
            <p className="text-xs text-vault-text-faint uppercase tracking-widest font-mono">Preview Mode</p>
            <p className="text-sm text-vault-text-muted">
              Ready for insurance adjuster review. Use your browser print flow to save this page as a PDF.
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md border border-[#00C2FF]/30 bg-[#00C2FF]/10 px-3 py-2 text-xs text-[#00C2FF]"
          >
            <Printer className="h-3.5 w-3.5" />
            Print / Save PDF
          </button>
        </section>

        <section className="rounded-lg border border-vault-border bg-vault-surface p-5">
          <h1 className="text-lg font-semibold text-vault-text">Full Armory Export</h1>
          <p className="text-xs text-vault-text-faint mt-1">Generated {new Date(data.meta.generatedAt).toLocaleString()}</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-md border border-vault-border bg-vault-bg p-3">
              <p className="text-vault-text-faint">Preset</p>
              <p className="font-semibold text-vault-text">{data.meta.preset}</p>
            </div>
            <div className="rounded-md border border-vault-border bg-vault-bg p-3">
              <p className="text-vault-text-faint">Total Items</p>
              <p className="font-semibold text-vault-text">{data.summary.totalItems}</p>
            </div>
            <div className="rounded-md border border-vault-border bg-vault-bg p-3">
              <p className="text-vault-text-faint">Purchase Total</p>
              <p className="font-semibold text-vault-text">{formatCurrency(data.summary.totalPurchaseValue)}</p>
            </div>
            <div className="rounded-md border border-vault-border bg-vault-bg p-3">
              <p className="text-vault-text-faint">Replacement Total</p>
              <p className="font-semibold text-vault-text">{formatCurrency(data.summary.totalReplacementValue)}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-1 rounded border border-vault-border">Serials: {options.includeSerialNumbers ? "Included" : "Hidden"}</span>
            <span className="px-2 py-1 rounded border border-vault-border">Ammo: {options.includeAmmo ? "Included" : "Excluded"}</span>
            <span className="px-2 py-1 rounded border border-vault-border">Value: {options.includeValue ? "Included" : "Excluded"}</span>
            <span className="px-2 py-1 rounded border border-vault-border">Images: {options.includeImages ? "Included" : "Excluded"}</span>
            <span className="px-2 py-1 rounded border border-vault-border">Documents: {options.includeDocuments ? "Included" : "Excluded"}</span>
          </div>
        </section>

        <section className="rounded-lg border border-vault-border bg-vault-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-vault-text-muted">Evidence Readiness</h2>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-md border border-vault-border bg-vault-bg p-3">
              <p className="text-[11px] text-vault-text-faint">Missing Receipts</p>
              <p className="text-base font-semibold">{data.summary.missingEvidence.missingReceipts}</p>
            </div>
            <div className="rounded-md border border-vault-border bg-vault-bg p-3">
              <p className="text-[11px] text-vault-text-faint">Missing Photos</p>
              <p className="text-base font-semibold">{data.summary.missingEvidence.missingPhotos}</p>
            </div>
            <div className="rounded-md border border-vault-border bg-vault-bg p-3">
              <p className="text-[11px] text-vault-text-faint">Missing Values</p>
              <p className="text-base font-semibold">{data.summary.missingEvidence.missingValues}</p>
            </div>
            <div className="rounded-md border border-vault-border bg-vault-bg p-3">
              <p className="text-[11px] text-vault-text-faint">Missing Serials</p>
              <p className="text-base font-semibold">{data.summary.missingEvidence.missingSerials}</p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-vault-border bg-vault-surface p-5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-vault-text-muted">Master Inventory</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-vault-border text-vault-text-faint">
                  <th className="py-2 pr-4 text-left">Type</th>
                  <th className="py-2 pr-4 text-left">Manufacturer</th>
                  <th className="py-2 pr-4 text-left">Model</th>
                  <th className="py-2 pr-4 text-left">Serial</th>
                  <th className="py-2 pr-4 text-right">Purchase</th>
                  <th className="py-2 pr-4 text-right">Replacement</th>
                  <th className="py-2 text-right">Docs</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td className="py-3 text-vault-text-faint" colSpan={7}>
                      No inventory items included for this export.
                    </td>
                  </tr>
                ) : (
                  data.items.map((item) => (
                    <tr key={item.itemId} className="border-b border-vault-border/60">
                      <td className="py-2 pr-4">{item.entityType}</td>
                      <td className="py-2 pr-4">{item.manufacturer || "—"}</td>
                      <td className="py-2 pr-4">{item.model || "—"}</td>
                      <td className="py-2 pr-4 font-mono">{item.serialNumber || "—"}</td>
                      <td className="py-2 pr-4 text-right">{formatCurrency(item.purchasePrice)}</td>
                      <td className="py-2 pr-4 text-right">{formatCurrency(item.replacementValue)}</td>
                      <td className="py-2 text-right">{item.receiptCount}/{item.documentCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {options.includeAmmo && (
          <section className="rounded-lg border border-vault-border bg-vault-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-vault-text-muted">Ammo Inventory</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-vault-border text-vault-text-faint">
                    <th className="py-2 text-left">Brand</th>
                    <th className="py-2 text-left">Caliber</th>
                    <th className="py-2 text-right">Quantity</th>
                    <th className="py-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ammo.length === 0 ? (
                    <tr>
                      <td className="py-3 text-vault-text-faint" colSpan={4}>
                        No ammo records included for this export.
                      </td>
                    </tr>
                  ) : (
                    data.ammo.map((row) => (
                      <tr key={row.ammoId} className="border-b border-vault-border/60">
                        <td className="py-2">{row.brand || "—"}</td>
                        <td className="py-2">{row.caliber || "—"}</td>
                        <td className="py-2 text-right">{row.quantity}</td>
                        <td className="py-2 text-right">{formatCurrency(row.purchasePrice)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {options.includeDocuments && (
          <section className="rounded-lg border border-vault-border bg-vault-surface p-5">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-vault-text-muted">Document Index</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-vault-border text-vault-text-faint">
                    <th className="py-2 text-left">Type</th>
                    <th className="py-2 text-left">Name</th>
                    <th className="py-2 text-left">Linked Item</th>
                    <th className="py-2 text-left">Mime</th>
                    <th className="py-2 text-left">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attachments.length === 0 ? (
                    <tr>
                      <td className="py-3 text-vault-text-faint" colSpan={5}>
                        No documents included for this export.
                      </td>
                    </tr>
                  ) : (
                    data.attachments.map((row) => (
                      <tr key={row.documentId} className="border-b border-vault-border/60">
                        <td className="py-2">{row.type}</td>
                        <td className="py-2">{row.name}</td>
                        <td className="py-2">{row.linkedItemName || row.linkedItemType}</td>
                        <td className="py-2">{row.mimeType || "—"}</td>
                        <td className="py-2">{formatDate(row.uploadedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {visuals.length > 0 && (
          <section className="rounded-lg border border-vault-border bg-vault-surface p-5 armory-page-break">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-vault-text-muted">Visual Evidence Appendix</h2>
            <p className="text-xs text-vault-text-faint mt-1">
              Includes {visuals.length} image entries based on current export toggles.
            </p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {visuals.map((image) => (
                <figure key={image.id} className="rounded-md border border-vault-border bg-vault-bg p-3 break-inside-avoid">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.imageUrl} alt={image.title} className="w-full h-52 object-contain bg-black/20 rounded" />
                  <figcaption className="mt-2 text-[11px] text-vault-text-muted">
                    <p className="font-medium text-vault-text">{image.title}</p>
                    <p>{image.source} • {image.linkedItemName || image.linkedItemId}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
