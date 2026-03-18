"use client";

import { AlertCircle, FileIcon, FileText, Upload, X } from "lucide-react";

interface ReceiptUploaderProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onValidationError: (message: string | null) => void;
  error: string | null;
}

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 20 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ReceiptUploader({
  file,
  onFileChange,
  onValidationError,
  error,
}: ReceiptUploaderProps) {
  function handleFileSelect(selected: File) {
    if (!ALLOWED_TYPES.includes(selected.type)) {
      onFileChange(null);
      onValidationError("Invalid receipt file type. Allowed: PDF, JPG, PNG, WebP.");
      return;
    }

    if (selected.size > MAX_SIZE) {
      onFileChange(null);
      onValidationError("Receipt file too large. Maximum size is 20MB.");
      return;
    }

    onValidationError(null);
    onFileChange(selected);
  }

  return (
    <div className="space-y-3">
      {!file ? (
        <label className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer border-vault-border hover:border-[#00C2FF]/40 hover:bg-vault-border/20 transition-colors">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            onChange={(e) => {
              const selected = e.target.files?.[0] ?? null;
              if (selected) {
                handleFileSelect(selected);
              }
            }}
          />
          <Upload className="w-7 h-7 text-vault-text-faint mx-auto mb-2" />
          <p className="text-sm text-vault-text-muted">Drop receipt here or click to browse</p>
          <p className="text-xs text-vault-text-faint mt-1">PDF, JPG, PNG, WebP — max 20MB</p>
        </label>
      ) : (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-vault-border bg-vault-bg">
          {file.type === "application/pdf" ? (
            <FileText className="w-8 h-8 text-[#F5A623] shrink-0" />
          ) : (
            <FileIcon className="w-8 h-8 text-[#00C2FF] shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-vault-text truncate">{file.name}</p>
            <p className="text-xs text-vault-text-faint">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onValidationError(null);
              onFileChange(null);
            }}
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
    </div>
  );
}
