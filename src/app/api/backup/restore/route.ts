import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { requireStepUpAuth } from "@/lib/server/step-up-auth";
import { requireAuth } from "@/lib/server/auth";

// ─── Type helpers ──────────────────────────────────────────────────────────

function toDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(v as string);
  return isNaN(d.getTime()) ? null : d;
}

function toDateRequired(v: unknown): Date {
  return toDate(v) ?? new Date();
}

function str(v: unknown): string {
  return v != null ? String(v) : "";
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function intOrNull(v: unknown): number | null {
  const n = numOrNull(v);
  return n != null ? Math.round(n) : null;
}

function boolOr(v: unknown, def: boolean): boolean {
  if (v == null) return def;
  return Boolean(v);
}

// ─── Route ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    const stepUp = await requireStepUpAuth(request);
    if (stepUp) return stepUp;

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    // 1 restore per 5 minutes per IP
    const rate = await enforceRateLimit({
      key: `backup:restore:${ip}`,
      windowMs: 5 * 60 * 1000,
      maxAttempts: 1,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Restore is rate-limited. Try again in ${rate.retryAfterSec} seconds.` },
        { status: 429 }
      );
    }

    // The client sends the decrypted backup JSON directly (decryption happens in the browser).
    // Max 100 MB — large vaults with embedded document files can be substantial.
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 100 * 1024 * 1024) {
      return NextResponse.json({ error: "Payload too large (max 100 MB)" }, { status: 413 });
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // 2. Validate meta
    const meta = body.meta as Record<string, unknown> | undefined;
    if (!meta || meta.app !== "ProjectBlackVault") {
      return NextResponse.json(
        { error: "Invalid backup file: missing or mismatched app identifier." },
        { status: 400 }
      );
    }
    if (meta.formatVersion !== 1) {
      return NextResponse.json(
        { error: `Unsupported backup format version: ${meta.formatVersion}. Only version 1 is supported.` },
        { status: 400 }
      );
    }

    const data = body.data as Record<string, unknown[]> | undefined;
    if (!data || typeof data !== "object") {
      return NextResponse.json({ error: "Backup data payload is missing or malformed." }, { status: 400 });
    }

    const firearms       = (data.firearms       as Record<string, unknown>[]) ?? [];
    const accessories    = (data.accessories    as Record<string, unknown>[]) ?? [];
    const builds         = (data.builds         as Record<string, unknown>[]) ?? [];
    const buildSlots     = (data.buildSlots     as Record<string, unknown>[]) ?? [];
    const maintenanceNotes     = (data.maintenanceNotes     as Record<string, unknown>[]) ?? [];
    const maintenanceSchedules = (data.maintenanceSchedules as Record<string, unknown>[]) ?? [];
    const rangeSessions  = (data.rangeSessions  as Record<string, unknown>[]) ?? [];
    const drillTemplates = (data.drillTemplates as Record<string, unknown>[]) ?? [];
    const sessionDrills  = (data.sessionDrills  as Record<string, unknown>[]) ?? [];
    const drillLogs      = (data.drillLogs      as Record<string, unknown>[]) ?? [];
    const ammo           = (data.ammo           as Record<string, unknown>[]) ?? [];
    const ammoTransactions = (data.ammoTransactions as Record<string, unknown>[]) ?? [];
    const documents      = (data.documents      as Record<string, unknown>[]) ?? [];
    const sessionAmmoLinks = (data.sessionAmmoLinks as unknown as Record<string, unknown>[]) ?? [];
    const settings       = data.settings as unknown as Record<string, unknown> | null | undefined;

    // 3. Run everything in a single transaction
    await prisma.$transaction(
      async (tx) => {
        // ── Delete in reverse-dependency order ──────────────────

        // Session links (SessionAmmoLink cascades from session/transaction)
        await tx.sessionAmmoLink.deleteMany({});
        await tx.ammoTransaction.deleteMany({});
        await tx.ammoStock.deleteMany({});

        await tx.drillLog.deleteMany({});
        await tx.sessionDrill.deleteMany({});
        await tx.drillTemplate.deleteMany({});
        await tx.sessionFirearm.deleteMany({});
        await tx.rangeSession.deleteMany({});

        await tx.maintenanceCompletion.deleteMany({});
        await tx.maintenanceSchedule.deleteMany({});
        await tx.maintenanceNote.deleteMany({});

        await tx.dopeCard.deleteMany({});
        await tx.buildSlot.deleteMany({});
        await tx.build.deleteMany({});

        await tx.roundCountLog.deleteMany({});
        await tx.document.deleteMany({});
        await tx.accessory.deleteMany({});
        await tx.firearm.deleteMany({});

        // ── Re-insert in dependency order ───────────────────────

        // Settings (upsert — keep the singleton row)
        if (settings) {
          await tx.appSettings.upsert({
            where: { id: "singleton" },
            update: {
              appPassword:      settings.appPassword != null ? str(settings.appPassword) : undefined,
              defaultCurrency:  settings.defaultCurrency ? str(settings.defaultCurrency) : undefined,
              encryptionKey:    settings.encryptionKey ? str(settings.encryptionKey) : undefined,
            },
            create: {
              id: "singleton",
              appPassword:      settings.appPassword ? str(settings.appPassword) : null,
              defaultCurrency:  settings.defaultCurrency ? str(settings.defaultCurrency) : "USD",
              encryptionKey:    settings.encryptionKey ? str(settings.encryptionKey) : null,
            },
          });
        }

        // Firearms
        if (firearms.length) {
          await tx.firearm.createMany({
            data: firearms.map((f) => ({
              id:              str(f.id),
              name:            str(f.name),
              manufacturer:    str(f.manufacturer),
              model:           str(f.model),
              caliber:         str(f.caliber),
              serialNumber:    f.serialNumber ? str(f.serialNumber) : null,
              type:            str(f.type),
              acquisitionDate: toDate(f.acquisitionDate),
              purchasePrice:   numOrNull(f.purchasePrice),
              currentValue:    numOrNull(f.currentValue),
              notes:           f.notes ? str(f.notes) : null,
              imageUrl:        f.imageUrl ? str(f.imageUrl) : null,
              imageSource:     f.imageSource ? str(f.imageSource) : null,
              createdAt:       toDateRequired(f.createdAt),
              updatedAt:       toDateRequired(f.updatedAt),
            })),
          });
        }

        // Accessories
        if (accessories.length) {
          await tx.accessory.createMany({
            data: accessories.map((a) => ({
              id:                     str(a.id),
              name:                   str(a.name),
              manufacturer:           str(a.manufacturer),
              model:                  a.model ? str(a.model) : null,
              type:                   str(a.type),
              caliber:                a.caliber ? str(a.caliber) : null,
              purchasePrice:          numOrNull(a.purchasePrice),
              acquisitionDate:        toDate(a.acquisitionDate),
              notes:                  a.notes ? str(a.notes) : null,
              imageUrl:               a.imageUrl ? str(a.imageUrl) : null,
              imageSource:            a.imageSource ? str(a.imageSource) : null,
              roundCount:             intOrNull(a.roundCount) ?? 0,
              hasBattery:             boolOr(a.hasBattery, false),
              batteryType:            a.batteryType ? str(a.batteryType) : null,
              batteryChangedAt:       toDate(a.batteryChangedAt),
              batteryIntervalDays:    intOrNull(a.batteryIntervalDays),
              compatibleFirearmTypes: a.compatibleFirearmTypes ? str(a.compatibleFirearmTypes) : null,
              compatibleCalibers:     a.compatibleCalibers ? str(a.compatibleCalibers) : null,
              createdAt:              toDateRequired(a.createdAt),
              updatedAt:              toDateRequired(a.updatedAt),
            })),
          });
        }

        // Documents
        if (documents.length) {
          await tx.document.createMany({
            data: documents.map((d) => ({
              id:          str(d.id),
              name:        str(d.name),
              type:        d.type ? str(d.type) : undefined,
              fileUrl:     str(d.fileUrl),
              fileSize:    intOrNull(d.fileSize),
              mimeType:    d.mimeType ? str(d.mimeType) : null,
              notes:       d.notes ? str(d.notes) : null,
              firearmId:   d.firearmId ? str(d.firearmId) : null,
              accessoryId: d.accessoryId ? str(d.accessoryId) : null,
              createdAt:   toDateRequired(d.createdAt),
              updatedAt:   toDateRequired(d.updatedAt),
            })),
          });
        }

        // Builds
        if (builds.length) {
          await tx.build.createMany({
            data: builds.map((b) => ({
              id:          str(b.id),
              name:        str(b.name),
              description: b.description ? str(b.description) : null,
              isActive:    boolOr(b.isActive, false),
              sortOrder:   intOrNull(b.sortOrder) ?? 0,
              firearmId:   str(b.firearmId),
              createdAt:   toDateRequired(b.createdAt),
              updatedAt:   toDateRequired(b.updatedAt),
            })),
          });
        }

        // BuildSlots
        if (buildSlots.length) {
          await tx.buildSlot.createMany({
            data: buildSlots.map((s) => ({
              id:          str(s.id),
              buildId:     str(s.buildId),
              slotType:    str(s.slotType),
              accessoryId: s.accessoryId ? str(s.accessoryId) : null,
              positionX:   numOrNull(s.positionX),
              positionY:   numOrNull(s.positionY),
              scaleX:      numOrNull(s.scaleX) ?? 1.0,
              scaleY:      numOrNull(s.scaleY) ?? 1.0,
              layerIndex:  intOrNull(s.layerIndex) ?? 0,
            })),
          });
        }

        // Maintenance
        if (maintenanceNotes.length) {
          await tx.maintenanceNote.createMany({
            data: maintenanceNotes.map((n) => ({
              id:          str(n.id),
              firearmId:   str(n.firearmId),
              date:        toDateRequired(n.date),
              type:        str(n.type) || "other",
              description: str(n.description),
              mileage:     intOrNull(n.mileage),
              createdAt:   toDateRequired(n.createdAt),
              updatedAt:   toDateRequired(n.updatedAt),
            })),
          });
        }

        if (maintenanceSchedules.length) {
          await tx.maintenanceSchedule.createMany({
            data: maintenanceSchedules.map((s) => ({
              id:              str(s.id),
              firearmId:       str(s.firearmId),
              taskName:        str(s.taskName),
              intervalType:    str(s.intervalType),
              intervalValue:   intOrNull(s.intervalValue) ?? 1,
              lastCompletedAt: toDate(s.lastCompletedAt),
              lastRoundCount:  intOrNull(s.lastRoundCount),
              notes:           s.notes ? str(s.notes) : null,
              createdAt:       toDateRequired(s.createdAt),
              updatedAt:       toDateRequired(s.updatedAt),
            })),
          });
        }

        // Range sessions
        if (rangeSessions.length) {
          await tx.rangeSession.createMany({
            data: rangeSessions.map((r) => ({
              id:               str(r.id),
              date:             toDateRequired(r.date),
              rangeName:        r.rangeName ? str(r.rangeName) : null,
              rangeLocation:    r.rangeLocation ? str(r.rangeLocation) : null,
              notes:            r.notes ? str(r.notes) : null,
              environment:      r.environment ? str(r.environment) : null,
              temperatureF:     numOrNull(r.temperatureF),
              windSpeedMph:     numOrNull(r.windSpeedMph),
              windDirection:    r.windDirection ? str(r.windDirection) : null,
              humidity:         numOrNull(r.humidity),
              lightCondition:   r.lightCondition ? str(r.lightCondition) : null,
              weatherNotes:     r.weatherNotes ? str(r.weatherNotes) : null,
              targetDistanceYd: numOrNull(r.targetDistanceYd),
              groupSizeIn:      numOrNull(r.groupSizeIn),
              groupSizeMoa:     numOrNull(r.groupSizeMoa),
              numberOfGroups:   intOrNull(r.numberOfGroups),
              groupNotes:       r.groupNotes ? str(r.groupNotes) : null,
              createdAt:        toDateRequired(r.createdAt),
              updatedAt:        toDateRequired(r.updatedAt),
            })),
          });
        }

        // Drill templates
        if (drillTemplates.length) {
          await tx.drillTemplate.createMany({
            data: drillTemplates.map((t) => ({
              id:          str(t.id),
              name:        str(t.name),
              description: t.description ? str(t.description) : null,
              category:    str(t.category) || "CUSTOM",
              scoringType: str(t.scoringType) || "NOTES_ONLY",
              parTime:     numOrNull(t.parTime),
              maxScore:    intOrNull(t.maxScore),
              isBuiltIn:   boolOr(t.isBuiltIn, false),
              createdAt:   toDateRequired(t.createdAt),
              updatedAt:   toDateRequired(t.updatedAt),
            })),
          });
        }

        // Session drills
        if (sessionDrills.length) {
          await tx.sessionDrill.createMany({
            data: sessionDrills.map((d) => ({
              id:          str(d.id),
              sessionId:   str(d.sessionId),
              templateId:  d.templateId ? str(d.templateId) : null,
              drillName:   str(d.drillName),
              timeSeconds: numOrNull(d.timeSeconds),
              hits:        intOrNull(d.hits),
              totalShots:  intOrNull(d.totalShots),
              accuracy:    numOrNull(d.accuracy),
              score:       numOrNull(d.score),
              notes:       d.notes ? str(d.notes) : null,
              sortOrder:   intOrNull(d.sortOrder) ?? 0,
              createdAt:   toDateRequired(d.createdAt),
            })),
          });
        }

        // Drill logs
        if (drillLogs.length) {
          await tx.drillLog.createMany({
            data: drillLogs.map((l) => ({
              id:           str(l.id),
              templateId:   l.templateId ? str(l.templateId) : null,
              drillName:    str(l.drillName),
              performedAt:  toDateRequired(l.performedAt),
              timeSeconds:  numOrNull(l.timeSeconds),
              hits:         intOrNull(l.hits),
              totalShots:   intOrNull(l.totalShots),
              accuracy:     numOrNull(l.accuracy),
              score:        numOrNull(l.score),
              notes:        l.notes ? str(l.notes) : null,
              createdAt:    toDateRequired(l.createdAt),
              updatedAt:    toDateRequired(l.updatedAt),
            })),
          });
        }

        // Ammo stock
        if (ammo.length) {
          await tx.ammoStock.createMany({
            data: ammo.map((a) => ({
              id:              str(a.id),
              caliber:         str(a.caliber),
              brand:           str(a.brand),
              grainWeight:     numOrNull(a.grainWeight),
              bulletType:      a.bulletType ? str(a.bulletType) : null,
              quantity:        intOrNull(a.quantity) ?? 0,
              purchasePrice:   numOrNull(a.purchasePrice),
              purchaseDate:    toDate(a.purchaseDate),
              storageLocation: a.storageLocation ? str(a.storageLocation) : null,
              lowStockAlert:   intOrNull(a.lowStockAlert),
              notes:           a.notes ? str(a.notes) : null,
              createdAt:       toDateRequired(a.createdAt),
              updatedAt:       toDateRequired(a.updatedAt),
            })),
          });
        }

        // Ammo transactions
        if (ammoTransactions.length) {
          await tx.ammoTransaction.createMany({
            data: ammoTransactions.map((t) => ({
              id:           str(t.id),
              stockId:      str(t.stockId),
              type:         str(t.type),
              quantity:     intOrNull(t.quantity) ?? 0,
              previousQty:  intOrNull(t.previousQty) ?? 0,
              newQty:       intOrNull(t.newQty) ?? 0,
              note:         t.note ? str(t.note) : null,
              transactedAt: toDateRequired(t.transactedAt),
            })),
          });
        }

        // Session ammo links (depends on rangeSessions + ammoTransactions)
        if (sessionAmmoLinks.length) {
          await tx.sessionAmmoLink.createMany({
            data: sessionAmmoLinks.map((l) => ({
              id:            str(l.id),
              sessionId:     str(l.sessionId),
              transactionId: str(l.transactionId),
            })),
          });
        }
      },
      { timeout: 60_000 }
    );

    return NextResponse.json({
      ok: true,
      restored: {
        firearms:            firearms.length,
        accessories:         accessories.length,
        builds:              builds.length,
        buildSlots:          buildSlots.length,
        maintenanceNotes:    maintenanceNotes.length,
        maintenanceSchedules:maintenanceSchedules.length,
        rangeSessions:       rangeSessions.length,
        drillTemplates:      drillTemplates.length,
        sessionDrills:       sessionDrills.length,
        drillLogs:           drillLogs.length,
        ammoStocks:          ammo.length,
        ammoTransactions:    ammoTransactions.length,
        documents:           documents.length,
        sessionAmmoLinks:    sessionAmmoLinks.length,
      },
    });
  } catch (error) {
    console.error("POST /api/backup/restore error:", error);
    return NextResponse.json({ error: "Restore failed. Check server logs for details." }, { status: 500 });
  }
}
