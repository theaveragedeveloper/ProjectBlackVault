// @ts-check
// Inlined from src/lib/image-host-allowlist.ts (can't require TS files in next.config.js)
const TRUSTED_IMAGE_HOSTNAMES = [
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
];

const isProduction = process.env.NODE_ENV === "production";
const isElectron = process.env.ELECTRON_APP === "1";
const allowExternalImageUrls =
  process.env.ALLOW_EXTERNAL_IMAGE_URLS === "true" ||
  process.env.NEXT_PUBLIC_ALLOW_EXTERNAL_IMAGE_URLS === "true";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProduction && !isElectron
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self' http://127.0.0.1:*",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: allowExternalImageUrls
      ? TRUSTED_IMAGE_HOSTNAMES.map((hostname) => ({
          protocol: "https",
          hostname: hostname.startsWith("*.") ? `*${hostname}` : hostname,
        }))
      : [],
  },
  serverExternalPackages: ["@prisma/client", "sharp"],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

module.exports = nextConfig;
