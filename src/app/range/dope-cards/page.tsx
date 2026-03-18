"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { FileDown, Plus, Printer, RotateCcw, Trash2 } from "lucide-react";

interface Firearm {
  id: string;
  name: string;
  caliber: string;
}

interface Build {
  id: string;
  name: string;
  isActive: boolean;
}

interface AmmoStock {
  id: string;
  brand: string;
  caliber: string;
  grainWeight: number | null;
  bulletType: string | null;
}

interface DopeRow {
  id: string;
  distance: string;
  elevation: string;
  wind: string;
  note: string;
}

const INPUT_CLASS =
  "w-full rounded-md border border-vault-border bg-vault-surface px-3 py-2 text-sm text-vault-text placeholder-vault-text-faint focus:border-[#00C2FF] focus:outline-none";
const LABEL_CLASS = "mb-1 block text-sm font-medium text-vault-text-muted";

const PRESET_TEMPLATES = {
  "100-1000 yd (100 yd)": Array.from({ length: 10 }, (_, i) => 100 + i * 100),
  "50-500 yd (50 yd)": Array.from({ length: 10 }, (_, i) => 50 + i * 50),
  "25-300 yd (25 yd)": Array.from({ length: 12 }, (_, i) => 25 + i * 25),
};

const DEFAULT_TEMPLATE_NAME = "100-1000 yd (100 yd)";

function buildRowsFromDistances(distances: number[]): DopeRow[] {
  return distances.map((distance) => ({
    id: crypto.randomUUID(),
    distance: String(distance),
    elevation: "",
    wind: "",
    note: "",
  }));
}

export default function DopeCardsPage() {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [ammoProfiles, setAmmoProfiles] = useState<AmmoStock[]>([]);

  const [selectedFirearm, setSelectedFirearm] = useState("");
  const [selectedBuild, setSelectedBuild] = useState("");
  const [selectedAmmo, setSelectedAmmo] = useState("");

  const [zeroDistance, setZeroDistance] = useState("100");
  const [unit, setUnit] = useState<"yd" | "m">("yd");
  const [temperature, setTemperature] = useState("59");
  const [altitude, setAltitude] = useState("0");
  const [wind, setWind] = useState("0");

  const [cardSize, setCardSize] = useState<"index" | "half">("index");
  const [monochrome, setMonochrome] = useState(true);
  const [rows, setRows] = useState<DopeRow[]>(buildRowsFromDistances(PRESET_TEMPLATES["100-1000 yd (100 yd)"]));

  useEffect(() => {
    fetch("/api/firearms")
      .then((res) => res.json())
      .then((data) => setFirearms(Array.isArray(data) ? data : []))
      .catch(() => setFirearms([]));

    fetch("/api/ammo")
      .then((res) => res.json())
      .then((data) => setAmmoProfiles(Array.isArray(data?.all) ? data.all : []))
      .catch(() => setAmmoProfiles([]));
  }, []);

  useEffect(() => {
    if (!selectedFirearm) return;

    fetch(`/api/builds?firearmId=${selectedFirearm}`)
      .then((res) => res.json())
      .then((data) => {
        const nextBuilds = Array.isArray(data) ? data : [];
        setBuilds(nextBuilds);
        const activeBuild = nextBuilds.find((build: Build) => build.isActive);
        setSelectedBuild(activeBuild?.id ?? nextBuilds[0]?.id ?? "");
      })
      .catch(() => {
        setBuilds([]);
        setSelectedBuild("");
      });
  }, [selectedFirearm]);

  const selectedAmmoLabel = useMemo(() => {
    const profile = ammoProfiles.find((ammo) => ammo.id === selectedAmmo);
    if (!profile) return "";
    const parts = [profile.brand, profile.caliber, profile.grainWeight ? `${profile.grainWeight}gr` : "", profile.bulletType ?? ""];
    return parts.filter(Boolean).join(" • ");
  }, [ammoProfiles, selectedAmmo]);

  const updateRow = (id: string, field: keyof Omit<DopeRow, "id">, value: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    setRows((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        distance: "",
        elevation: "",
        wind: "",
        note: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  const resetCard = () => {
    setSelectedFirearm("");
    setBuilds([]);
    setSelectedBuild("");
    setSelectedAmmo("");
    setZeroDistance("100");
    setUnit("yd");
    setTemperature("59");
    setAltitude("0");
    setWind("0");
    setCardSize("index");
    setMonochrome(true);
    setRows(buildRowsFromDistances(PRESET_TEMPLATES[DEFAULT_TEMPLATE_NAME]));
  };

  const exportPdf = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-vault-bg pb-10">
      <PageHeader
        title="DOPE Cards"
        subtitle="Build quick reference hold cards and print field-ready layouts."
        actions={
          <>
            <Link href="/range" className="rounded-md border border-vault-border px-3 py-2 text-xs text-vault-text-muted hover:bg-vault-muted">
              Back to Range
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md bg-[#00C2FF] px-3 py-2 text-xs font-semibold text-black hover:bg-[#44d4ff]"
            >
              <Printer className="h-3.5 w-3.5" />
              Print Card
            </button>
            <button
              type="button"
              onClick={exportPdf}
              className="inline-flex items-center gap-2 rounded-md border border-vault-border px-3 py-2 text-xs text-vault-text hover:bg-vault-muted"
            >
              <FileDown className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </>
        }
      />

      <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 lg:grid-cols-[minmax(360px,420px)_1fr]">
        <section className="print:hidden rounded-lg border border-vault-border bg-vault-surface p-4">
          <h2 className="mb-4 text-sm font-semibold text-vault-text-muted">Card Setup</h2>

          <div className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Firearm</label>
              <select
                className={INPUT_CLASS}
                value={selectedFirearm}
                onChange={(e) => {
                  const firearmId = e.target.value;
                  setSelectedFirearm(firearmId);
                  if (!firearmId) {
                    setBuilds([]);
                    setSelectedBuild("");
                  }
                }}
              >
                <option value="">Select firearm</option>
                {firearms.map((firearm) => (
                  <option key={firearm.id} value={firearm.id}>
                    {firearm.name} ({firearm.caliber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Build Profile</label>
              <select className={INPUT_CLASS} value={selectedBuild} onChange={(e) => setSelectedBuild(e.target.value)}>
                <option value="">Select build</option>
                {builds.map((build) => (
                  <option key={build.id} value={build.id}>
                    {build.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={LABEL_CLASS}>Ammo Profile</label>
              <select className={INPUT_CLASS} value={selectedAmmo} onChange={(e) => setSelectedAmmo(e.target.value)}>
                <option value="">Select ammo</option>
                {ammoProfiles.map((ammo) => (
                  <option key={ammo.id} value={ammo.id}>
                    {ammo.brand} {ammo.caliber} {ammo.grainWeight ? `${ammo.grainWeight}gr` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Zero Distance</label>
                <input className={INPUT_CLASS} value={zeroDistance} onChange={(e) => setZeroDistance(e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Unit</label>
                <select className={INPUT_CLASS} value={unit} onChange={(e) => setUnit(e.target.value as "yd" | "m")}>
                  <option value="yd">Yards</option>
                  <option value="m">Meters</option>
                </select>
              </div>
              <div>
                <label className={LABEL_CLASS}>Temp (°F)</label>
                <input className={INPUT_CLASS} value={temperature} onChange={(e) => setTemperature(e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLASS}>Altitude (ft)</label>
                <input className={INPUT_CLASS} value={altitude} onChange={(e) => setAltitude(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL_CLASS}>Wind (mph @ 90°)</label>
                <input className={INPUT_CLASS} value={wind} onChange={(e) => setWind(e.target.value)} />
              </div>
            </div>

            <div>
              <p className={LABEL_CLASS}>Preset Templates</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PRESET_TEMPLATES).map(([name, distances]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setRows(buildRowsFromDistances(distances))}
                    className="rounded-md border border-vault-border px-2.5 py-1.5 text-xs text-vault-text hover:bg-vault-muted"
                  >
                    {name}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={resetCard}
                  className="inline-flex items-center gap-1 rounded-md border border-vault-border px-2.5 py-1.5 text-xs text-vault-text hover:bg-vault-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Card
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Print Card Size</label>
                <select className={INPUT_CLASS} value={cardSize} onChange={(e) => setCardSize(e.target.value as "index" | "half")}>
                  <option value="index">Index Card (3x5&quot;)</option>
                  <option value="half">Half Page (5.5x8.5&quot;)</option>
                </select>
              </div>
              <label className="mt-6 inline-flex items-center gap-2 text-sm text-vault-text">
                <input type="checkbox" checked={monochrome} onChange={(e) => setMonochrome(e.target.checked)} />
                High contrast monochrome
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-vault-border bg-vault-surface p-4">
          <div className="mb-3 flex items-center justify-between print:hidden">
            <h2 className="text-sm font-semibold text-vault-text-muted">Distance / Hold Rows</h2>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded-md border border-vault-border px-2.5 py-1.5 text-xs text-vault-text hover:bg-vault-muted"
            >
              <Plus className="h-3.5 w-3.5" /> Add Row
            </button>
          </div>

          <div className={`dope-print-card dope-print-${cardSize} ${monochrome ? "dope-print-monochrome" : ""} overflow-hidden rounded-md border border-vault-border`}>
            <div className="border-b border-vault-border bg-vault-surface-2 px-3 py-2">
              <h3 className="text-sm font-semibold">DOPE Card</h3>
              <p className="text-xs text-vault-text-muted">
                Zero {zeroDistance} {unit} • {selectedAmmoLabel || "Ammo not selected"}
              </p>
              <p className="text-xs text-vault-text-muted">Temp {temperature}°F • Alt {altitude} ft • Wind {wind} mph</p>
            </div>

            <table className="w-full text-xs">
              <thead className="bg-vault-surface-2 text-left text-vault-text-muted">
                <tr>
                  <th className="px-3 py-2">Distance ({unit})</th>
                  <th className="px-3 py-2">Elevation</th>
                  <th className="px-3 py-2">Wind</th>
                  <th className="px-3 py-2">Notes</th>
                  <th className="w-10 px-2 py-2 print:hidden" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-vault-border">
                    <td className="p-1.5">
                      <input className={INPUT_CLASS} value={row.distance} onChange={(e) => updateRow(row.id, "distance", e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      <input className={INPUT_CLASS} value={row.elevation} onChange={(e) => updateRow(row.id, "elevation", e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      <input className={INPUT_CLASS} value={row.wind} onChange={(e) => updateRow(row.id, "wind", e.target.value)} />
                    </td>
                    <td className="p-1.5">
                      <input className={INPUT_CLASS} value={row.note} onChange={(e) => updateRow(row.id, "note", e.target.value)} />
                    </td>
                    <td className="p-1.5 print:hidden">
                      <button type="button" onClick={() => removeRow(row.id)} className="rounded-md p-1.5 text-vault-text-muted hover:bg-vault-muted hover:text-vault-text">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
