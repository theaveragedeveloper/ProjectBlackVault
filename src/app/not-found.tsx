import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-vault-bg text-vault-text px-6">
      <p className="text-xs font-mono uppercase tracking-widest text-vault-text-faint mb-2">404</p>
      <h1 className="text-2xl font-bold tracking-widest uppercase mb-3">Page Not Found</h1>
      <p className="text-sm text-vault-text-muted mb-8 text-center max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-md border border-[#00C2FF]/30 bg-[#00C2FF]/10 text-[#00C2FF] text-sm font-medium hover:bg-[#00C2FF]/20 transition-colors"
      >
        Back to Command Center
      </Link>
    </div>
  );
}
