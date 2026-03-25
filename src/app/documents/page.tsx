"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, ExternalLink, X, Filter } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/PageHeader";
import { DocumentUploader, type UploadedDocument } from "@/components/shared/DocumentUploader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { SectionCard } from "@/components/shared/SectionCard";
import { StandardButton, buttonClassName } from "@/components/shared/StandardButton";
import { StatusMessage } from "@/components/shared/StatusMessage";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

type DocTypeFilter = "ALL" | "RECEIPT" | "PHOTO" | "NFA_TAX_STAMP" | "OTHER";
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/documents", { credentials: "include", cache: "no-store" })
      .then(async (r) => ({ ok: r.ok, data: await r.json().catch(() => null) }))
      .then(({ ok, data }) => {
        if (ok && Array.isArray(data)) {
          setDocuments(data);
          setLoadError(null);
        } else {
          setLoadError((data as { error?: string } | null)?.error ?? "Failed to load documents.");
        }
        setLoading(false);
      })
      .catch(() => {
        setLoadError("Network error while loading documents.");
        setLoading(false);
      });
  }, []);

  const safeDocuments = documents.map((doc) => ({
    ...doc,
    name: doc.name || "Untitled document",
    type: doc.type || "OTHER",
    createdAt: doc.createdAt || new Date(0).toISOString(),
    fileUrl: doc.fileUrl || "#",
  }));

  const filtered = safeDocuments.filter((doc) => {
    if (typeFilter !== "ALL" && doc.type !== typeFilter) return false;
    if (entityFilter === "FIREARM" && !doc.firearmId) return false;
    if (entityFilter === "ACCESSORY" && !doc.accessoryId) return false;
    if (entityFilter === "UNATTACHED" && (doc.firearmId || doc.accessoryId)) return false;
    return true;
  });

  async function handleDelete(id: string) {
    setDeletingId(id);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setActionMessage({
          type: "error",
          text: json?.error ?? "Failed to delete document.",
        });
        return;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setActionMessage({ type: "success", text: "Document deleted." });
    } catch {
      setActionMessage({
        type: "error",
        text: "Network error while deleting document.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const isPdf = (doc: UploadedDocument) =>
    doc.mimeType === "application/pdf" || (doc.fileUrl ?? "").endsWith(".pdf");

  return (
    <div className="min-h-full">
      <PageHeader
        title="Document Library"
        subtitle="Store receipts, tax stamps, and supporting records with clear links to firearms and accessories."
        actions={
          <StandardButton
            onClick={() => setShowUploader((v) => !v)}
            variant="primary"
            icon={<Upload className="w-4 h-4" />}
          >
            {showUploader ? "Close Upload" : "Upload Document"}
          </StandardButton>
        }
      />

      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:space-y-6 sm:p-6">
        {loadError && <StatusMessage tone="error" message={loadError} />}
        {actionMessage && <StatusMessage tone={actionMessage.type} message={actionMessage.text} />}
        {uploadSuccess && <StatusMessage tone="success" message={uploadSuccess} />}

        {showUploader && (
          <SectionCard title="Upload document" description="Attach receipts, photos, or tax records.">
            <DocumentUploader
              entityType={null}
              entityId={null}
              onUploadComplete={(doc) => {
                setDocuments((prev) => [doc, ...prev]);
                setShowUploader(false);
                setUploadSuccess(`Uploaded "${doc.name}" successfully.`);
                setActionMessage(null);
                setTimeout(() => setUploadSuccess(null), 3000);
              }}
              onCancel={() => setShowUploader(false)}
            />
          </SectionCard>
        )}

        <SectionCard title="Filters" description="Refine by document type or linked item.">
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-4 w-4 text-vault-text-faint" />
            {(["ALL", "RECEIPT", "PHOTO", "NFA_TAX_STAMP", "OTHER"] as DocTypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={buttonClassName(typeFilter === t ? "primary" : "ghost", "min-h-8 px-2.5 py-1 text-xs")}
              >
                {t === "ALL"
                  ? "All Types"
                  : t === "NFA_TAX_STAMP"
                    ? "NFA Stamps"
                    : t === "RECEIPT"
                      ? "Receipts"
                      : t === "PHOTO"
                        ? "Photos"
                        : "Other"}
              </button>
            ))}
            <div className="hidden h-5 w-px bg-vault-border sm:block" />
            {(["ALL", "FIREARM", "ACCESSORY", "UNATTACHED"] as EntityFilter[]).map((e) => (
              <button
                key={e}
                onClick={() => setEntityFilter(e)}
                className={buttonClassName(entityFilter === e ? "primary" : "ghost", "min-h-8 px-2.5 py-1 text-xs")}
              >
                {e === "ALL"
                  ? "All Items"
                  : e === "FIREARM"
                    ? "Firearms"
                    : e === "ACCESSORY"
                      ? "Accessories"
                      : "Unattached"}
              </button>
            ))}
            <span className="ml-auto text-xs text-vault-text-faint">
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </SectionCard>

        {loading ? (
          <LoadingState label="Loading documents..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={safeDocuments.length === 0 ? "No documents yet" : "No documents match current filters"}
            description={
              safeDocuments.length === 0
                ? "Upload your first receipt or photo to keep evidence attached to your records."
                : "Adjust filters to view matching files."
            }
          />
        ) : (
          <SectionCard title="Documents" description="Newest uploads are shown first." contentClassName="p-0">
            <div className="divide-y divide-vault-border">
              {filtered.map((doc) => (
                <div key={doc.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                      isPdf(doc) ? "border-[#F5A623]/20 bg-[#F5A623]/5" : "border-[#00C2FF]/20 bg-[#00C2FF]/5"
                    }`}
                  >
                    <FileText className={`h-5 w-5 ${isPdf(doc) ? "text-[#F5A623]" : "text-[#00C2FF]"}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate break-all text-sm font-medium text-vault-text">{doc.name}</p>
                      <span className="rounded border border-vault-border px-1.5 py-0.5 text-[10px] text-vault-text-muted">
                        {(doc.type || "OTHER").replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-vault-text-faint">
                      {doc.firearm && (
                        <Link href={`/vault/${doc.firearm.id}`} className="text-[#00C2FF] hover:underline">
                          {doc.firearm.name}
                        </Link>
                      )}
                      {doc.accessory && (
                        <Link href={`/accessories/${doc.accessory.id}`} className="text-[#00C2FF] hover:underline">
                          {doc.accessory.name}
                        </Link>
                      )}
                      {!doc.firearm && !doc.accessory && <span>Unattached</span>}
                      <span>{new Date(doc.createdAt || 0).toLocaleDateString()}</span>
                      {doc.fileSize && <span>{formatBytes(doc.fileSize)}</span>}
                    </div>
                  </div>

                  <div className="ml-auto flex shrink-0 items-center gap-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClassName("secondary", "min-h-8 px-2.5 py-1 text-xs")}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open
                    </a>
                    <a
                      href={doc.fileUrl}
                      download={doc.name}
                      className={buttonClassName("ghost", "min-h-8 px-2.5 py-1 text-xs")}
                    >
                      Download
                    </a>
                    <StandardButton
                      variant="danger"
                      onClick={() => setConfirmDeleteId(doc.id)}
                      loading={deletingId === doc.id}
                      loadingLabel="Deleting..."
                      className="min-h-8 px-2.5 py-1 text-xs"
                      icon={<X className="h-3.5 w-3.5" />}
                    >
                      Delete
                    </StandardButton>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}
        title="Delete document?"
        description="This document will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        dangerous
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
