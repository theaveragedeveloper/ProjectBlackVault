"use client";

import { useState, useRef } from "react";
import { FileText, Upload, X, AlertCircle, FileIcon } from "lucide-react";

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize: number | null;
  mimeType: string | null;
  notes: string | null;
  firearmId: string | null;
  accessoryId: string | null;
  createdAt: string;
  firearm?: { id: string; name: string } | null;
  accessory?: { id: string; name: string } | null;
}

interface DocumentUploaderProps {
  entityType?: "firearm" | "accessory" | null;
  entityId?: string | null;
  defaultDocType?: "RECEIPT" | "PHOTO" | "NFA_TAX_STAMP" | "OTHER";
  onUploadComplete: (doc: UploadedDocument) => void;
  onCancel?: () => void;
}

const DOC_TYPES = [
  { value: "RECEIPT", label: "Receipt" },
  { value: "PHOTO", label: "Photo" },
  { value: "NFA_TAX_STAMP", label: "NFA Tax Stamp" },
  { value: "OTHER", label: "Other" },
] as const;

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 20 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentUploader({
  entityType,
  entityId,
  defaultDocType = "RECEIPT",
  onUploadComplete,
  onCancel,
}: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState<"RECEIPT" | "PHOTO" | "NFA_TAX_STAMP" | "OTHER">(defaultDocType);
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFileSelect(selected: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Invalid file type. Allowed: PDF, JPG, PNG, WebP");
      return;
    }
    if (selected.size > MAX_SIZE) {
      setError("File too large. Maximum size is 20MB.");
      return;
    }
    setFile(selected);
    if (!docName) {
      // Auto-fill name from filename (strip extension)
      const base = selected.name.replace(/\.[^.]+$/, "");
      setDocName(base);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  }

  async function handleUpload() {
    if (!file || !docName.trim()) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", docName.trim());
      formData.append("type", docType);
      if (entityType && entityId) {
        formData.append(entityType === "firearm" ? "firearmId" : "accessoryId", entityId);
      }
      if (notes.trim()) formData.append("notes", notes.trim());

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(json.error ?? "Upload failed");
      }

      const doc: UploadedDocument = await res.json();
      onUploadComplete(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const isPdf = file?.type === "application/pdf";

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-[#00C2FF] bg-[#00C2FF]/5"
              : "border-vault-border hover:border-[#00C2FF]/40 hover:bg-vault-border/20"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
          />
          <Upload className="w-8 h-8 text-vault-text-faint mx-auto mb-2" />
          <p className="text-sm text-vault-text-muted">Drop file here or click to browse</p>
          <p className="text-xs text-vault-text-faint mt-1">PDF, JPG, PNG, WebP — max 20MB</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-vault-border bg-vault-bg">
          {isPdf ? (
            <FileText className="w-8 h-8 text-[#F5A623] shrink-0" />
          ) : (
            <FileIcon className="w-8 h-8 text-[#00C2FF] shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-vault-text truncate">{file.name}</p>
            <p className="text-xs text-vault-text-faint">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => { setFile(null); setError(null); }}
            className="text-vault-text-faint hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5">
            Document Name <span className="text-[#E53935]">*</span>
          </label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="e.g. Glock 19 Purchase Receipt"
            className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5">
            Document Type
          </label>
          <div className="flex gap-2">
            {DOC_TYPES.map((dt) => (
              <button
                key={dt.value}
                type="button"
                onClick={() => setDocType(dt.value)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  docType === dt.value
                    ? "bg-[#00C2FF]/10 border-[#00C2FF]/30 text-[#00C2FF]"
                    : "border-vault-border text-vault-text-muted hover:bg-vault-border"
                }`}
              >
                {dt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5">
            Notes (optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Original purchase from Cabela's, $549..."
            className="w-full bg-vault-bg border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || !docName.trim() || uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] text-sm hover:bg-[#00C2FF]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="w-4 h-4 border-2 border-[#00C2FF]/30 border-t-[#00C2FF] rounded-full animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading..." : "Upload Document"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border border-vault-border text-vault-text-muted text-sm hover:bg-vault-border transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
