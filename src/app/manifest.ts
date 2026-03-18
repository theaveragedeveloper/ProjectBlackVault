import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Project BlackVault",
    short_name: "BlackVault",
    description: "Self-hosted firearm inventory and range tracking platform.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0D1117",
    theme_color: "#00C2FF",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
