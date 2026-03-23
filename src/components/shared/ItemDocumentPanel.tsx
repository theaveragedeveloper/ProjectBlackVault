"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Trash2, Upload, X } from "lucide-react";
import { DocumentUploader, type UploadedDocument } from "@/components/shared/DocumentUploader";

interface ItemDocumentPanelProps {
  entityType: "firearm" | "accessory";
  entityId: string;
  title?: string;
}

type DisplayTag = {
  label: string;
  className: string;
};

function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function tagForDocument(doc: UploadedDocument): DisplayTag {
  if (doc.type === "RECEIPT") {
    return { label: "Receipt", className: "border-[#00C2FF]/30 text-[#00C2FF]" };
  }
  if (doc.type === "NFA_TAX_STAMP") {
    return { label: "Tax Stamp", className: "border-[#F5A623]/30 text-[#F5A623]" };
  }
  if (doc.type === "PHOTO" || doc.mimeType?.startsWith("image/")) {
    return { label: "Photo", className: "border-[#00C853]/30 text-[#00C853]" };
  }
  return { label: "Other", className: "border-vault-border text-vault-text-faint" };
}

export function ItemDocumentPanel({ entityType, entityId, title = "Documents" }: ItemDocumentPanelProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const query = entityType === "firearm" ? `firearmId=${entityId}` : `accessoryId=${entityId}`;
    fetch(`/api/documents?${query}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDocuments(data);
        }
      })
      .finally(() => setLoading(false));
  }, [entityId, entityType]);

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

  const emptyText = useMemo(() => {
    if (entityType === "firearm") {
      return "No docs attached yet. Upload receipts, photos, and tax stamps directly on this firearm.";
    }
    return "No docs attached yet. Upload receipts, photos, and tax stamps directly on this accessory.";
  }, [entityType]);

  return (
    <div className="rounded-xl border border-vault-border bg-vault-surface overflow-hidden">
      <div className="px-4 py-3 border-b border-vault-border flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-vault-text">{title}</h3>
          <p className="text-xs text-vault-text-faint">{documents.length} attached</p>
        </div>
        <button
          onClick={() => setShowUploader((v) => !v)}
          className="flex items-center gap-1.5 text-xs bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 px-2.5 py-1.5 rounded transition-colors"
        >
          {showUploader ? <X className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
          {showUploader ? "Close" : "Upload"}
        </button>
      </div>

      {showUploader && (
        <div className="p-4 border-b border-vault-border bg-vault-bg/50">
          <DocumentUploader
            entityType={entityType}
            entityId={entityId}
            defaultDocType="RECEIPT"
            onUploadComplete={(doc) => {
              setDocuments((prev) => [doc, ...prev]);
              setShowUploader(false);
            }}
            onCancel={() => setShowUploader(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="w-5 h-5 border-2 border-[#00C2FF]/30 border-t-[#00C2FF] rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="p-6 text-center">
          <FileText className="w-8 h-8 text-vault-border mx-auto mb-2" />
          <p className="text-xs text-vault-text-faint">{emptyText}</p>
        </div>
      ) : (
        <div className="divide-y divide-vault-border">
          {documents.map((doc) => {
            const tag = tagForDocument(doc);
            return (
              <div key={doc.id} className="px-4 py-3 flex items-start gap-3 group hover:bg-vault-border/20 transition-colors">
                <div className="w-9 h-9 rounded-md border border-vault-border bg-vault-bg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-vault-text-muted" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm text-vault-text font-medium truncate">{doc.name}</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${tag.className}`}>
                      {tag.label}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-vault-text-faint flex-wrap">
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    {doc.fileSize ? <span>{formatBytes(doc.fileSize)}</span> : null}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1 rounded border border-vault-border text-xs text-vault-text-muted hover:text-[#00C2FF] hover:border-[#00C2FF]/30 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded text-vault-text-faint hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
