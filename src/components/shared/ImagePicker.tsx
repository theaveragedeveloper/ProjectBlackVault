"use client";

import { useRef, useState } from "react";
import { isAllowedImageUrlForStorage, IMAGE_URL_ALLOWLIST_ERROR } from "@/lib/image-url-validation";
import { allowExternalImageUrls } from "@/lib/network-policy";
import Image from "next/image";
import { Camera, Link, Loader2, X, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface ImagePickerProps {
  entityType: "firearm" | "accessory" | "build";
  entityId?: string; // undefined on new forms; a temp UUID will be used
  currentUrl?: string | null;
  onChange: (url: string | null, source: string | null) => void;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/avif"];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export default function ImagePicker({
  entityType,
  entityId,
  currentUrl,
  onChange,
}: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Stable temp ID for new items — generated once per form session
  const tempId = useRef<string>(
    typeof crypto !== "undefined" ? crypto.randomUUID() : `tmp-${Date.now()}`
  );

  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const previewNeedsSafeMode = preview ? !isAllowedImageUrlForStorage(preview) : false;
  const externalUrlEntryAllowed = allowExternalImageUrls();

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, GIF, WebP, and AVIF photos are supported.");
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
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Upload failed. Please try again.");
        return;
      }

      setPreview(json.url);
      onChange(json.url, "uploaded");
    } catch {
      setError("Upload failed. Check your connection and try again.");
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
    setPreview(null);
    setUrlInput("");
    onChange(null, null);
  }

  function handleUrlApply() {
    const url = urlInput.trim();
    if (!url) return;

    if (!isAllowedImageUrlForStorage(url)) {
      setError(IMAGE_URL_ALLOWLIST_ERROR);
      return;
    }

    setError(null);
    setPreview(url);
    onChange(url, "url");
    setShowUrl(false);
  }

  return (
    <div className="space-y-2">
      {/* Preview */}
      {preview ? (
        <div className="relative rounded-md overflow-hidden border border-vault-border bg-vault-bg">
          {previewNeedsSafeMode ? (
            <img
              src={preview}
              alt="Preview"
              loading="lazy"
              className="w-full max-h-48 h-auto object-contain"
              onError={() => {
                setError("Could not load this image URL. Please check the link.");
              }}
            />
          ) : (
            <Image
              src={preview}
              alt="Preview"
              width={1200}
              height={800}
              loading="lazy"
              className="w-full max-h-48 h-auto object-contain"
              onError={() => {
                setError("Could not load this image URL. Please check the link.");
              }}
            />
          )}
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
                  Click to choose, or drag and drop
                </p>
                <p className="text-[10px] text-vault-text-faint mt-1 font-mono">
                  JPG · PNG · GIF · WebP &nbsp;·&nbsp; Max 10 MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
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

      {/* URL fallback (collapsible) */}
      {externalUrlEntryAllowed ? (
        <div>
          <button
            type="button"
            onClick={() => setShowUrl((v) => !v)}
            className="flex items-center gap-1 text-xs text-vault-text-faint hover:text-vault-text-muted transition-colors"
          >
            <Link className="w-3 h-3" />
            Or enter a URL
            {showUrl ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showUrl && (
            <div className="mt-2 flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleUrlApply())}
                placeholder="https://example.com/image.jpg"
                className="flex-1 bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint"
              />
              <button
                type="button"
                onClick={handleUrlApply}
                className="px-3 py-1.5 bg-vault-surface border border-vault-border text-vault-text-muted hover:text-vault-text rounded-md text-xs transition-colors"
              >
                Use
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-vault-text-faint">
          External image URLs are disabled by policy. Upload local image files only.
        </p>
      )}
    </div>
  );
}
