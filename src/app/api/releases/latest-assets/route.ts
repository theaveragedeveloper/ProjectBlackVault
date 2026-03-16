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
  url: string;
};

function fallbackDownloads(): Record<Platform, DownloadResult> {
  return {
    windows: {
      available: false,
      filename: EXPECTED_ASSETS.windows,
      url: RELEASES_URL,
    },
    mac: {
      available: false,
      filename: EXPECTED_ASSETS.mac,
      url: RELEASES_URL,
    },
    linux: {
      available: false,
      filename: EXPECTED_ASSETS.linux,
      url: RELEASES_URL,
    },
  };
}

export async function GET() {
  const fallback = fallbackDownloads();

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
          releaseUrl: RELEASES_URL,
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
          url: url || releaseUrl,
        };
        return acc;
      },
      fallback
    );

    return NextResponse.json(
      {
        releaseUrl,
        downloads,
        source: "github",
        checkedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        releaseUrl: RELEASES_URL,
        downloads: fallback,
        source: "fallback",
        checkedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
