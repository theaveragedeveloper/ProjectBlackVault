import os from "node:os";

export function getLocalIp(): string | null {
  const networkInterfaces = os.networkInterfaces();

  for (const interfaceAddresses of Object.values(networkInterfaces)) {
    if (!interfaceAddresses) {
      continue;
    }

    for (const address of interfaceAddresses) {
      const isIpv4 =
        address.family === "IPv4" ||
        (typeof address.family === "number" && address.family === 4);

      if (!isIpv4 || address.internal || address.address === "127.0.0.1") {
        continue;
      }

      return address.address;
    }
  }

  return null;
}
