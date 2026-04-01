import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { GlobalSearch } from "@/components/search/GlobalSearch";

export const viewport: Viewport = {
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "BlackVault",
  description: "Tactical firearm inventory & build management platform",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
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
        <ThemeProvider>
          <div className="flex min-h-svh">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 min-h-svh overflow-x-clip">
              <MobileHeader />
              <main className="flex-1 min-h-0 overflow-y-auto overflow-x-clip overscroll-contain min-w-0 pb-safe">
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
            </div>
          </div>
          <ThemeToggle />
          <GlobalSearch />
        </ThemeProvider>
      </body>
    </html>
  );
}
