"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-vault-bg text-vault-text px-6">
      <p className="text-xs font-mono uppercase tracking-widest text-[#E53935] mb-2">Error</p>
      <h1 className="text-2xl font-bold tracking-widest uppercase mb-3">Something Went Wrong</h1>
      <p className="text-sm text-vault-text-muted mb-8 text-center max-w-sm">
        An unexpected error occurred. Try again or return to the dashboard.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-md border border-vault-border text-vault-text-muted text-sm hover:border-vault-text-faint transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-md border border-[#00C2FF]/30 bg-[#00C2FF]/10 text-[#00C2FF] text-sm font-medium hover:bg-[#00C2FF]/20 transition-colors"
        >
          Back to Command Center
        </Link>
      </div>
    </div>
  );
}
