"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Download, ExternalLink, Info, Monitor, Apple, Terminal } from "lucide-react";
import Link from "next/link";

const RELEASES_URL = "https://github.com/theaveragedeveloper/ProjectBlackVault/releases/latest";

const DOWNLOADS = {
  windows: {
    label: "Download for Windows",
    detail: "Windows 10 / 11 · .exe installer",
    filename: "ProjectBlackVault-Setup.exe",
    icon: Monitor,
    ext: ".exe",
  },
  mac: {
    label: "Download for macOS",
    detail: "macOS 12+ · .dmg",
    filename: "ProjectBlackVault.dmg",
    icon: Apple,
    ext: ".dmg",
  },
  linux: {
    label: "Download for Linux",
    detail: "x86_64 · AppImage",
    filename: "ProjectBlackVault-Setup.AppImage",
    icon: Terminal,
    ext: ".AppImage",
  },
} as const;

type Platform = keyof typeof DOWNLOADS;

type DownloadAvailability = {
  available: boolean;
  filename: string;
  installerUrl: string;
  fallbackUrl: string;
};

type DownloadApiResponse = {
  platform?: Platform | "unknown";
  releaseUrl?: string;
  installerUrl?: string;
  available?: boolean;
  fallbackUrl?: string;
  source?: "github" | "fallback" | "disabled";
  message?: string;
  downloads?: Partial<Record<Platform, DownloadAvailability>>;
};

function detectPlatform(): Platform | null {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("windows")) return "windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "mac";
  if (ua.includes("linux")) return "linux";
  return null;
}

function fallbackAvailability(): Record<Platform, DownloadAvailability> {
  return {
    windows: {
      available: false,
      filename: DOWNLOADS.windows.filename,
      installerUrl: RELEASES_URL,
      fallbackUrl: RELEASES_URL,
    },
    mac: {
      available: false,
      filename: DOWNLOADS.mac.filename,
      installerUrl: RELEASES_URL,
      fallbackUrl: RELEASES_URL,
    },
    linux: {
      available: false,
      filename: DOWNLOADS.linux.filename,
      installerUrl: RELEASES_URL,
      fallbackUrl: RELEASES_URL,
    },
  };
}

export default function DownloadPage() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [releaseUrl, setReleaseUrl] = useState(RELEASES_URL);
  const [availability, setAvailability] = useState<Record<Platform, DownloadAvailability>>(fallbackAvailability);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [policyMessage, setPolicyMessage] = useState<string | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      try {
        const response = await fetch("/api/releases/latest-assets", { cache: "no-store" });
        const payload = (await response.json()) as DownloadApiResponse;

        if (cancelled) {
          return;
        }

        if (payload.releaseUrl) {
          setReleaseUrl(payload.releaseUrl);
        }

        if (payload.platform && payload.platform !== "unknown") {
          setPlatform(payload.platform);
        }

        if (payload.downloads) {
          setAvailability((prev) => {
            const next = { ...prev };
            (Object.keys(DOWNLOADS) as Platform[]).forEach((key) => {
              const fromApi = payload.downloads?.[key];
              if (fromApi?.installerUrl) {
                next[key] = fromApi;
              }
            });
            return next;
          });
        }

        if (payload.source === "disabled" && payload.message) {
          setPolicyMessage(payload.message);
        }
      } catch {
        if (!cancelled) {
          setAvailability(fallbackAvailability());
          setReleaseUrl(RELEASES_URL);
        }
      } finally {
        if (!cancelled) {
          setLoadingAvailability(false);
        }
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, []);

  const detectedDownload = platform ? availability[platform] : null;
  const detectedMeta = platform ? DOWNLOADS[platform] : null;
  const HeroIcon = detectedMeta?.icon ?? Download;
  const heroUrl = detectedDownload?.installerUrl ?? releaseUrl;
  const detectedAvailable = Boolean(detectedDownload?.available);
  const detectedFallbackUrl = detectedDownload?.fallbackUrl ?? releaseUrl;

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

      <div className="flex flex-col items-center gap-3">
        <a
          href={heroUrl}
          className="flex items-center gap-3 bg-[#00C853] hover:bg-[#00B847] text-black font-bold text-base px-8 py-4 rounded-xl transition-colors"
        >
          <HeroIcon className="w-5 h-5" />
          {platform
            ? detectedAvailable
              ? "Download Installer"
              : "Open Latest Releases"
            : "Browse All Downloads"}
        </a>

        {platform && (
          <p className="text-xs text-vault-text-faint text-center">
            {detectedMeta?.detail} · After download:{" "}
            {platform === "windows" && "run the .exe installer"}
            {platform === "mac" && "open the .dmg, then drag ProjectBlackVault to Applications"}
            {platform === "linux" && "mark the AppImage as executable, then run it"}
          </p>
        )}
      </div>

      {!loadingAvailability && platform && !detectedAvailable && (
        <div className="flex gap-3 bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-lg p-4">
          <AlertTriangle className="w-4 h-4 text-[#F5A623] flex-shrink-0 mt-0.5" />
          <div className="text-sm text-vault-text-muted leading-relaxed">
            The latest release does not currently include the expected{" "}
            <code className="text-[#F5A623]">{detectedDownload?.filename}</code> asset.
            Use the{" "}
            <a
              href={detectedFallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F5A623] underline"
            >
              latest releases page
            </a>{" "}
            while assets are being published.
          </div>
        </div>
      )}

      {policyMessage && (
        <div className="flex gap-3 bg-[#00C2FF]/10 border border-[#00C2FF]/30 rounded-lg p-4">
          <Info className="w-4 h-4 text-[#00C2FF] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-vault-text-muted leading-relaxed">{policyMessage}</p>
        </div>
      )}

      <div className="flex gap-3 bg-vault-surface border border-[#00C2FF]/20 border-l-[3px] border-l-[#00C2FF] rounded-lg p-4">
        <Info className="w-4 h-4 text-[#00C2FF] flex-shrink-0 mt-0.5" />
        <div className="text-sm text-vault-text-muted leading-relaxed">
          <span className="text-vault-text font-medium">Already using this app?</span>{" "}
          If you&apos;re accessing ProjectBlackVault from a browser over your network or VPN,
          you don&apos;t need to download anything — you&apos;re already using it.
          The launcher is only needed on the machine that runs Docker.
        </div>
      </div>

      <div>
        <p className="text-xs font-mono uppercase tracking-widest text-vault-text-faint mb-3">
          All Platforms
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(DOWNLOADS) as [Platform, typeof DOWNLOADS[Platform]][]).map(
            ([key, info]) => {
              const Icon = info.icon;
              const isDetected = key === platform;
              const state = availability[key];
              return (
                <a
                  key={key}
                  href={state.installerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
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
                  {!loadingAvailability && !state.available && (
                    <span className="text-[10px] uppercase tracking-wider text-[#F5A623]">
                      Fallback active
                    </span>
                  )}
                </a>
              );
            }
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-mono uppercase tracking-widest text-vault-text-faint">
          Advanced Install Channels
        </p>
        <div className="bg-vault-surface border border-vault-border rounded-xl p-4 space-y-3 text-sm text-vault-text-muted">
          <p>
            <span className="text-vault-text font-medium">Windows (winget):</span>{" "}
            <code className="text-vault-text">winget install --id TheAverageDeveloper.ProjectBlackVault</code>
          </p>
          <p>
            <span className="text-vault-text font-medium">macOS (Homebrew):</span>{" "}
            <code className="text-vault-text">brew install --cask theaveragedeveloper/tap/projectblackvault</code>
          </p>
          <p className="text-xs text-vault-text-faint">
            If these package channels are not published yet, use the direct installer download above.
          </p>
        </div>
      </div>

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

      <div className="flex items-center justify-between pt-2 border-t border-vault-border text-xs text-vault-text-faint">
        <Link href="/settings" className="hover:text-vault-text transition-colors">
          ← Back to Settings
        </Link>
        <a
          href={releaseUrl}
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
