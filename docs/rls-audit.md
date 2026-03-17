# RLS Audit (Row-Level Security)

Date: 2026-03-17

## Scope
- Database schema and provider configuration (`prisma/schema.prisma`).
- Authentication/session behavior (`src/app/api/auth/*`, `src/lib/session-config.ts`).
- API route authorization coverage for data endpoints (representative checks across `src/app/api/*`).

## Executive Summary
This project currently has **no database-level Row-Level Security (RLS)** and is configured for **SQLite**, where native RLS policies are not available. The current security model is primarily application-level and session-cookie based, and that session gate is applied inconsistently (e.g., explicitly enforced in system update endpoints, but not broadly across core data APIs).

## Findings

### 1) No native RLS support in current DB provider (High)
- The Prisma datasource uses `provider = "sqlite"`.
- SQLite does not provide Postgres-style RLS policies (`CREATE POLICY`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).

**Impact:** If you intend true per-user/per-tenant row isolation enforced by the database engine, that control is currently absent.

### 2) No tenant/user ownership columns for row scoping (High)
- Core models (e.g., `Firearm`, `Build`, `Accessory`, `RangeSession`, etc.) do not include `userId`, `tenantId`, or similar ownership fields.
- There is no `User` model to anchor ownership relations.

**Impact:** Even with app-layer auth, records are effectively global within the single database.

### 3) Authentication is app-level and optional by configuration (Medium)
- Login flow allows access without password when `appPassword` is unset.
- Session cookie signing depends on `SESSION_SECRET`; in non-production without a secret, a raw token is accepted behaviorally by design.

**Impact:** In default/local scenarios, auth can be intentionally relaxed, which is acceptable for a single-user local app but not equivalent to strict multi-user row isolation.

### 4) Auth enforcement appears route-specific, not centralized/global (High)
- `system-update` routes validate session before sensitive actions.
- Representative data routes (e.g., `/api/firearms`) perform DB reads/writes without session verification in-route.

**Impact:** If the app is exposed beyond a trusted local boundary, data endpoints may be reachable without a uniform authorization check.

## Risk Assessment
- **Current posture fits a local/single-user vault model**, not a multi-tenant SaaS RLS model.
- If deployment target is home lab/localhost only behind trusted network controls, risk is moderate and can be acceptable with hardening.
- If deployment target is internet-facing or multi-user, risk is high until authorization and tenancy are redesigned.

## Recommendations

### Immediate hardening (short term)
1. Require app password + `SESSION_SECRET` in all non-dev deployments.
2. Introduce a shared API auth guard and apply it uniformly to state/data routes.
3. Add integration tests asserting unauthenticated access is denied on protected endpoints.

### True RLS path (medium term)
1. Migrate database to PostgreSQL.
2. Add principals and ownership columns (`users`, `user_id`/`tenant_id`) across data tables.
3. Enable RLS on every tenant-scoped table.
4. Define least-privilege policies (`USING` and `WITH CHECK`) bound to authenticated principal context.
5. Pass user context to DB session per request (e.g., `SET app.current_user_id = ...`) and reference it in policies.
6. Keep app-layer authorization as defense-in-depth, not as sole isolation mechanism.

## Suggested Acceptance Criteria for “RLS Complete”
- Every tenant-scoped table has RLS enabled.
- No query path can read/write rows outside caller ownership.
- Security regression tests prove cross-tenant access is denied.
- Service role usage is constrained to admin/maintenance workflows only.

## Notes
This audit reflects code/config currently present in the repository and does not include infrastructure controls outside source (reverse proxy ACLs, VPN, firewall rules, etc.).
