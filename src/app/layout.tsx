import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";

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
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased bg-[#080B0F] text-[#F7F9FC]`}>
        <div className="flex h-screen overflow-hidden">
          {/* Desktop sidebar */}
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            {/* Mobile header (hamburger) */}
            <MobileHeader />
            <main className="flex-1 overflow-y-auto min-w-0">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
