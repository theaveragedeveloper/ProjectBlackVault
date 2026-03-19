import { prisma } from "@/lib/prisma";

const SETTINGS_SINGLETON_ID = "singleton";

export function hasVaultPassword(appPassword: string | null | undefined): appPassword is string {
  return typeof appPassword === "string" && appPassword.length > 0;
}

export async function getVaultSetupState() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_SINGLETON_ID },
    select: { appPassword: true },
  });

  const passwordRequired = hasVaultPassword(settings?.appPassword);
  return {
    passwordRequired,
    requiresSetup: !passwordRequired,
  };
}
