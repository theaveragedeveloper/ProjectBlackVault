import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export class RequestValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function getContentLength(request: NextRequest): number | null {
  const value = request.headers.get("content-length");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function parseJsonBody<T>(
  request: NextRequest,
  schema: z.ZodType<T>,
  options?: { maxBytes?: number }
): Promise<T> {
  const maxBytes = options?.maxBytes ?? 1024 * 1024;
  const headerLength = getContentLength(request);
  if (headerLength !== null && headerLength > maxBytes) {
    throw new RequestValidationError(`Request body too large (max ${maxBytes} bytes)`, 413);
  }

  const raw = await request.text();
  if (Buffer.byteLength(raw, "utf8") > maxBytes) {
    throw new RequestValidationError(`Request body too large (max ${maxBytes} bytes)`, 413);
  }

  let parsedJson: unknown = {};
  if (raw.trim().length > 0) {
    try {
      parsedJson = JSON.parse(raw);
    } catch {
      throw new RequestValidationError("Invalid JSON payload", 400);
    }
  }

  const result = schema.safeParse(parsedJson);
  if (!result.success) {
    throw new RequestValidationError(z.prettifyError(result.error), 400);
  }

  return result.data;
}

export function validationErrorResponse(error: unknown, defaultMessage = "Invalid request") {
  if (error instanceof RequestValidationError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: defaultMessage }, { status: 400 });
}
