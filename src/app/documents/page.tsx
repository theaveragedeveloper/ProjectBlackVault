"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Filter, Upload, X } from "lucide-react";
import { DocumentUploader, type UploadedDocument } from "@/components/shared/DocumentUploader";

type DocTypeFilter = "ALL" | "RECIPE" | "TAX_STAMP" | "RECEIPT" | "OTHER";
type AttachmentFilter = "ALL" | "FIREARM" | "ACCESSORY" | "UNATTACHED";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function typeLabel(type: UploadedDocument["type"]): string {
  if (type === "RECIPE") return "Recipe";
  if (type === "TAX_STAMP") return "Tax Stamp";
  if (type === "RECEIPT") return "Receipt";
  return "Other";
}

export default function DocumentLibraryPage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [typeFilter, setTypeFilter] = useState<DocTypeFilter>("ALL");
  const [attachmentFilter, setAttachmentFilter] = useState<AttachmentFilter>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/documents")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDocuments(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      documents.filter((doc) => {
        if (typeFilter !== "ALL" && doc.type !== typeFilter) return false;
        if (attachmentFilter === "FIREARM" && !doc.firearmId) return false;
        if (attachmentFilter === "ACCESSORY" && !doc.accessoryId) return false;
        if (attachmentFilter === "UNATTACHED" && (doc.firearmId || doc.accessoryId)) return false;
        return true;
      }),
    [attachmentFilter, documents, typeFilter]
  );

  async function deleteDocument(id: string) {
    if (!confirm("Delete this document?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-full">
      <div className="border-b border-vault-border bg-vault-surface px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#00C2FF]" />
            </div>
            <div>
              <h1 className="text-base font-bold text-vault-text tracking-wide uppercase">Document Library</h1>
              <p className="text-xs text-vault-text-faint">Store recipes, tax stamps, receipts, and supporting files.</p>
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
        {showUploader && (
          <div className="rounded-xl border border-vault-border bg-vault-surface p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-vault-text">Upload New Document</h2>
              <button onClick={() => setShowUploader(false)} className="text-vault-text-faint hover:text-vault-text">
                <X className="w-4 h-4" />
              </button>
            </div>
            <DocumentUploader
              onUploadComplete={(doc) => {
                setDocuments((prev) => [doc, ...prev]);
                setShowUploader(false);
              }}
              onCancel={() => setShowUploader(false)}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-vault-text-faint shrink-0" />
          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "RECIPE", "TAX_STAMP", "RECEIPT", "OTHER"] as DocTypeFilter[]).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  typeFilter === type
                    ? "bg-[#00C2FF]/10 border-[#00C2FF]/30 text-[#00C2FF]"
                    : "border-vault-border text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border"
                }`}
              >
                {type === "ALL" ? "All Types" : typeLabel(type)}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-vault-border hidden sm:block" />
          <div className="flex gap-1.5 flex-wrap">
            {(["ALL", "FIREARM", "ACCESSORY", "UNATTACHED"] as AttachmentFilter[]).map((type) => (
              <button
                key={type}
                onClick={() => setAttachmentFilter(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                  attachmentFilter === type
                    ? "bg-[#00C2FF]/10 border-[#00C2FF]/30 text-[#00C2FF]"
                    : "border-vault-border text-vault-text-faint hover:text-vault-text-muted hover:bg-vault-border"
                }`}
              >
                {type === "ALL" ? "All Items" : type}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-vault-text-faint">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

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
                ? "Upload your first document to build a useful reference and backup library."
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-vault-border bg-vault-surface overflow-hidden">
            <div className="divide-y divide-vault-border">
              {filtered.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 px-4 py-3 hover:bg-vault-border/20 group transition-colors">
                  <div className="w-10 h-10 rounded-md border border-[#00C2FF]/20 bg-[#00C2FF]/5 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#00C2FF]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-vault-text truncate">{doc.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border font-mono border-vault-border text-vault-text-faint">
                        {typeLabel(doc.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {doc.firearm && (
                        <Link href={`/vault/${doc.firearm.id}`} className="text-xs text-[#00C2FF] hover:underline">
                          {doc.firearm.name}
                        </Link>
                      )}
                      {doc.accessory && (
                        <Link href={`/accessories/${doc.accessory.id}`} className="text-xs text-[#00C2FF] hover:underline">
                          {doc.accessory.name}
                        </Link>
                      )}
                      {!doc.firearm && !doc.accessory && <span className="text-xs text-vault-text-faint">Unattached</span>}
                      <span className="text-xs text-vault-text-faint">
                        {new Date(doc.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      {doc.fileSize != null && (
                        <span className="text-xs text-vault-text-faint">{formatBytes(doc.fileSize)}</span>
                      )}
                    </div>
                    {doc.notes && <p className="text-xs text-vault-text-faint mt-0.5 truncate">{doc.notes}</p>}
                  </div>

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
                      onClick={() => deleteDocument(doc.id)}
                      disabled={deletingId === doc.id}
                      className="p-1.5 rounded-md text-vault-text-faint hover:text-[#E53935] hover:bg-[#E53935]/10 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
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
