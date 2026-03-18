# Security Best Practices Report

Date: 2026-03-18
Project: ProjectBlackVault (Next.js + TypeScript + Prisma)
Reviewer mode: Active security audit (server + frontend surfaces)

## Executive Summary
The codebase has one critical authentication bypass path and multiple high-impact secure-default gaps. The most urgent issue is that session authentication becomes effectively "cookie-exists" when `SESSION_SECRET` is not configured, allowing forged session cookies. Additional high-impact risks include missing `Secure` session cookie flags, unsafe SVG upload handling, and encryption-key management that stores and re-exports decryption keys from the same datastore.

I reviewed this repo against the `security-best-practices` references for:
- Next.js server security (`javascript-typescript-nextjs-web-server-security.md`)
- React/frontend security (`javascript-typescript-react-web-frontend-security.md`)
- General web frontend security (`javascript-general-web-frontend-security.md`)

## Implementation Status (2026-03-18)
- Fixed: `BV-SEC-001` (fail-closed when `SESSION_SECRET` is missing + no unsigned sessions issued)
- Fixed: `BV-SEC-002` (session cookies now set `Secure` in production, with env override)
- Fixed: `BV-SEC-003` (SVG uploads removed; file type now validated by binary signature)
- Mitigated: `BV-SEC-004` (production now disables UI key management/key export by default unless explicitly overridden)
- Fixed: `BV-SEC-005` (Next.js upgraded to patched `16.1.7`)
- Fixed: `BV-SEC-006` (removed broad remote image wildcard config)
- Fixed: `BV-SEC-007` (added baseline security headers/CSP in app config)
- Fixed: `BV-SEC-008` (auth check now fails closed on error/misconfig)
- Partially improved: `BV-SEC-009` (in-memory limiter now prunes expired entries but is still per-process)
- Mitigated: `BV-SEC-010` (system-info endpoint disabled in production by default)

---

## Critical Findings

### [BV-SEC-001] Critical - Session forgery/auth bypass when `SESSION_SECRET` is unset
- Rule ID: `NEXT-SECRETS-001` / session integrity baseline
- Severity: Critical
- Location:
  - `src/proxy.ts:48-61`
  - `src/app/api/auth/login/route.ts:55-57,73-75`
  - `.env.example:4-6`
- Evidence:
  - `src/proxy.ts` only verifies cookie signature if `SESSION_SECRET` exists; otherwise it logs a warning and allows requests with any `vault_session` value.
  - `src/app/api/auth/login/route.ts` issues unsigned cookie values when `SESSION_SECRET` is missing.
  - `.env.example` marks `SESSION_SECRET` as recommended, not required.
- Impact:
  - Any attacker able to send requests to the app can forge a `vault_session` cookie and bypass password protection entirely when `SESSION_SECRET` is absent.
- Fix:
  - Fail closed: reject startup or all auth for protected routes unless `SESSION_SECRET` is set.
  - Always sign and verify session cookies; never issue unsigned session tokens.
  - Make `SESSION_SECRET` required in deployment scripts/docs.
- Mitigation:
  - Restrict app exposure to localhost/private network until fixed.
  - Add startup health check that fails if `SESSION_SECRET` is missing.
- False positive notes:
  - Not a false positive in app code; behavior is explicit.

---

## High Findings

### [BV-SEC-002] High - Session cookie missing `Secure` attribute
- Rule ID: cookie posture baseline
- Severity: High
- Location:
  - `src/app/api/auth/login/route.ts:58-63,76-81`
- Evidence:
  - Session cookies are set with `httpOnly` and `sameSite`, but no `secure` flag.
- Impact:
  - In non-TLS hops or misconfigured deployments, session cookies can be exposed over plaintext transport.
- Fix:
  - Set `secure: process.env.NODE_ENV === "production"` (or an explicit `SESSION_COOKIE_SECURE` env toggle).
  - Keep local dev usable by allowing secure=false only in non-production.
- Mitigation:
  - Ensure TLS termination for all production traffic.
- False positive notes:
  - If TLS is guaranteed everywhere by infra, risk is reduced but the cookie flag should still be set in production.

### [BV-SEC-003] High - SVG upload accepted and served from app origin (stored XSS risk)
- Rule ID: untrusted file handling / XSS hardening
- Severity: High
- Location:
  - `src/app/api/images/upload/route.ts:5-13,70-81,116-121`
- Evidence:
  - `svg` and `image/svg+xml` are accepted and written to `public/uploads/...` with no sanitization or content disarm.
- Impact:
  - Uploaded SVGs can execute active content when opened directly, enabling stored XSS against authenticated users on the same origin.
- Fix:
  - Secure default: disallow SVG uploads.
  - If SVG is required, sanitize server-side with strict allowlist and serve from separate untrusted origin/CDN with restrictive CSP/content-disposition.
  - Add magic-byte/content verification for raster formats.
- Mitigation:
  - Restrict who can upload files and scan existing uploads for SVG content.
- False positive notes:
  - Risk exists even if many views render with `<img>`, because direct navigation to uploaded SVG remains possible.

### [BV-SEC-004] High - Encryption key stored and re-exported in plaintext from same datastore
- Rule ID: secret/key management baseline
- Severity: High
- Location:
  - `prisma/schema.prisma:307-315`
  - `src/app/api/encryption/route.ts:16-22,48-52,83-87`
- Evidence:
  - `AppSettings.encryptionKey` stores key material in DB.
  - `/api/encryption` returns raw key and persists key in plaintext.
- Impact:
  - DB compromise yields both ciphertext and key, collapsing the intended protection for encrypted fields.
- Fix:
  - Secure default: require external key source (`VAULT_ENCRYPTION_KEY`) for production.
  - Remove or strongly gate key export endpoint.
  - Consider envelope encryption/KMS where possible.
- Mitigation:
  - Tighten access controls and auditing around settings/encryption endpoints.
- False positive notes:
  - If deployed only for single-user localhost use, practical risk is lower, but the default model is still weak for self-hosted networked deployments.

---

## Medium Findings

### [BV-SEC-005] Medium - Next.js dependency is on a vulnerable patch version
- Rule ID: `NEXT-SUPPLY-001`
- Severity: Medium
- Location:
  - `package.json:38`
- Evidence:
  - `next` pinned to `16.1.6`.
  - `npm audit --omit=dev --json` reports advisories affecting `<16.1.7` and suggests `16.1.7`.
- Impact:
  - Exposure to known upstream vulnerabilities (CSRF-bypass edge case, request-smuggling-related issue, cache/resource exhaustion classes).
- Fix:
  - Upgrade `next` and `eslint-config-next` to `16.1.7` or newer patched release.
  - Add CI gate for `npm audit`/dependabot security updates.
- Mitigation:
  - Limit internet exposure until dependency patching is applied.
- False positive notes:
  - Advisory applicability can vary by feature usage, but patched upgrade is still recommended.

### [BV-SEC-006] Medium - Overly broad remote image allowlist (`http/https` + any host)
- Rule ID: SSRF and resource fetching hardening
- Severity: Medium
- Location:
  - `next.config.ts:5-9`
  - `src/proxy.ts:68` (explicit `_next/image` bypass in matcher)
- Evidence:
  - `images.remotePatterns` allows all hosts over both HTTP and HTTPS.
- Impact:
  - If `/_next/image` is reachable, this broad allowlist increases SSRF/internal probing and cache abuse risk.
- Fix:
  - Restrict `remotePatterns` to explicit trusted hostnames only.
  - Prefer HTTPS-only remote sources.
  - If remote optimization is unnecessary, disable/restrict Next image optimization paths.
- Mitigation:
  - Network egress restrictions at container/host level.
- False positive notes:
  - If the deployment path never exposes/uses `/_next/image`, practical risk is reduced; verify runtime behavior.

### [BV-SEC-007] Medium - Missing explicit app-level security headers baseline
- Rule ID: header/clickjacking/XSS defense-in-depth baseline
- Severity: Medium
- Location:
  - `next.config.ts:3-12` (no `headers()` policy visible)
- Evidence:
  - No in-repo CSP, `X-Content-Type-Options`, clickjacking, or referrer-policy header configuration found.
- Impact:
  - Reduced defense-in-depth against XSS, clickjacking, MIME sniffing, and data leakage.
- Fix:
  - Add a baseline header policy (CSP, `X-Content-Type-Options: nosniff`, frame restrictions, referrer policy).
  - Keep CSP compatible with current inline theme script by using nonce/hash strategy.
- Mitigation:
  - If managed at reverse proxy/CDN, verify effective runtime headers.
- False positive notes:
  - Could be enforced at infra layer; not visible in this repo.

### [BV-SEC-008] Medium - Fail-open behavior in auth-check error path
- Rule ID: fail-safe defaults
- Severity: Medium
- Location:
  - `src/app/api/auth/check/route.ts:25-27`
- Evidence:
  - On exception, response is `{ passwordRequired: false, authenticated: true }`.
- Impact:
  - Clients can be misled into authenticated state during backend errors, increasing risk of unsafe UI/auth flow decisions.
- Fix:
  - Return fail-closed response on error (`authenticated: false`, `passwordRequired: true`) and include proper HTTP status.
- Mitigation:
  - Add monitoring for auth-check exceptions.
- False positive notes:
  - Proxy still enforces route-level auth, so this is primarily a fail-open client-state risk.

---

## Low Findings

### [BV-SEC-009] Low - Login rate limiter is per-process, spoofable, and unbounded in memory
- Rule ID: brute-force hardening
- Severity: Low
- Location:
  - `src/app/api/auth/login/route.ts:8-23,28`
- Evidence:
  - In-memory map keyed by `x-forwarded-for`, no trusted-proxy verification, no distributed store, no pruning.
- Impact:
  - Easy IP spoofing in some deployments; weak protection in multi-instance deployments; potential map growth over time.
- Fix:
  - Use reverse-proxy or shared-store rate limiting (Redis/upstream gateway) with trusted client IP extraction.
  - Add periodic cleanup/TTL eviction.
- Mitigation:
  - Apply network-level rate limits.
- False positive notes:
  - Acceptable for low-risk local-only setups; not robust for internet-facing deployments.

### [BV-SEC-010] Low - System-information endpoint exposes infrastructure details
- Rule ID: information disclosure minimization
- Severity: Low
- Location:
  - `src/app/api/system-info/route.ts:7-39`
- Evidence:
  - Returns local IP addresses, hostname, platform, and resolved database path.
- Impact:
  - Increases recon value if auth is bypassed or compromised.
- Fix:
  - Restrict to admin-only mode, local-only mode, or remove in production builds.
  - Redact file paths and internal network details.
- Mitigation:
  - Ensure this endpoint is never exposed without strong auth and secret-backed sessions.
- False positive notes:
  - Intended for diagnostics; risk depends on deployment exposure.

---

## Secure-by-Default Improvement Plan (Prioritized)
1. Enforce `SESSION_SECRET` as mandatory and fail closed when missing.
2. Set `secure` session cookies in production; add explicit cookie security env controls.
3. Remove SVG from allowed uploads by default; add file-content validation.
4. Make external key management the production default; disable raw key export endpoint.
5. Upgrade Next.js to patched release (`>=16.1.7`) and add dependency security checks in CI.
6. Restrict `images.remotePatterns` to specific trusted domains.
7. Add baseline security headers (CSP, nosniff, frame controls, referrer policy).
8. Make auth-check and other security-sensitive error paths fail closed.

## Notes on Scope/Assumptions
- This review is code-centric; reverse-proxy/CDN/WAF controls are not visible in repo.
- I did not treat lack of TLS-in-dev as a finding (per security skill guidance), but production should still enforce TLS.
