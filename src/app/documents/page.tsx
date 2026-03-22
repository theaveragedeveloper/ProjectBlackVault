"use client";

import { useEffect, useState } from "react";
import { DocumentUploader } from "@/components/shared/DocumentUploader";
import { PageHeader } from "@/components/shared/PageHeader";

interface DocumentItem {
  id: string;
  name: string;
  url: string;
  size: number;
  updatedAt: string;
}

interface ImageItem {
  id: string;
  url: string;
  folder: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);

  async function load() {
    const [docRes, imageRes] = await Promise.all([
      fetch("/api/documents"),
      fetch("/api/images/library"),
    ]);

    const docsJson = await docRes.json();
    const imagesJson = await imageRes.json();
    setDocuments(docsJson.documents ?? []);
    setImages(imagesJson.images ?? []);
  }

  async function deleteDocument(id: string) {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    await load();
  }

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, []);

  return (
    <div className="min-h-full">
      <PageHeader title="LIBRARY" subtitle="Images and documents" />
      <div className="p-6 space-y-6">
        <DocumentUploader onUploaded={load} />

        <section className="bg-vault-surface border border-vault-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-vault-text mb-3">Documents</h2>
          <div className="space-y-2">
            {documents.length === 0 && <p className="text-sm text-vault-text-faint">No documents uploaded yet.</p>}
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-3 border border-vault-border rounded px-3 py-2">
                <a href={doc.url} target="_blank" className="text-sm text-[#00C2FF] hover:underline" rel="noreferrer">
                  {doc.name}
                </a>
                <button
                  type="button"
                  onClick={() => deleteDocument(doc.id)}
                  className="text-xs text-[#E53935] hover:underline"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-vault-surface border border-vault-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-vault-text mb-3">Images</h2>
          {images.length === 0 ? (
            <p className="text-sm text-vault-text-faint">No uploaded images yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {images.map((image) => (
                <a key={image.id} href={image.url} target="_blank" rel="noreferrer" className="block border border-vault-border rounded overflow-hidden bg-vault-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.id} className="w-full h-24 object-cover" />
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
