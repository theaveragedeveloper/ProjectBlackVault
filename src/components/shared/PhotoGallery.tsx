"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Plus, Star, Trash2, Loader2, AlertCircle } from "lucide-react";

interface Photo {
  id: string;
  entityType: string;
  entityId: string;
  url: string;
  source: string;
  isPrimary: boolean;
  createdAt: string;
}

interface PhotoGalleryProps {
  entityType: "firearm" | "accessory" | "build" | "ammo";
  entityId: string;
  onPrimaryChange?: (url: string | null) => void;
}

const HEIC_TYPES = new Set(["image/heic", "image/heif"]);
const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/heic",
  "image/heif",
];
const MAX_BYTES = 10 * 1024 * 1024;

async function convertHeicToWebp(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not initialize image conversion context.");
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.92)
  );
  if (!blob) throw new Error("Could not convert photo. Please export as JPG and try again.");
  const name = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${name}.webp`, { type: "image/webp", lastModified: Date.now() });
}

export default function PhotoGallery({
  entityType,
  entityId,
  onPrimaryChange,
}: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/photos?entityType=${entityType}&entityId=${entityId}`
      );
      if (res.ok) {
        const data = await res.json();
        setPhotos(data);
      }
    } catch {
      // silently ignore fetch errors during background refresh
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  async function handleFile(file: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Only JPG, PNG, WebP, AVIF, and HEIC/HEIF photos are supported.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Photo must be 10 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const uploadFile = HEIC_TYPES.has(file.type)
        ? await convertHeicToWebp(file)
        : file;

      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("entityType", entityType);
      fd.append("entityId", entityId);

      const res = await fetch("/api/photos", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Upload failed. Please try again.");
        return;
      }

      const newPhoto: Photo = json;
      setPhotos((prev) => {
        // If new photo is primary, demote previous primary in local state
        const updated = newPhoto.isPrimary
          ? prev.map((p) => ({ ...p, isPrimary: false }))
          : [...prev];
        return [...updated, newPhoto].sort((a, b) => {
          if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
      });

      if (newPhoto.isPrimary) {
        onPrimaryChange?.(newPhoto.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  async function handleDelete(photo: Photo) {
    setDeletingId(photo.id);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to delete photo.");
        return;
      }

      setPhotos((prev) => {
        const remaining = prev.filter((p) => p.id !== photo.id);
        if (photo.isPrimary && remaining.length > 0) {
          // Promote oldest remaining
          const sorted = [...remaining].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          sorted[0] = { ...sorted[0], isPrimary: true };
          onPrimaryChange?.(sorted[0].url);
          return sorted.sort((a, b) => {
            if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
        }
        if (photo.isPrimary && remaining.length === 0) {
          onPrimaryChange?.(null);
        }
        return remaining;
      });
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPrimary(photo: Photo) {
    if (photo.isPrimary) return;
    setSettingPrimaryId(photo.id);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${photo.id}/set-primary`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to set main photo.");
        return;
      }
      const updated: Photo[] = await res.json();
      setPhotos(updated);
      const primary = updated.find((p) => p.isPrimary);
      onPrimaryChange?.(primary?.url ?? null);
    } finally {
      setSettingPrimaryId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-[#00C2FF] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-[#E53935] text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group aspect-square rounded-md overflow-hidden border border-vault-border bg-vault-bg"
            >
              <Image
                src={photo.url}
                alt="Photo"
                fill
                sizes="(max-width: 640px) 33vw, 25vw"
                className="object-cover"
                unoptimized
              />

              {/* Primary badge */}
              {photo.isPrimary && (
                <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-[#00C2FF]/90 text-[#050709] rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                  <Star className="w-2.5 h-2.5" />
                  Main
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-[#050709]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                {!photo.isPrimary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(photo)}
                    disabled={settingPrimaryId === photo.id}
                    className="flex items-center gap-1 text-[9px] font-medium bg-[#00C2FF]/20 border border-[#00C2FF]/40 text-[#00C2FF] rounded px-1.5 py-0.5 hover:bg-[#00C2FF]/30 disabled:opacity-50 transition-colors w-full justify-center"
                  >
                    {settingPrimaryId === photo.id ? (
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    ) : (
                      <Star className="w-2.5 h-2.5" />
                    )}
                    Set Main
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(photo)}
                  disabled={deletingId === photo.id}
                  className="flex items-center gap-1 text-[9px] font-medium bg-[#E53935]/20 border border-[#E53935]/40 text-[#E53935] rounded px-1.5 py-0.5 hover:bg-[#E53935]/30 disabled:opacity-50 transition-colors w-full justify-center"
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-2.5 h-2.5" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload controls */}
      <div className="flex items-center gap-2">
        {/* File upload */}
        <button
          type="button"
          onClick={() => !uploading && fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-vault-text-muted hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          {uploading ? "Uploading..." : "Add Photo"}
        </button>

        {/* Camera capture (mobile) */}
        <button
          type="button"
          onClick={() => !uploading && cameraInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 text-xs text-vault-text-muted hover:text-[#00C2FF] border border-vault-border hover:border-[#00C2FF]/40 rounded-md px-3 py-1.5 transition-colors disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5" />
          Take Photo
        </button>
      </div>

      {photos.length === 0 && !uploading && (
        <p className="text-xs text-vault-text-faint">
          No photos yet. Add one above.
        </p>
      )}

      <p className="text-[11px] text-vault-text-faint">
        JPG · PNG · WebP · AVIF · HEIC/HEIF &nbsp;·&nbsp; Max 10 MB each.
        Hover a photo to set it as main or delete it.
      </p>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={handleFileInput}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
}
