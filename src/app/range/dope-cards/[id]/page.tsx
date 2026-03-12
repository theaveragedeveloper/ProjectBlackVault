"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Printer } from "lucide-react";

const SAMPLE_ROWS = [
  { distance: "100", elevation: "0.0", wind: "0.0", note: "Zero" },
  { distance: "200", elevation: "1.1", wind: "0.2", note: "" },
  { distance: "300", elevation: "2.9", wind: "0.4", note: "" },
  { distance: "400", elevation: "5.1", wind: "0.8", note: "" },
  { distance: "500", elevation: "7.9", wind: "1.1", note: "Transonic soon" },
];

export default function DopeCardDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <main className="min-h-screen bg-vault-bg pb-10">
      <PageHeader
        title={`DOPE Card Preview #${params.id}`}
        subtitle="Saved-card preview optimized for print output."
        actions={
          <>
            <Link href="/range/dope-cards" className="rounded-md border border-vault-border px-3 py-2 text-xs text-vault-text-muted hover:bg-vault-muted">
              Back to Cards
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md bg-[#00C2FF] px-3 py-2 text-xs font-semibold text-black hover:bg-[#44d4ff]"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Card
            </button>
          </>
        }
      />

      <div className="mx-auto w-full max-w-4xl p-4">
        <section className="dope-print-card dope-print-half dope-print-monochrome overflow-hidden rounded-md border border-vault-border bg-vault-surface">
          <div className="border-b border-vault-border bg-vault-surface-2 px-3 py-2">
            <h2 className="text-sm font-semibold">Mk12 SPR • 77gr OTM</h2>
            <p className="text-xs text-vault-text-muted">Zero 100 yd • Temp 59°F • Alt 0 ft • Wind 10 mph @ 90°</p>
          </div>

          <table className="w-full text-xs">
            <thead className="bg-vault-surface-2 text-left text-vault-text-muted">
              <tr>
                <th className="px-3 py-2">Distance (yd)</th>
                <th className="px-3 py-2">Elevation (MIL)</th>
                <th className="px-3 py-2">Wind (MIL)</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_ROWS.map((row) => (
                <tr key={row.distance} className="border-t border-vault-border">
                  <td className="px-3 py-2">{row.distance}</td>
                  <td className="px-3 py-2">{row.elevation}</td>
                  <td className="px-3 py-2">{row.wind}</td>
                  <td className="px-3 py-2">{row.note || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
