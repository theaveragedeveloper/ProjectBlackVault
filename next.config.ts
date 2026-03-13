import type { NextConfig } from "next";
import { TRUSTED_IMAGE_HOSTNAMES } from "./src/lib/image-host-allowlist";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: TRUSTED_IMAGE_HOSTNAMES.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
  },
  serverExternalPackages: ["@prisma/client", "sharp"],
};

export default nextConfig;
