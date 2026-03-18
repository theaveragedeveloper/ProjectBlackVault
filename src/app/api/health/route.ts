import { NextResponse } from "next/server";
import path from "path";

export async function GET() {
  const dbUrl = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const dataPath = path.resolve(dbUrl.replace(/^file:/, ""));

  return NextResponse.json(
    { status: "ok", timestamp: new Date().toISOString(), dataPath },
    { status: 200 }
  );
}
