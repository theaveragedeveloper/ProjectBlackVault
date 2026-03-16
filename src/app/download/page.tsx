"use client";

import { useEffect, useState } from "react";
import { Download, Monitor, Apple, Terminal, ExternalLink, Info } from "lucide-react";
import Link from "next/link";

const DOWNLOADS = {
  windows: {
    label: "Download for Windows",
    detail: "Windows 10 / 11 · .exe installer",
    href: "https://github.com/theaveragedeveloper/ProjectBlackVault/releases/latest/download/ProjectBlackVault-Setup.exe",
    icon: Monitor,
    ext: ".exe",
  },
  mac: {
    label: "Download for macOS",
    detail: "macOS 12+ · .dmg",
    href: "https://github.com/theaveragedeveloper/ProjectBlackVault/releases/latest",
    icon: Apple,
    ext: ".dmg",
  },
  linux: {
    label: "Download for Linux",
    detail: "x86_64 · AppImage",
    href: "https://github.com/theaveragedeveloper/ProjectBlackVault/releases/latest/download/ProjectBlackVault-Setup.AppImage",
    icon: Terminal,
    ext: ".AppImage",
  },
} as const;

type Platform = keyof typeof DOWNLOADS;

function detectPlatform(): Platform | null {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("windows")) return "windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "mac";
  if (ua.includes("linux")) return "linux";
  return null;
}

export default function DownloadPage() {
  const [platform, setPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const detected = platform ? DOWNLOADS[platform] : null;
  const HeroIcon = detected?.icon ?? Download;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-vault-text">
          Desktop Launcher
        </h1>
        <p className="text-sm text-vault-text-muted">
          Manage your self-hosted ProjectBlackVault instance without a terminal
        </p>
      </div>

      {/* Hero CTA */}
      <div className="flex flex-col items-center gap-3">
        {detected ? (
          <a
            href={detected.href}
            className="flex items-center gap-3 bg-[#00C853] hover:bg-[#00B847] text-black font-bold text-base px-8 py-4 rounded-xl transition-colors"
          >
            <HeroIcon className="w-5 h-5" />
            {detected.label}
          </a>
        ) : (
          <a
            href="https://github.com/theaveragedeveloper/ProjectBlackVault/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#00C853] hover:bg-[#00B847] text-black font-bold text-base px-8 py-4 rounded-xl transition-colors"
          >
            <Download className="w-5 h-5" />
            Browse All Downloads
          </a>
        )}
        {detected && (
          <p className="text-xs text-vault-text-faint">{detected.detail}</p>
        )}
      </div>

      {/* Network/VPN callout */}
      <div className="flex gap-3 bg-vault-surface border border-[#00C2FF]/20 border-l-[3px] border-l-[#00C2FF] rounded-lg p-4">
        <Info className="w-4 h-4 text-[#00C2FF] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-vault-text-muted leading-relaxed">
          <span className="text-vault-text font-medium">Already using this app?</span>{" "}
          If you&apos;re accessing ProjectBlackVault from a browser over your network or VPN,
          you don&apos;t need to download anything — you&apos;re already using it.
          The launcher is only needed on the machine that runs Docker.
        </div>
      </div>

      {/* Platform cards */}
      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-vault-text-faint mb-3">
          All Platforms
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(DOWNLOADS) as [Platform, typeof DOWNLOADS[Platform]][]).map(
            ([key, info]) => {
              const Icon = info.icon;
              const isDetected = key === platform;
              return (
                <a
                  key={key}
                  href={info.href}
                  className={`flex flex-col items-center gap-2 p-5 bg-vault-surface rounded-xl border transition-all text-center hover:border-[#00C2FF]/40 ${
                    isDetected
                      ? "border-[#00C853]/60 shadow-[0_0_12px_rgba(0,200,83,0.12)]"
                      : "border-vault-border"
                  }`}
                >
                  <Icon className={`w-7 h-7 ${isDetected ? "text-[#00C853]" : "text-vault-text-muted"}`} />
                  <div>
                    <div className="text-sm font-semibold text-vault-text capitalize">
                      {key === "mac" ? "macOS" : key.charAt(0).toUpperCase() + key.slice(1)}
                      {isDetected && (
                        <span className="ml-2 text-[10px] text-[#00C853] font-mono uppercase tracking-wider">
                          detected
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-vault-text-faint mt-0.5">{info.detail}</div>
                  </div>
                  <span className="text-xs bg-vault-surface-2 border border-vault-border px-2 py-1 rounded-full text-vault-text-muted">
                    {info.ext}
                  </span>
                </a>
              );
            }
          )}
        </div>
      </div>

      {/* Setup steps */}
      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-vault-text-faint">
          Setup Steps
        </p>
        <ol className="space-y-3">
          {[
            "Download and run the launcher for your platform above",
            "If Docker isn't installed, the launcher will offer to install it automatically",
            "Follow the first-run setup wizard — takes about 30 seconds",
            "Click Open App in the launcher to start using your vault",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-vault-text-muted">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-vault-surface border border-vault-border text-[#00C2FF] text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Footer links */}
      <div className="flex items-center justify-between pt-2 border-t border-vault-border text-xs text-vault-text-faint">
        <Link href="/settings" className="hover:text-vault-text transition-colors">
          ← Back to Settings
        </Link>
        <a
          href="https://github.com/theaveragedeveloper/ProjectBlackVault/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-vault-text transition-colors"
        >
          Browse all releases
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
