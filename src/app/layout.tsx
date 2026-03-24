import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export const metadata: Metadata = {
  title: "Project BlackVault",
  description: "Tactical firearm inventory & build management platform",
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
          <div className="flex h-dvh min-h-dvh overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
              <MobileHeader />
              <main className="flex-1 overflow-y-auto overscroll-contain min-w-0 pb-safe">
                {children}
              </main>
            </div>
          </div>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
