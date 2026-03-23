import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UnlockScreen } from "@/components/auth/UnlockScreen";
import { hasValidSessionCookie, isPasswordModeEnabled } from "@/lib/server/auth";

export const metadata: Metadata = {
  title: "Project BlackVault",
  description: "Tactical firearm inventory & build management platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [passwordModeEnabled, hasValidSession] = await Promise.all([
    isPasswordModeEnabled(),
    hasValidSessionCookie(),
  ]);
  const shouldShowUnlock = passwordModeEnabled && !hasValidSession;

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
          {shouldShowUnlock ? (
            <UnlockScreen />
          ) : (
            <div className="flex h-screen overflow-hidden">
              <Sidebar passwordModeEnabled={passwordModeEnabled} />
              <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <MobileHeader passwordModeEnabled={passwordModeEnabled} />
                <main className="flex-1 overflow-y-auto min-w-0">
                  {children}
                </main>
              </div>
            </div>
          )}
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
