import type { NextConfig } from "next";
import { TRUSTED_IMAGE_HOSTNAMES } from "./src/lib/image-host-allowlist";

const isProduction = process.env.NODE_ENV === "production";
const allowExternalImageUrls =
  process.env.ALLOW_EXTERNAL_IMAGE_URLS === "true" ||
  process.env.NEXT_PUBLIC_ALLOW_EXTERNAL_IMAGE_URLS === "true";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // HSTS: only set in production — local dev is typically HTTP, and sending HSTS
  // over HTTP has no effect (and can confuse some tools).
  ...(isProduction
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
  {
    // 'unsafe-inline' required for the theme-flash inline script in layout.tsx
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: allowExternalImageUrls
      ? TRUSTED_IMAGE_HOSTNAMES.map((hostname) => ({
          protocol: "https",
          hostname,
        }))
      : [],
  },
  serverExternalPackages: ["@prisma/client", "sharp"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
