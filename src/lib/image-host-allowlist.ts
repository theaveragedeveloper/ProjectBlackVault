export const TRUSTED_IMAGE_HOSTNAMES = [
  "images.unsplash.com",
  "plus.unsplash.com",
  "images.pexels.com",
  "cdn.pixabay.com",
  "i.imgur.com",
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "*.gstatic.com",
] as const;

const NORMALIZED_TRUSTED_IMAGE_HOSTNAMES = TRUSTED_IMAGE_HOSTNAMES.map((hostname) =>
  hostname.toLowerCase()
);

function hostnameMatchesAllowlist(hostname: string, allowlistEntry: string): boolean {
  if (allowlistEntry.startsWith("*.")) {
    const suffix = allowlistEntry.slice(2);
    return hostname === suffix || hostname.endsWith(`.${suffix}`);
  }

  return hostname === allowlistEntry;
}

export function isTrustedExternalImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") {
      return false;
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    return NORMALIZED_TRUSTED_IMAGE_HOSTNAMES.some((entry) =>
      hostnameMatchesAllowlist(hostname, entry)
    );
  } catch {
    return false;
  }
}

export function isLocalImagePath(url: string): boolean {
  return url.startsWith("/");
}
