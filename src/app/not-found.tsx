import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-bold tracking-tight" style={{ color: "#00C2FF" }}>
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-vault-text">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-vault-text-muted">
        This page doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-md border border-[#00C2FF]/35 bg-[#00C2FF]/12 px-4 py-2 text-sm font-medium text-[#00C2FF] transition-colors hover:bg-[#00C2FF]/20"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
