function envFlag(name: string, fallback = false): boolean {
  const raw = typeof process !== "undefined" && process.env ? process.env[name] : undefined;
  if (raw === undefined) return fallback;
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function normalizeIp(ip: string): string {
  if (ip === "local") return ip;
  if (ip.startsWith("::ffff:")) return ip.slice(7);
  return ip;
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((segment) => Number(segment));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT (common for VPN overlays)
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmark/private lab range
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
    return true; // link-local fe80::/10
  }
  return false;
}

export function isPrivateClientIp(ip: string): boolean {
  const normalized = normalizeIp(ip.trim());
  if (normalized === "local") return true;
  if (normalized.includes(".")) return isPrivateIpv4(normalized);
  if (normalized.includes(":")) return isPrivateIpv6(normalized);
  return false;
}

export function allowReleaseLookup(): boolean {
  return envFlag("ALLOW_RELEASE_LOOKUP", false);
}

export function allowImageSearchEgress(): boolean {
  return envFlag("ALLOW_IMAGE_SEARCH_EGRESS", false);
}

export function allowExternalImageUrls(): boolean {
  // NEXT_PUBLIC var is for client-side behavior; server fallback keeps one policy surface.
  return envFlag("NEXT_PUBLIC_ALLOW_EXTERNAL_IMAGE_URLS", envFlag("ALLOW_EXTERNAL_IMAGE_URLS", false));
}

export function requirePrivateNetworkForUpdates(): boolean {
  return envFlag("SYSTEM_UPDATE_REQUIRE_PRIVATE_NETWORK", true);
}
