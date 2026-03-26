export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AccessoriesClientPage } from "./AccessoriesClientPage";

async function getAccessories() {
  const accessories = await prisma.accessory.findMany({
    include: {
      buildSlots: {
        include: {
          build: {
            select: {
              id: true,
              name: true,
              isActive: true,
              firearm: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: { roundCount: "desc" },
  });

  return accessories.map((accessory) => {
    const activeSlot = accessory.buildSlots.find((slot) => slot.build.isActive);
    return {
      ...accessory,
      currentBuild: activeSlot
        ? {
            id: activeSlot.build.id,
            name: activeSlot.build.name,
            slotType: activeSlot.slotType,
            firearm: activeSlot.build.firearm,
          }
        : null,
    };
  });
}

export default async function AccessoriesPage() {
  let accessories: Awaited<ReturnType<typeof getAccessories>>;
  try {
    accessories = await getAccessories();
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-vault-text-muted text-sm">Failed to load accessories.</p>
        <Link href="/accessories" className="text-[#00C2FF] text-sm hover:underline">Tap to retry</Link>
      </div>
    );
  }

  return <AccessoriesClientPage accessories={accessories} />;
}
