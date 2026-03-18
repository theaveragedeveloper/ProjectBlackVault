import type { Metadata } from "next";
import "./globals.css";
import { NavShell } from "@/components/layout/NavShell";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";

export const metadata: Metadata = {
  title: "Project BlackVault",
  description: "Tactical firearm inventory & build management platform",
  applicationName: "Project BlackVault",
  manifest: "/manifest.webmanifest",
  icons: {
    shortcut: [{ url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" }],
    icon: [
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    other: [{ rel: "icon", url: "/icons/icon-32.png", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Project BlackVault",
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('vault-theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased bg-vault-bg text-vault-text">
        <ServiceWorkerRegistrar />
        <ThemeProvider>
          <NavShell>{children}</NavShell>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
