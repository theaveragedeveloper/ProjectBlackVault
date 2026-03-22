"use client";

import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";

interface ImagePickerProps {
  entityType: "firearm" | "accessory" | "ammo";
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function ImagePicker({ entityType, value, onChange, label = "Image" }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileSelected(file: File) {
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entityType", entityType);
      formData.append("entityId", `temp-${Date.now()}`);

      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to upload image");
        return;
      }

      onChange(json.url);
    } catch {
      setError("Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium uppercase tracking-widest text-vault-text-muted mb-1.5">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://example.com/image.jpg"
        className="w-full bg-vault-surface border border-vault-border text-vault-text rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#00C2FF] placeholder-vault-text-faint transition-colors"
      />

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onFileSelected(file);
            }
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 bg-[#00C2FF]/10 border border-[#00C2FF]/30 text-[#00C2FF] hover:bg-[#00C2FF]/20 disabled:opacity-60 px-3 py-1.5 rounded text-xs transition-colors"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Upload image
        </button>
        {value && (
          <span className="text-xs text-[#00C853]">Image selected</span>
        )}
      </div>

      {error && <p className="text-xs text-[#E53935]">{error}</p>}

      {value && (
        <div className="w-full h-32 rounded-md overflow-hidden border border-vault-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Preview" className="w-full h-full object-contain bg-vault-bg" />
        </div>
      )}
    </div>
  );
}
