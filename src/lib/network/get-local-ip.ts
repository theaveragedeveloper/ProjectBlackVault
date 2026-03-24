import os, { NetworkInterfaceInfo } from "os";

export function getLocalIp(): string | null {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    const netInterface = interfaces[name];

    if (!netInterface) continue;

    for (const address of netInterface as NetworkInterfaceInfo[]) {
      const family = address.family as string | number;
      const isIpv4 = family === "IPv4" || family === 4;

      if (!isIpv4) continue;
      if (address.internal) continue;
      if (address.address === "127.0.0.1") continue;

      return address.address;
    }
  }

  return null;
}
