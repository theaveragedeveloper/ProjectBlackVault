import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { NavShell } from "@/components/layout/NavShell";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
      <body className={`${inter.variable} antialiased bg-vault-bg text-vault-text`}>
        <ThemeProvider>
          <NavShell>{children}</NavShell>
          <ThemeToggle />
        </ThemeProvider>
      </body>
    </html>
  );
}
