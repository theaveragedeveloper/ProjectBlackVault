"use client";

import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  type FullArmoryAttachmentRow,
  type FullArmoryExportOptions,
  type FullArmoryExportResponse,
  selectVisualEvidence,
} from "@/lib/exports/full-armory";

const PAGE_MARGIN = 36;
const FONT_SIZE_BODY = 9;
const FONT_SIZE_SMALL = 8;
const FONT_SIZE_TITLE = 18;

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(maxChars - 1, 0))}…`;
}

function toFileSafeTimestamp(isoDate: string): string {
  return isoDate.replace(/[:.]/g, "-");
}

function isPdfReceipt(row: FullArmoryAttachmentRow): boolean {
  if (row.type !== "RECEIPT") return false;
  const mime = (row.mimeType ?? "").toLowerCase();
  if (mime === "application/pdf") return true;
  return (row.fileUrl ?? "").toLowerCase().endsWith(".pdf");
}

async function loadImageForPdf(url: string): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) return null;

    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) return null;

    const objectUrl = URL.createObjectURL(blob);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = objectUrl;
      });

      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(image, 0, 0, width, height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
      return { dataUrl, width, height };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return null;
  }
}

export async function generateFullArmoryPdf(
  payload: FullArmoryExportResponse,
  options: FullArmoryExportOptions
): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter", compress: true });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;

  let y = PAGE_MARGIN;

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight <= pageHeight - PAGE_MARGIN) return;
    doc.addPage();
    y = PAGE_MARGIN;
  };

  const addLine = (height = 12) => {
    y += height;
  };

  const addLabelValue = (label: string, value: string) => {
    ensureSpace(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, PAGE_MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, PAGE_MARGIN + 110, y);
    addLine();
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(FONT_SIZE_TITLE);
  doc.text("Full Armory Export", PAGE_MARGIN, y);
  addLine(20);

  doc.setFontSize(FONT_SIZE_BODY);
  doc.setFont("helvetica", "normal");
  doc.text("Adjuster-ready inventory packet generated from Project BlackVault.", PAGE_MARGIN, y);
  addLine(18);

  addLabelValue("Generated", new Date(payload.meta.generatedAt).toLocaleString());
  addLabelValue("Preset", payload.meta.preset);
  addLabelValue("Total Items", String(payload.summary.totalItems));
  addLabelValue("Total Purchase", formatCurrency(payload.summary.totalPurchaseValue));
  addLabelValue("Total Replacement", formatCurrency(payload.summary.totalReplacementValue));

  addLine(6);
  doc.setFont("helvetica", "bold");
  doc.text("Evidence Readiness", PAGE_MARGIN, y);
  addLine(12);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Missing receipts: ${payload.summary.missingEvidence.missingReceipts}  |  Missing photos: ${payload.summary.missingEvidence.missingPhotos}`,
    PAGE_MARGIN,
    y
  );
  addLine(12);
  doc.text(
    `Missing values: ${payload.summary.missingEvidence.missingValues}  |  Missing serials: ${payload.summary.missingEvidence.missingSerials}`,
    PAGE_MARGIN,
    y
  );
  addLine(18);

  // Inventory section
  doc.setFont("helvetica", "bold");
  doc.text("Master Inventory", PAGE_MARGIN, y);
  addLine(12);

  const inventoryColumns = [
    { key: "entityType", label: "Type", width: 42, maxChars: 8 },
    { key: "manufacturer", label: "Manufacturer", width: 92, maxChars: 18 },
    { key: "model", label: "Model", width: 110, maxChars: 24 },
    { key: "serialNumber", label: "Serial", width: 84, maxChars: 14 },
    { key: "purchasePrice", label: "Purchase", width: 66, maxChars: 12 },
    { key: "replacementValue", label: "Replace", width: 66, maxChars: 12 },
    { key: "receiptCount", label: "Docs", width: 42, maxChars: 5 },
  ] as const;

  const drawInventoryHeader = () => {
    ensureSpace(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT_SIZE_SMALL);
    let x = PAGE_MARGIN;
    for (const column of inventoryColumns) {
      doc.text(column.label, x + 2, y);
      x += column.width;
    }
    addLine(10);
    doc.setDrawColor(110);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + contentWidth, y);
    addLine(6);
  };

  drawInventoryHeader();
  doc.setFont("helvetica", "normal");
  for (const item of payload.items) {
    ensureSpace(14);
    if (y === PAGE_MARGIN) {
      drawInventoryHeader();
      doc.setFont("helvetica", "normal");
    }

    const values: string[] = [
      item.entityType,
      item.manufacturer,
      item.model,
      item.serialNumber || "—",
      formatCurrency(item.purchasePrice),
      formatCurrency(item.replacementValue),
      `${item.receiptCount}/${item.documentCount}`,
    ];

    let x = PAGE_MARGIN;
    for (let index = 0; index < inventoryColumns.length; index += 1) {
      const column = inventoryColumns[index];
      doc.text(truncate(values[index], column.maxChars), x + 2, y);
      x += column.width;
    }
    addLine(10);
  }

  addLine(12);
  doc.setFont("helvetica", "bold");
  doc.text("Document Index", PAGE_MARGIN, y);
  addLine(12);

  const docColumns = [
    { label: "Type", width: 52, maxChars: 8 },
    { label: "Name", width: 180, maxChars: 36 },
    { label: "Linked Item", width: 130, maxChars: 28 },
    { label: "Mime", width: 90, maxChars: 18 },
    { label: "Uploaded", width: 90, maxChars: 20 },
  ];

  const drawDocHeader = () => {
    ensureSpace(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT_SIZE_SMALL);
    let x = PAGE_MARGIN;
    for (const column of docColumns) {
      doc.text(column.label, x + 2, y);
      x += column.width;
    }
    addLine(10);
    doc.setDrawColor(110);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + contentWidth, y);
    addLine(6);
  };

  drawDocHeader();
  doc.setFont("helvetica", "normal");
  for (const row of payload.attachments) {
    ensureSpace(14);
    if (y === PAGE_MARGIN) {
      drawDocHeader();
      doc.setFont("helvetica", "normal");
    }

    const values = [
      row.type,
      row.name,
      row.linkedItemName || row.linkedItemType,
      row.mimeType || "—",
      formatDate(row.uploadedAt),
    ];

    let x = PAGE_MARGIN;
    for (let index = 0; index < docColumns.length; index += 1) {
      const column = docColumns[index];
      doc.text(truncate(values[index], column.maxChars), x + 2, y);
      x += column.width;
    }
    addLine(10);
  }

  const pdfReceiptCount = payload.attachments.filter((row) => isPdfReceipt(row)).length;
  if (pdfReceiptCount > 0) {
    ensureSpace(24);
    addLine(8);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.text(
      `${pdfReceiptCount} receipt PDF file(s) are referenced in the index and not embedded as page images.`,
      PAGE_MARGIN,
      y
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZE_BODY);
    addLine(14);
  }

  const evidence = selectVisualEvidence(payload, options);
  if (evidence.length > 0) {
    doc.addPage();
    y = PAGE_MARGIN;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Visual Evidence Appendix", PAGE_MARGIN, y);
    addLine(16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FONT_SIZE_SMALL);
    doc.text(
      `Includes ${evidence.length} image(s) based on export options (${options.imageMode}, photos=${options.includePhotos}, receipts=${options.includeReceipts}).`,
      PAGE_MARGIN,
      y
    );
    addLine(16);

    for (const image of evidence) {
      ensureSpace(120);
      if (y !== PAGE_MARGIN) {
        addLine(6);
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FONT_SIZE_BODY);
      doc.text(truncate(image.title, 100), PAGE_MARGIN, y);
      addLine(12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FONT_SIZE_SMALL);
      doc.text(
        truncate(`${image.source} • ${image.linkedItemName || image.linkedItemId}`, 110),
        PAGE_MARGIN,
        y
      );
      addLine(8);

      const loaded = await loadImageForPdf(image.imageUrl);
      if (!loaded) {
        ensureSpace(12);
        doc.setFont("helvetica", "italic");
        doc.text("Unable to embed image source.", PAGE_MARGIN, y);
        doc.setFont("helvetica", "normal");
        addLine(12);
        continue;
      }

      const maxWidth = contentWidth;
      let maxHeight = pageHeight - PAGE_MARGIN - y;
      if (maxHeight < 80) {
        doc.addPage();
        y = PAGE_MARGIN;
        maxHeight = pageHeight - PAGE_MARGIN - y;
      }

      const scale = Math.min(maxWidth / loaded.width, maxHeight / loaded.height, 1);
      const renderWidth = loaded.width * scale;
      const renderHeight = loaded.height * scale;
      doc.addImage(loaded.dataUrl, "JPEG", PAGE_MARGIN, y, renderWidth, renderHeight, undefined, "FAST");
      y += renderHeight + 8;
    }
  }

  const filename = `full-armory-export-${toFileSafeTimestamp(payload.meta.generatedAt)}.pdf`;
  doc.save(filename);
}
