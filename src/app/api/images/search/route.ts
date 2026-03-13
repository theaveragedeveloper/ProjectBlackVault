import { NextResponse } from "next/server";

// Image search has been intentionally removed to keep the app offline-first.
export async function POST() {
  return NextResponse.json(
    {
      error:
        "Image search has been removed. Use local uploads or direct image URLs instead.",
      removed: true,
    },
    { status: 410 }
  );
}
