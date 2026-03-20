// Server component wrapper — allows exporting `dynamic` for the (app) route group.
// This prevents Next.js from trying to statically prerender pages that require
// a live database (this is a self-hosted Docker app, not a static export).
export const dynamic = 'force-dynamic';

import AppLayoutClient from './layout-client';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppLayoutClient>{children}</AppLayoutClient>;
}
