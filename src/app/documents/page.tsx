"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, ExternalLink, X, Filter } from "lucide-react";
import Link from "next/link";
import { DocumentUploader, type UploadedDocument } from "@/components/shared/DocumentUploader";

type DocTypeFilter = "ALL" | "RECEIPT" | "NFA_TAX_STAMP" | "OTHER";
type EntityFilter = "ALL" | "FIREARM" | "ACCESSORY" | "UNATTACHED";

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentLibraryPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [typeFilter, setTypeFilter] = useState<DocTypeFilter>("ALL");
  const [entityFilter, setEntityFilter] = useState<EntityFilter>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setDocuments(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = documents.filter((doc) => {
    if (typeFilter !== "ALL" && doc.type !== typeFilter) return false;
    if (entityFilter === "FIREARM" && !doc.firearmId) return false;
    if (entityFilter === "ACCESSORY" && !doc.accessoryId) return false;
    if (entityFilter === "UNATTACHED" && (doc.firearmId || doc.accessoryId)) return false;
    return true;
  });

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        alert(json?.error ?? "Failed to delete document");
        return;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert("Network error — could not delete document");
    } finally {
      setDeletingId(null);
    }
  }

  const isPdf = (doc: UploadedDocument) =>
    doc.mimeType === "application/pdf" || (doc.fileUrl ?? "").endsWith(".pdf");

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="border-b border-vault-border bg-vault-surface px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-vault-text tracking-wide uppercase">
                Document Library
              </h1>
              <p className="text-xs text-vault-text-faint">Receipts, NFA tax stamps &amp; other documents</p>
            </div>
          </div>
          <button
            onClick={() => setShowUploader((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] text-sm hover:bg-[#00C2FF]/20 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-4xl mx-auto">
        {/* Upload panel */}
        {showUploader && (
          <div className="rounded-xl border border-vault-border bg-vault-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-vault-text">Upload New Document</h2>
              <button onClick={() => setShowUploader(false)} className="text-vault-text-faint hover:text-vault-text">
                <X className="w-4 h-4" />
              </button>
            </div>
            <DocumentUploader
              entityType={null}
              entityId={null}
              onUploadComplete={(doc) => {
                setDocuments((prev) => [doc, ...prev]);
                setShowUploader(false);
              }}
              onCancel={() => setShowUploader(false)}
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-3.5 h-3.5 text-vault-text-faint shrink-0" />

          {/* Type filter */}
          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "RECEIPT", "NFA_TAX_STAMP", "OTHER"] as DocTypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  typeFilter === t
                    ? "bg-[#00C2FF]/10 border-[#00C2FF]/30 text-[#00C2FF]"
                    : "border-vault-border text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border"
                }`}
              >
                {t === "ALL" ? "All Types" : t === "NFA_TAX_STAMP" ? "NFA Stamps" : t === "RECEIPT" ? "Receipts" : "Other"}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-vault-border hidden sm:block" />

          {/* Entity filter */}
          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "FIREARM", "ACCESSORY", "UNATTACHED"] as EntityFilter[]).map((e) => (
              <button
                key={e}
                onClick={() => setEntityFilter(e)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  entityFilter === e
                    ? "bg-[#00C2FF]/10 border-[#00C2FF]/30 text-[#00C2FF]"
                    : "border-vault-border text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border"
                }`}
              >
                {e === "ALL" ? "All Items" : e === "FIREARM" ? "Firearms" : e === "ACCESSORY" ? "Accessories" : "Unattached"}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs text-vault-text-faint">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Document list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[#00C2FF]/30 border-t-[#00C2FF] rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-vault-border bg-vault-surface p-14 text-center">
            <FileText className="w-10 h-10 text-vault-border mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-vault-text mb-1">
              {documents.length === 0 ? "No documents yet" : "No documents match your filters"}
            </h3>
            <p className="text-xs text-vault-text-faint mb-4">
              {documents.length === 0
                ? "Upload receipts from a firearm or accessory page, or upload a standalone document above."
                : "Try adjusting your filters."}
            </p>
            {documents.length === 0 && (
              <button
                onClick={() => setShowUploader(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] text-sm hover:bg-[#00C2FF]/20 transition-colors mx-auto"
              >
                <Upload className="w-4 h-4" />
                Upload First Document
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-vault-border bg-vault-surface overflow-hidden">
            <div className="divide-y divide-vault-border">
              {filtered.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 px-4 py-3 hover:bg-vault-border/20 group transition-colors">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-md border flex items-center justify-center shrink-0 ${
                    isPdf(doc)
                      ? "border-[#F5A623]/20 bg-[#F5A623]/5"
                      : "border-[#00C2FF]/20 bg-[#00C2FF]/5"
                  }`}>
                    <FileText className={`w-5 h-5 ${isPdf(doc) ? "text-[#F5A623]" : "text-[#00C2FF]"}`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-vault-text truncate">{doc.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono shrink-0 ${
                        doc.type === "NFA_TAX_STAMP"
                          ? "border-[#F5A623]/30 text-[#F5A623]"
                          : doc.type === "RECEIPT"
                          ? "border-[#00C2FF]/30 text-[#00C2FF]"
                          : "border-vault-border text-vault-text-faint"
                      }`}>
                        {doc.type === "NFA_TAX_STAMP" ? "NFA Tax Stamp" : doc.type === "RECEIPT" ? "Receipt" : "Other"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {doc.firearm && (
                        <Link
                          href={`/vault/${doc.firearm.id}`}
                          className="text-xs text-[#00C2FF] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {doc.firearm.name}
                        </Link>
                      )}
                      {doc.accessory && (
                        <Link
                          href={`/accessories/${doc.accessory.id}`}
                          className="text-xs text-[#00C2FF] hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {doc.accessory.name}
                        </Link>
                      )}
                      {!doc.firearm && !doc.accessory && (
                        <span className="text-xs text-vault-text-faint">Unattached</span>
                      )}
                      <span className="text-xs text-vault-text-faint">
                        {new Date(doc.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {doc.fileSize && (
                        <span className="text-xs text-vault-text-faint">{formatBytes(doc.fileSize)}</span>
                      )}
                    </div>
                    {doc.notes && (
                      <p className="text-xs text-vault-text-faint mt-0.5 truncate">{doc.notes}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-vault-border text-vault-text-muted hover:text-[#00C2FF] hover:border-[#00C2FF]/30 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded-md text-vault-text-faint hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
