import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptField } from "@/lib/crypto";
import { isTrustedExternalImageUrl } from "@/lib/image-host-allowlist";
import { allowImageSearchEgress } from "@/lib/network-policy";
import { requireAuth } from "@/lib/server/auth";

interface GoogleCseItem {
  title: string;
  link: string;
  image?: {
    contextLink: string;
    height: number;
    width: number;
    byteSize: number;
    thumbnailLink: string;
    thumbnailHeight: number;
    thumbnailWidth: number;
  };
  snippet?: string;
  displayLink?: string;
}

// POST /api/images/search - Proxy to Google Custom Search API
// Body: { query: string }
// Reads googleCseApiKey and googleCseSearchEngineId from AppSettings in DB.
// Returns array of image results.
// If no API key, returns 400 with helpful message.
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth) return auth;

  try {
    if (!allowImageSearchEgress()) {
      return NextResponse.json(
        {
          error:
            "External image search is disabled by policy. Set ALLOW_IMAGE_SEARCH_EGRESS=true to enable.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json(
        { error: "Missing required field: query" },
        { status: 400 }
      );
    }

    // Fetch settings from DB
    const settings = await prisma.appSettings.findUnique({
      where: { id: "singleton" },
    });

    const googleCseApiKey = await decryptField(settings?.googleCseApiKey ?? null);
    const googleCseSearchEngineId = settings?.googleCseSearchEngineId ?? null;

    if (!settings || !googleCseApiKey || !googleCseSearchEngineId) {
      return NextResponse.json(
        {
          error:
            "Google Custom Search is not configured. Please add your Google CSE API key and Search Engine ID in the app settings.",
          configRequired: true,
        },
        { status: 400 }
      );
    }

    if (!settings.enableImageSearch) {
      return NextResponse.json(
        {
          error:
            "Image search is disabled. Please enable it in the app settings.",
          configRequired: true,
        },
        { status: 400 }
      );
    }

    const searchUrl = new URL(
      "https://www.googleapis.com/customsearch/v1"
    );
    searchUrl.searchParams.set("key", googleCseApiKey);
    searchUrl.searchParams.set("cx", googleCseSearchEngineId);
    searchUrl.searchParams.set("q", query.trim());
    searchUrl.searchParams.set("searchType", "image");
    searchUrl.searchParams.set("num", "10");
    searchUrl.searchParams.set("safe", "active");

    const response = await fetch(searchUrl.toString());

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Google CSE API error:", response.status, errorData);

      if (response.status === 403) {
        return NextResponse.json(
          {
            error:
              "Google CSE API key is invalid or quota exceeded. Please check your API key in settings.",
          },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: "Failed to fetch images from Google Custom Search" },
        { status: 502 }
      );
    }

    const data = await response.json();
    const items: GoogleCseItem[] = data.items ?? [];

    const results = items
      .filter((item) => isTrustedExternalImageUrl(item.link))
      .map((item) => ({
        title: item.title,
        url: item.link,
        thumbnailUrl:
          item.image?.thumbnailLink && isTrustedExternalImageUrl(item.image.thumbnailLink)
            ? item.image.thumbnailLink
            : item.link,
        width: item.image?.width ?? null,
        height: item.image?.height ?? null,
        contextLink: item.image?.contextLink ?? null,
        displayLink: item.displayLink ?? null,
        snippet: item.snippet ?? null,
      }));

    return NextResponse.json({ results, query: query.trim() });
  } catch (error) {
    console.error("POST /api/images/search error:", error);
    return NextResponse.json(
      { error: "Failed to perform image search" },
      { status: 500 }
    );
  }
}
