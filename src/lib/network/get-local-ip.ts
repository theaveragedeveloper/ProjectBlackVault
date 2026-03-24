import os, { NetworkInterfaceInfo } from "os";

function isPrivateLanIpv4(address: string): boolean {
  if (address.startsWith("169.254.")) return false;
  if (address.startsWith("192.168.")) return true;
  if (address.startsWith("10.")) return true;
  const parts = address.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  return parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

function priorityForAddress(address: string): number {
  if (address.startsWith("192.168.")) return 1;
  if (address.startsWith("10.")) return 2;
  if (isPrivateLanIpv4(address)) return 3;
  return 99;
}

function isInterfaceCandidate(name: string): boolean {
  const lower = name.toLowerCase();
  if (
    lower.includes("docker") ||
    lower.includes("veth") ||
    lower.includes("br-") ||
    lower.includes("lo") ||
    lower.includes("cni") ||
    lower.includes("flannel") ||
    lower.includes("tailscale") ||
    lower.includes("utun") ||
    lower.includes("tap") ||
    lower.includes("tun") ||
    lower.includes("vboxnet") ||
    lower.includes("vmnet")
  ) {
    return false;
  }
  return true;
}

function interfacePriority(name: string): number {
  const lower = name.toLowerCase();
  if (lower.includes("wlan") || lower.includes("wifi") || lower.includes("wi-fi") || lower === "en0") return 1;
  if (lower.startsWith("eth") || lower.startsWith("en") || lower.startsWith("eno") || lower.startsWith("ens")) return 2;
  return 3;
}

export function getLocalIp(): string | null {
  const interfaces = os.networkInterfaces();
  const candidates: Array<{ address: string; priority: number; interfacePriority: number }> = [];

  for (const [name, addresses] of Object.entries(interfaces)) {
    if (!addresses || !isInterfaceCandidate(name)) continue;

    for (const address of addresses as NetworkInterfaceInfo[]) {
      const family = address.family as string | number;
      const isIpv4 = family === "IPv4" || family === 4;

      if (!isIpv4 || address.internal || !isPrivateLanIpv4(address.address)) {
        continue;
      }

      candidates.push({
        address: address.address,
        priority: priorityForAddress(address.address),
        interfacePriority: interfacePriority(name),
      });
    }
  }

  candidates.sort(
    (a, b) =>
      a.priority - b.priority ||
      a.interfacePriority - b.interfacePriority ||
      a.address.localeCompare(b.address)
  );
  return candidates[0]?.address ?? null;
}
