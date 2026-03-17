import type { NextConfig } from "next";
import { TRUSTED_IMAGE_HOSTNAMES } from "./src/lib/image-host-allowlist";

const isProduction = process.env.NODE_ENV === "production";
const isElectron = process.env.ELECTRON_APP === "1";
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
  // HSTS: only in production browser deploys — Electron serves over plain HTTP
  // on localhost so HSTS is both useless and potentially confusing.
  ...(isProduction && !isElectron
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
  {
    // 'unsafe-inline' required for the theme-flash inline script in layout.tsx.
    // connect-src includes 127.0.0.1 so Electron-served pages can reach the API.
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
