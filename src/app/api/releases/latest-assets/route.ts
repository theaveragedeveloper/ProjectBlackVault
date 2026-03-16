import { NextResponse } from "next/server";

const OWNER = "theaveragedeveloper";
const REPO = "ProjectBlackVault";
const RELEASES_URL = `https://github.com/${OWNER}/${REPO}/releases/latest`;
const RELEASE_API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/releases/latest`;

const EXPECTED_ASSETS = {
  windows: "ProjectBlackVault-Setup.exe",
  mac: "ProjectBlackVault.dmg",
  linux: "ProjectBlackVault-Setup.AppImage",
} as const;

type Platform = keyof typeof EXPECTED_ASSETS;
type ResolvedPlatform = Platform | "unknown";

type ReleaseAsset = {
  name: string;
  browser_download_url: string;
};

type LatestRelease = {
  html_url?: string;
  assets?: ReleaseAsset[];
};

type DownloadResult = {
  available: boolean;
  filename: string;
  installerUrl: string;
  fallbackUrl: string;
};

function fallbackDownloads(): Record<Platform, DownloadResult> {
  return {
    windows: {
      available: false,
      filename: EXPECTED_ASSETS.windows,
      installerUrl: RELEASES_URL,
      fallbackUrl: RELEASES_URL,
    },
    mac: {
      available: false,
      filename: EXPECTED_ASSETS.mac,
      installerUrl: RELEASES_URL,
      fallbackUrl: RELEASES_URL,
    },
    linux: {
      available: false,
      filename: EXPECTED_ASSETS.linux,
      installerUrl: RELEASES_URL,
      fallbackUrl: RELEASES_URL,
    },
  };
}

function detectPlatform(userAgent: string | null): ResolvedPlatform {
  if (!userAgent) {
    return "unknown";
  }

  const ua = userAgent.toLowerCase();
  if (ua.includes("windows")) return "windows";
  if (ua.includes("mac os") || ua.includes("macintosh")) return "mac";
  if (ua.includes("linux")) return "linux";
  return "unknown";
}

function parsePlatformOverride(value: string | null): ResolvedPlatform | null {
  if (value === "windows" || value === "mac" || value === "linux" || value === "unknown") {
    return value;
  }
  return null;
}

export async function GET(request: Request) {
  const fallback = fallbackDownloads();
  const url = new URL(request.url);
  const override = parsePlatformOverride(url.searchParams.get("platform"));
  const platform = override || detectPlatform(request.headers.get("user-agent"));
  const fallbackUrl = RELEASES_URL;

  try {
    const response = await fetch(RELEASE_API_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ProjectBlackVault-DownloadResolver",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          platform,
          releaseUrl: RELEASES_URL,
          installerUrl: fallbackUrl,
          available: false,
          fallbackUrl,
          downloads: fallback,
          source: "fallback",
          checkedAt: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    const latestRelease = (await response.json()) as LatestRelease;
    const releaseUrl = latestRelease.html_url || RELEASES_URL;
    const assets = Array.isArray(latestRelease.assets) ? latestRelease.assets : [];
    const byName = new Map(assets.map((asset) => [asset.name, asset.browser_download_url]));

    const downloads = (Object.keys(EXPECTED_ASSETS) as Platform[]).reduce<Record<Platform, DownloadResult>>(
      (acc, platform) => {
        const filename = EXPECTED_ASSETS[platform];
        const url = byName.get(filename);
        acc[platform] = {
          available: Boolean(url),
          filename,
          installerUrl: url || releaseUrl,
          fallbackUrl: releaseUrl,
        };
        return acc;
      },
      fallback
    );

    const resolved = platform !== "unknown" ? downloads[platform] : null;

    return NextResponse.json(
      {
        platform,
        releaseUrl,
        installerUrl: resolved?.installerUrl || releaseUrl,
        available: resolved?.available ?? false,
        fallbackUrl: releaseUrl,
        downloads,
        source: "github",
        checkedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        platform,
        releaseUrl: RELEASES_URL,
        installerUrl: fallbackUrl,
        available: false,
        fallbackUrl,
        downloads: fallback,
        source: "fallback",
        checkedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
