import { prisma } from "@/lib/prisma";
import { DEFAULT_EXPORT_FIELDS } from "@/lib/exports/full-armory-fields";

export type ArmoryField = (typeof DEFAULT_EXPORT_FIELDS)[number];

export async function buildArmoryRows(fields: string[]) {
  const [firearms, accessories, ammo] = await Promise.all([
    prisma.firearm.findMany(),
    prisma.accessory.findMany(),
    prisma.ammoStock.findMany(),
  ]);

  const rows = [
    ...firearms.map((item) => ({
      category: "firearm",
      name: item.name,
      manufacturer: item.manufacturer,
      model: item.model,
      type: item.type,
      caliber: item.caliber,
      serialNumber: item.serialNumber,
      purchasePrice: item.purchasePrice,
      currentValue: item.currentValue,
      acquisitionDate: item.acquisitionDate?.toISOString() ?? null,
      notes: item.notes,
    })),
    ...accessories.map((item) => ({
      category: "accessory",
      name: item.name,
      manufacturer: item.manufacturer,
      model: item.model,
      type: item.type,
      caliber: item.caliber,
      serialNumber: null,
      purchasePrice: item.purchasePrice,
      currentValue: null,
      acquisitionDate: item.acquisitionDate?.toISOString() ?? null,
      notes: item.notes,
    })),
    ...ammo.map((item) => ({
      category: "ammo",
      name: `${item.brand} ${item.caliber}`.trim(),
      manufacturer: item.brand,
      model: null,
      type: item.bulletType,
      caliber: item.caliber,
      serialNumber: null,
      purchasePrice: item.purchasePrice,
      currentValue: null,
      acquisitionDate: item.purchaseDate?.toISOString() ?? null,
      notes: item.notes,
    })),
  ];

  return rows.map((row) => {
    const selected: Record<string, unknown> = {};
    for (const field of fields) {
      selected[field] = row[field as keyof typeof row] ?? null;
    }
    return selected;
  });
}

export function rowsToCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => esc(row[header])).join(",")),
  ].join("\n");
}
