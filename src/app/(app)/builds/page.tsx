export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/shared/PageHeader";
import { BuildsClient } from "@/components/builds/BuildsClient";

async function getAllFirearmsWithBuilds() {
  return prisma.firearm.findMany({
    include: {
      builds: {
        include: {
          slots: {
            select: {
              id: true,
              slotType: true,
              accessoryId: true,
              accessory: {
                select: { purchasePrice: true },
              },
            },
          },
        },
        orderBy: [{ isActive: "desc" }, { name: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });
}

export default async function BuildsPage() {
  const firearms = await getAllFirearmsWithBuilds();

  return (
    <div className="min-h-full">
      <PageHeader
        title="ALL LOADOUTS"
        subtitle="Configure and manage your firearm builds"
      />
      <BuildsClient initialFirearms={firearms} />
    </div>
  );
}
