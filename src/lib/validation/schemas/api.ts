import { z } from "zod";

const optionalString = z.string().trim().optional();
const nullableString = z.string().trim().nullable().optional();
const optionalNumber = z.coerce.number().optional();
const optionalInt = z.coerce.number().int().optional();

export const authSchemas = {
  login: z.object({ password: z.string().max(1024) }).strict(),
  recover: z.object({ recoverySecret: z.string().min(1).max(1024), newPassword: z.string().min(8).max(1024) }).strict(),
};

export const encryptionSchemas = {
  importKey: z.object({ key: z.string().min(1).max(1024) }).strict(),
};

export const backupSchemas = {
  export: z.object({ includeDocumentFiles: z.coerce.boolean().optional() }).strict(),
  auto: z.object({ includeDocumentFiles: z.coerce.boolean().optional(), force: z.coerce.boolean().optional() }).strict(),
};

export const imagesSchemas = {
  search: z.object({ query: z.string().trim().min(1).max(200) }).strict(),
};

export const buildsSchemas = {
  create: z.object({ name: z.string().min(1), description: nullableString, firearmId: z.string().min(1), isActive: z.coerce.boolean().optional() }).strict(),
  update: z.object({ name: z.string().min(1).optional(), description: nullableString, isActive: z.coerce.boolean().optional() }).strict(),
  reorder: z.object({ sortOrder: z.coerce.number().int() }).strict(),
  slot: z.object({ slotType: z.string().min(1), accessoryId: z.string().nullable().optional() }).strict(),
};

export const maintenanceSchemas = {
  noteCreate: z.object({ firearmId: z.string().min(1), description: z.string().min(1), type: optionalString, date: optionalString, mileage: optionalNumber }).strict(),
  scheduleCreate: z.object({ firearmId: z.string().min(1), taskName: z.string().min(1), intervalType: z.string().min(1), intervalValue: z.coerce.number().int().positive(), notes: optionalString }).strict(),
  scheduleUpdate: z.object({ taskName: z.string().min(1), intervalType: z.string().min(1), intervalValue: z.coerce.number().int().positive(), notes: optionalString }).strict(),
  scheduleComplete: z.object({ notes: optionalString }).strict(),
};

export const accessoriesSchemas = {
  create: z.object({ name: z.string().min(1), manufacturer: optionalString, model: optionalString, type: z.string().min(1), caliber: optionalString, purchasePrice: optionalNumber, acquisitionDate: optionalString, notes: optionalString, imageUrl: optionalString, imageSource: optionalString, hasBattery: z.coerce.boolean().optional(), batteryType: optionalString, batteryChangedAt: optionalString, batteryIntervalDays: optionalInt, compatibleFirearmTypes: optionalString, compatibleCalibers: optionalString }).strict(),
  update: z.object({ name: z.string().min(1).optional(), manufacturer: optionalString, model: optionalString, type: z.string().min(1).optional(), caliber: optionalString, purchasePrice: optionalNumber, acquisitionDate: optionalString, notes: optionalString, imageUrl: optionalString, imageSource: optionalString, hasBattery: z.coerce.boolean().optional(), batteryType: optionalString, batteryChangedAt: optionalString, batteryIntervalDays: optionalInt, compatibleFirearmTypes: optionalString, compatibleCalibers: optionalString }).strict(),
  rounds: z.object({ rounds: z.coerce.number().int().positive(), note: optionalString }).strict(),
  battery: z.object({ changedAt: optionalString, intervalDays: optionalInt }).strict(),
};

export const firearmsSchemas = {
  create: z.object({ name: z.string().min(1), manufacturer: optionalString, model: optionalString, caliber: optionalString, serialNumber: optionalString, type: optionalString, acquisitionDate: optionalString, purchasePrice: optionalNumber, currentValue: optionalNumber, notes: optionalString, imageUrl: optionalString, imageSource: optionalString }).strict(),
  update: z.object({ name: z.string().min(1).optional(), manufacturer: optionalString, model: optionalString, caliber: optionalString, serialNumber: optionalString, type: optionalString, acquisitionDate: optionalString, purchasePrice: optionalNumber, currentValue: optionalNumber, notes: optionalString, imageUrl: optionalString, imageSource: optionalString }).strict(),
};

export const ammoSchemas = {
  create: z.object({ caliber: z.string().min(1), brand: optionalString, model: optionalString, grain: optionalInt, quantity: z.coerce.number().int().nonnegative(), costPerRound: optionalNumber, notes: optionalString }).strict(),
  update: z.object({ caliber: z.string().min(1).optional(), brand: optionalString, model: optionalString, grain: optionalInt, quantity: optionalInt, costPerRound: optionalNumber, notes: optionalString }).strict(),
  transaction: z.object({ type: z.enum(["ADD", "SUBTRACT"]), quantity: z.coerce.number().int().positive(), note: optionalString }).strict(),
};

export const documentsSchemas = {
  create: z.object({ name: z.string().min(1), type: optionalString, fileUrl: z.string().min(1), fileSize: optionalInt, mimeType: optionalString, notes: optionalString, firearmId: z.string().nullable().optional(), accessoryId: z.string().nullable().optional() }).strict(),
  update: z.object({ name: optionalString, type: optionalString, notes: optionalString, firearmId: z.string().nullable().optional(), accessoryId: z.string().nullable().optional() }).strict(),
};

export const drillSchemas = {
  template: z.object({ name: z.string().min(1), description: optionalString, category: optionalString, scoringType: optionalString, parTime: optionalNumber, maxScore: optionalInt }).strict(),
  log: z.object({ templateId: z.string().nullable().optional(), drillName: z.string().min(1), performedAt: optionalString, timeSeconds: optionalNumber, hits: optionalInt, totalShots: optionalInt, accuracy: optionalNumber, score: optionalNumber, notes: optionalString }).strict(),
};

export const rangeSchemas = {
  session: z.object({ firearmId: z.string().min(1), buildId: z.string().nullable().optional(), date: optionalString, roundsFired: z.coerce.number().int().nonnegative(), rangeName: optionalString, rangeLocation: optionalString, notes: optionalString, environment: optionalString, temperatureF: optionalNumber, windSpeedMph: optionalNumber, windDirection: optionalString, humidity: optionalNumber, lightCondition: optionalString, weatherNotes: optionalString, targetDistanceYd: optionalNumber, groupSizeIn: optionalNumber, groupSizeMoa: optionalNumber, numberOfGroups: optionalInt, groupNotes: optionalString }).strict(),
  sessionUpdate: z.object({ firearmId: z.string().min(1).optional(), buildId: z.string().nullable().optional(), date: optionalString, roundsFired: optionalInt, rangeName: optionalString, rangeLocation: optionalString, notes: optionalString, environment: optionalString, temperatureF: optionalNumber, windSpeedMph: optionalNumber, windDirection: optionalString, humidity: optionalNumber, lightCondition: optionalString, weatherNotes: optionalString, targetDistanceYd: optionalNumber, groupSizeIn: optionalNumber, groupSizeMoa: optionalNumber, numberOfGroups: optionalInt, groupNotes: optionalString }).strict(),
  drillCreate: z.object({ templateId: z.string().nullable().optional(), drillName: z.string().min(1), timeSeconds: optionalNumber, hits: optionalInt, totalShots: optionalInt, accuracy: optionalNumber, score: optionalNumber, notes: optionalString, sortOrder: optionalInt }).strict(),
  drillUpdate: z.object({ templateId: z.string().nullable().optional(), drillName: z.string().min(1).optional(), timeSeconds: optionalNumber, hits: optionalInt, totalShots: optionalInt, accuracy: optionalNumber, score: optionalNumber, notes: optionalString, sortOrder: optionalInt }).strict(),
};

export const dopeSchemas = {
  card: z.object({ firearmId: z.string().min(1), name: z.string().min(1), notes: optionalString, zeroRangeYd: z.coerce.number().positive(), profile: z.record(z.string(), z.unknown()), confirmedAt: optionalString }).strict(),
  cardUpdate: z.object({ firearmId: z.string().min(1).optional(), name: z.string().min(1).optional(), notes: optionalString, zeroRangeYd: z.coerce.number().positive().optional(), profile: z.record(z.string(), z.unknown()).optional(), confirmedAt: optionalString }).strict(),
};

export const settingsSchemas = {
  update: z.object({ appPassword: z.string().min(8).max(1024).optional(), encryptionEnabled: z.coerce.boolean().optional(), backupEnabled: z.coerce.boolean().optional(), backupPassphrase: z.string().optional() }).strict(),
};
