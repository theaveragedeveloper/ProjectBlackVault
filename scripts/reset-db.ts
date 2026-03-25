import { PrismaClient } from "@prisma/client";
import * as readline from "readline";

const prisma = new PrismaClient();

async function confirm(): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question("This will permanently delete ALL data. Type CONFIRM to proceed: ", (answer) => {
      rl.close();
      resolve(answer.trim() === "CONFIRM");
    });
  });
}

async function main() {
  const ok = await confirm();
  if (!ok) {
    console.log("Aborted.");
    process.exit(0);
  }

  const tables = [
    { name: "SessionDrill", fn: () => prisma.sessionDrill.deleteMany() },
    { name: "RangeSessionAmmoLink", fn: () => prisma.rangeSessionAmmoLink.deleteMany() },
    { name: "AmmoTransaction", fn: () => prisma.ammoTransaction.deleteMany() },
    { name: "RangeSession", fn: () => prisma.rangeSession.deleteMany() },
    { name: "RoundCountLog", fn: () => prisma.roundCountLog.deleteMany() },
    { name: "BuildSlot", fn: () => prisma.buildSlot.deleteMany() },
    { name: "Build", fn: () => prisma.build.deleteMany() },
    { name: "Document", fn: () => prisma.document.deleteMany() },
    { name: "ImageCache", fn: () => prisma.imageCache.deleteMany() },
    { name: "Accessory", fn: () => prisma.accessory.deleteMany() },
    { name: "AmmoStock", fn: () => prisma.ammoStock.deleteMany() },
    { name: "Firearm", fn: () => prisma.firearm.deleteMany() },
  ] as const;

  for (const table of tables) {
    const result = await table.fn();
    console.log(`Deleted ${result.count} rows from ${table.name}`);
  }

  console.log("✓ Database reset complete. Ready for V1 release.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
