import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ─── APP SETTINGS ─────────────────────────────────────────────
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      enableImageSearch: false,
      defaultCurrency: "USD",
    },
  });
  console.log("  AppSettings created");

  // ─── FIREARMS ─────────────────────────────────────────────────
  const ddMk18 = await prisma.firearm.upsert({
    where: { serialNumber: "DD-001" },
    update: {},
    create: {
      name: "Daniel Defense MK18",
      manufacturer: "Daniel Defense",
      model: "MK18",
      caliber: "5.56x45mm NATO",
      serialNumber: "DD-001",
      type: "RIFLE",
      acquisitionDate: new Date("2023-01-15"),
      purchasePrice: 2400,
    },
  });

  const glock19 = await prisma.firearm.upsert({
    where: { serialNumber: "GL-001" },
    update: {},
    create: {
      name: "Glock 19 Gen5",
      manufacturer: "Glock",
      model: "19 Gen5",
      caliber: "9mm Luger",
      serialNumber: "GL-001",
      type: "PISTOL",
      acquisitionDate: new Date("2022-06-10"),
      purchasePrice: 650,
    },
  });

  const rem870 = await prisma.firearm.upsert({
    where: { serialNumber: "REM-001" },
    update: {},
    create: {
      name: "Remington 870",
      manufacturer: "Remington",
      model: "870",
      caliber: "12 Gauge",
      serialNumber: "REM-001",
      type: "SHOTGUN",
      acquisitionDate: new Date("2021-03-20"),
      purchasePrice: 450,
    },
  });

  const ruger1022 = await prisma.firearm.upsert({
    where: { serialNumber: "RUG-001" },
    update: {},
    create: {
      name: "Ruger 10/22",
      manufacturer: "Ruger",
      model: "10/22",
      caliber: ".22 LR",
      serialNumber: "RUG-001",
      type: "RIFLE",
      acquisitionDate: new Date("2020-08-05"),
      purchasePrice: 300,
    },
  });

  console.log(`  Firearms created: ${ddMk18.name}, ${glock19.name}, ${rem870.name}, ${ruger1022.name}`);

  // ─── ACCESSORIES ──────────────────────────────────────────────
  // We seed accessories with stable IDs so upsert works idempotently.
  const ACC_IDS = {
    acog: "acc_acog_001",
    suppressor: "acc_supp_001",
    handguard: "acc_hg_001",
    pmag: "acc_pmag_001",
    tlr1: "acc_tlr1_001",
    timney: "acc_timney_001",
    deltapoint: "acc_delta_001",
    ctrStock: "acc_ctr_001",
  };

  const acog = await prisma.accessory.upsert({
    where: { id: ACC_IDS.acog },
    update: {},
    create: {
      id: ACC_IDS.acog,
      name: "Trijicon ACOG 4x32",
      type: "OPTIC",
      manufacturer: "Trijicon",
      roundCount: 2500,
      purchasePrice: 1200,
    },
  });

  const suppressor = await prisma.accessory.upsert({
    where: { id: ACC_IDS.suppressor },
    update: {},
    create: {
      id: ACC_IDS.suppressor,
      name: "Surefire SOCOM762-RC2 Suppressor",
      type: "SUPPRESSOR",
      manufacturer: "Surefire",
      caliber: "5.56x45mm NATO",
      roundCount: 800,
      purchasePrice: 1800,
    },
  });

  const handguard = await prisma.accessory.upsert({
    where: { id: ACC_IDS.handguard },
    update: {},
    create: {
      id: ACC_IDS.handguard,
      name: "Daniel Defense RIS II Handguard",
      type: "HANDGUARD",
      manufacturer: "Daniel Defense",
      roundCount: 3200,
      purchasePrice: 350,
    },
  });

  const pmag = await prisma.accessory.upsert({
    where: { id: ACC_IDS.pmag },
    update: {},
    create: {
      id: ACC_IDS.pmag,
      name: "Magpul PMAG 30",
      type: "MAGAZINE",
      manufacturer: "Magpul",
      caliber: "5.56x45mm NATO",
      roundCount: 4100,
      purchasePrice: 18,
    },
  });

  const tlr1 = await prisma.accessory.upsert({
    where: { id: ACC_IDS.tlr1 },
    update: {},
    create: {
      id: ACC_IDS.tlr1,
      name: "Streamlight TLR-1 HL",
      type: "LIGHT",
      manufacturer: "Streamlight",
      roundCount: 1200,
      purchasePrice: 180,
    },
  });

  const timney = await prisma.accessory.upsert({
    where: { id: ACC_IDS.timney },
    update: {},
    create: {
      id: ACC_IDS.timney,
      name: "Timney Triggers Alpha Trigger",
      type: "TRIGGER",
      manufacturer: "Timney Triggers",
      roundCount: 5500,
      purchasePrice: 200,
    },
  });

  const deltapoint = await prisma.accessory.upsert({
    where: { id: ACC_IDS.deltapoint },
    update: {},
    create: {
      id: ACC_IDS.deltapoint,
      name: "Leupold DeltaPoint Pro Red Dot",
      type: "OPTIC",
      manufacturer: "Leupold",
      roundCount: 650,
      purchasePrice: 450,
    },
  });

  const ctrStock = await prisma.accessory.upsert({
    where: { id: ACC_IDS.ctrStock },
    update: {},
    create: {
      id: ACC_IDS.ctrStock,
      name: "Magpul CTR Stock",
      type: "STOCK",
      manufacturer: "Magpul",
      roundCount: 3200,
      purchasePrice: 95,
    },
  });

  console.log(
    `  Accessories created: ${acog.name}, ${suppressor.name}, ${handguard.name}, ${pmag.name}, ${tlr1.name}, ${timney.name}, ${deltapoint.name}, ${ctrStock.name}`
  );

  // ─── BUILDS FOR DD MK18 ───────────────────────────────────────
  // Delete existing builds for MK18 to avoid slot conflicts on re-seed.
  // We identify them by firearmId and name so the seed stays idempotent.
  const existingPatrolBuild = await prisma.build.findFirst({
    where: { firearmId: ddMk18.id, name: "Patrol Build" },
  });
  const existingSuppressedBuild = await prisma.build.findFirst({
    where: { firearmId: ddMk18.id, name: "Suppressed Build" },
  });

  const patrolBuild = existingPatrolBuild
    ? existingPatrolBuild
    : await prisma.build.create({
        data: {
          name: "Patrol Build",
          isActive: true,
          firearmId: ddMk18.id,
          slots: {
            create: [
              { slotType: "OPTIC", accessoryId: acog.id },
              { slotType: "HANDGUARD", accessoryId: handguard.id },
              { slotType: "MAGAZINE", accessoryId: pmag.id },
              { slotType: "LIGHT", accessoryId: tlr1.id },
            ],
          },
        },
      });

  const suppressedBuild = existingSuppressedBuild
    ? existingSuppressedBuild
    : await prisma.build.create({
        data: {
          name: "Suppressed Build",
          isActive: false,
          firearmId: ddMk18.id,
          slots: {
            create: [
              { slotType: "SUPPRESSOR", accessoryId: suppressor.id },
              { slotType: "OPTIC", accessoryId: acog.id },
            ],
          },
        },
      });

  console.log(`  DD MK18 builds: ${patrolBuild.name} (active), ${suppressedBuild.name}`);

  // ─── BUILD FOR GLOCK 19 ────────────────────────────────────────
  const existingCarryConfig = await prisma.build.findFirst({
    where: { firearmId: glock19.id, name: "Carry Config" },
  });

  const carryConfig = existingCarryConfig
    ? existingCarryConfig
    : await prisma.build.create({
        data: {
          name: "Carry Config",
          isActive: true,
          firearmId: glock19.id,
          slots: {
            create: [
              { slotType: "OPTIC", accessoryId: deltapoint.id },
              { slotType: "LIGHT", accessoryId: tlr1.id },
            ],
          },
        },
      });

  console.log(`  Glock 19 builds: ${carryConfig.name}`);

  // ─── AMMO STOCKS ──────────────────────────────────────────────
  await prisma.ammoStock.create({
    data: {
      caliber: "5.56x45mm NATO",
      brand: "Federal",
      bulletType: "FMJ",
      grainWeight: 55,
      quantity: 1800,
      lowStockAlert: 200,
    },
  }).catch(() => {
    // If already exists from a prior seed, skip silently
  });

  await prisma.ammoStock.create({
    data: {
      caliber: "9mm Luger",
      brand: "Speer",
      bulletType: "JHP",
      grainWeight: 124,
      quantity: 350,
      lowStockAlert: 100,
    },
  }).catch(() => {});

  await prisma.ammoStock.create({
    data: {
      caliber: "12 Gauge",
      brand: "Federal",
      bulletType: "Other",
      quantity: 100,
      lowStockAlert: 25,
    },
  }).catch(() => {});

  await prisma.ammoStock.create({
    data: {
      caliber: ".22 LR",
      brand: "CCI",
      bulletType: "FMJ",
      grainWeight: 40,
      quantity: 2500,
      lowStockAlert: 500,
    },
  }).catch(() => {});

  await prisma.ammoStock.create({
    data: {
      caliber: "9mm Luger",
      brand: "Winchester",
      bulletType: "FMJ",
      grainWeight: 115,
      quantity: 800,
    },
  }).catch(() => {});

  // Count how many ammo records now exist (handles re-runs gracefully)
  const ammoCount = await prisma.ammoStock.count();
  console.log(`  Ammo stocks: ${ammoCount} records in table`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
