"use client";

import { useRef, useState, useEffect } from "react";
import {
  ALLOWED_IMAGE_MIME_TYPES,
  SUPPORTED_IMAGE_FORMATS_LABEL,
  IMAGE_PICKER_ACCEPT,
} from "@/lib/image-formats";
import { Camera, Loader2, X, AlertCircle } from "lucide-react";

interface ImagePickerProps {
  entityType: "firearm" | "accessory" | "ammo" | "build";
  entityId?: string; // undefined on new forms; a temp UUID will be used
  currentUrl?: string | null;
  value?: string | null;
  onChange: (url: string | null, source?: string | null) => void;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export default function ImagePicker({
  entityType,
  entityId,
  currentUrl,
  value,
  onChange,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Stable temp ID for new items — generated once per form session
  const tempId = useRef<string>(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  const [preview, setPreview] = useState<string | null>(value ?? currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPreview(value ?? currentUrl ?? null);
  }, [currentUrl, value]);

  async function handleFile(file: File) {
    setError(null);

    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
      setError(`Only ${SUPPORTED_IMAGE_FORMATS_LABEL} formats are supported.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Photo must be 10 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", entityType);
      fd.append("entityId", entityId ?? tempId.current);

      const res = await fetch("/api/images/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.error ?? "Upload failed. Please try again.");
        return;
      }

      setPreview(json.url);
      onChange(json.url, "uploaded");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed. Check your connection and try again.";
      setError(message);
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setError(null);
    setPreview(null);
    onChange(null, null);
  }

  return (
    <div className="space-y-2">
      {/* Preview */}
      {preview ? (
        <div className="relative rounded-md overflow-hidden border border-vault-border bg-vault-bg">
          <img
            src={preview}
            alt="Preview"
            loading="lazy"
            className="w-full max-h-48 h-auto object-contain"
            onError={() => {
              setError("Could not load this image. Please upload another image.");
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 flex items-center gap-1 bg-[#E53935]/80 hover:bg-[#E53935] text-white rounded px-2 py-1 text-xs font-medium transition-colors"
          >
            <X className="w-3 h-3" />
            Remove Photo
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-vault-border bg-vault-bg hover:border-[#00C2FF]/40 transition-colors px-4 py-8 cursor-pointer"
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-[#00C2FF] animate-spin" />
              <p className="text-sm text-vault-text-muted">Uploading your photo...</p>
            </>
          ) : (
            <>
              <Camera className="w-8 h-8 text-vault-text-faint" />
              <div className="text-center">
                <p className="text-sm font-medium text-vault-text">Add a Photo</p>
                <p className="text-xs text-vault-text-faint mt-0.5">
                  Click to choose, or drag and drop.
                </p>
                <p className="text-[10px] text-vault-text-faint mt-1 font-mono">
                  JPG · JPEG · PNG &nbsp;·&nbsp; Max 10 MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_PICKER_ACCEPT}
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-[#E53935] text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Change photo button (shown when preview exists) */}
      {preview && !uploading && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-vault-text-muted hover:text-[#00C2FF] transition-colors"
        >
          <Camera className="w-3.5 h-3.5" />
          Change Photo
        </button>
      )}
    </div>
  );
}
