const SETTINGS_SINGLETON_ID = "singleton";

export type VaultSetupState = {
  passwordRequired: boolean;
  requiresSetup: boolean;
};

export function hasVaultPassword(appPassword: string | null | undefined): appPassword is string {
  return typeof appPassword === "string" && appPassword.length > 0;
}

export function deriveVaultSetupState(appPassword: string | null | undefined): VaultSetupState {
  const passwordRequired = hasVaultPassword(appPassword);
  return {
    passwordRequired,
    requiresSetup: !passwordRequired,
  };
}

export async function getVaultSetupState(): Promise<VaultSetupState> {
  const { prisma } = await import("@/lib/prisma");
  const settings = await prisma.appSettings.findUnique({
    where: { id: SETTINGS_SINGLETON_ID },
    select: { appPassword: true },
  });

  return deriveVaultSetupState(settings?.appPassword);
}
