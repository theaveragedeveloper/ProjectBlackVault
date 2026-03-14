import { NextRequest } from "next/server";

/**
 * Returns the best-available client IP address for rate limiting.
 *
 * By default, X-Forwarded-For is NOT trusted because it can be spoofed by
 * any client to cycle through arbitrary IPs and bypass rate limits.
 *
 * Set the TRUSTED_PROXY=1 environment variable only when the app is running
 * behind a trusted reverse proxy (e.g. nginx, Caddy, a load balancer) that
 * sets X-Forwarded-For reliably. In that case the first (leftmost) IP in the
 * header is the real client IP.
 */
export function getClientIp(request: NextRequest): string {
  if (process.env.TRUSTED_PROXY === "1") {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0].trim();
      if (first) return first;
    }
  }

  // Fall back to a fixed sentinel — all requests from the same host share
  // the same bucket, which is the safe default for a local/self-hosted app.
  return "local";
}
