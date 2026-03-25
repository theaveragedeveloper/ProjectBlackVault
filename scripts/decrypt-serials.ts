import { PrismaClient } from "@prisma/client";
import { decryptField } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  const firearms = await prisma.firearm.findMany({
    where: { serialNumber: { startsWith: "enc:" } },
    select: { id: true, name: true, serialNumber: true },
  });

  console.log(`Found ${firearms.length} encrypted serial numbers.`);

  for (const firearm of firearms) {
    const plain = decryptField(firearm.serialNumber);
    if (plain && plain !== firearm.serialNumber && !plain.startsWith("[unreadable")) {
      await prisma.firearm.update({
        where: { id: firearm.id },
        data: { serialNumber: plain },
      });
      console.log(`Decrypted serial for firearm: ${firearm.name}`);
    }
  }

  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
