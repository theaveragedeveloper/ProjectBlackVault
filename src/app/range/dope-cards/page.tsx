"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Download, Plus, Printer, Trash2, Upload } from "lucide-react";

interface Firearm { id: string; name: string; caliber: string; }
interface Build { id: string; name: string; isActive: boolean; }
interface AmmoStock { id: string; brand: string; caliber: string; grainWeight: number | null; bulletType: string | null; }
interface DopeRow { id: string; distance: string; elevation: string; wind: string; note: string; }

const INPUT_CLASS = "w-full rounded-md border border-vault-border bg-vault-surface px-3 py-2 text-sm text-vault-text placeholder-vault-text-faint focus:border-[#00C2FF] focus:outline-none";
const LABEL_CLASS = "mb-1 block text-xs font-semibold uppercase tracking-widest text-vault-text-muted";
const STORAGE_KEY = "pbv-dope-cards-profiles-v1";

const PRESET_TEMPLATES = {
  "100-1000 yd (100 yd)": Array.from({ length: 10 }, (_, i) => 100 + i * 100),
  "50-500 yd (50 yd)": Array.from({ length: 10 }, (_, i) => 50 + i * 50),
  "25-300 yd (25 yd)": Array.from({ length: 12 }, (_, i) => 25 + i * 25),
};

function buildRowsFromDistances(distances: number[]): DopeRow[] {
  return distances.map((distance) => ({ id: crypto.randomUUID(), distance: String(distance), elevation: "", wind: "", note: "" }));
}

type DistanceUnit = "yd" | "m";
type AngularUnit = "mil" | "moa";

interface SavedCardProfile {
  name: string;
  payload: {
    selectedFirearm: string;
    selectedBuild: string;
    selectedAmmo: string;
    zeroDistance: string;
    unit: DistanceUnit;
    angularUnit: AngularUnit;
    clickValue: string;
    temperature: string;
    altitude: string;
    wind: string;
    cardSize: "index" | "half" | "compact";
    monochrome: boolean;
    boldDistanceElevation: boolean;
    rows: DopeRow[];
  };
}

export default function DopeCardsPage() {
  const [firearms, setFirearms] = useState<Firearm[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [ammoProfiles, setAmmoProfiles] = useState<AmmoStock[]>([]);

  const [selectedFirearm, setSelectedFirearm] = useState("");
  const [selectedBuild, setSelectedBuild] = useState("");
  const [selectedAmmo, setSelectedAmmo] = useState("");

  const [zeroDistance, setZeroDistance] = useState("100");
  const [unit, setUnit] = useState<DistanceUnit>("yd");
  const [angularUnit, setAngularUnit] = useState<AngularUnit>("mil");
  const [clickValue, setClickValue] = useState("0.1");
  const [temperature, setTemperature] = useState("59");
  const [altitude, setAltitude] = useState("0");
  const [wind, setWind] = useState("0");

  const [cardSize, setCardSize] = useState<"index" | "half" | "compact">("index");
  const [monochrome, setMonochrome] = useState(true);
  const [boldDistanceElevation, setBoldDistanceElevation] = useState(false);
  const [rows, setRows] = useState<DopeRow[]>(buildRowsFromDistances(PRESET_TEMPLATES["100-1000 yd (100 yd)"]));
  const [profileName, setProfileName] = useState("");
  const [savedProfiles, setSavedProfiles] = useState<SavedCardProfile[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedProfile, setSelectedProfile] = useState("");
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/firearms").then((res) => res.json()).then((data) => setFirearms(Array.isArray(data) ? data : [])).catch(() => setFirearms([]));
    fetch("/api/ammo").then((res) => res.json()).then((data) => setAmmoProfiles(Array.isArray(data?.all) ? data.all : [])).catch(() => setAmmoProfiles([]));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedProfiles));
  }, [savedProfiles]);

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

  const updateRow = (id: string, field: keyof Omit<DopeRow, "id">, value: string) => setRows((current) => current.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  const addRow = () => setRows((current) => [...current, { id: crypto.randomUUID(), distance: "", elevation: "", wind: "", note: "" }]);
  const removeRow = (id: string) => setRows((current) => current.filter((row) => row.id !== id));

  function saveProfile() {
    const name = profileName.trim();
    if (!name) return;
    const payload = { selectedFirearm, selectedBuild, selectedAmmo, zeroDistance, unit, angularUnit, clickValue, temperature, altitude, wind, cardSize, monochrome, boldDistanceElevation, rows };
    setSavedProfiles((current) => [...current.filter((p) => p.name !== name), { name, payload }]);
    setSelectedProfile(name);
  }

  function loadProfile() {
    const profile = savedProfiles.find((p) => p.name === selectedProfile);
    if (!profile) return;
    const p = profile.payload;
    setSelectedFirearm(p.selectedFirearm);
    setSelectedBuild(p.selectedBuild);
    setSelectedAmmo(p.selectedAmmo);
    setZeroDistance(p.zeroDistance);
    setUnit(p.unit);
    setAngularUnit(p.angularUnit);
    setClickValue(p.clickValue);
    setTemperature(p.temperature);
    setAltitude(p.altitude);
    setWind(p.wind);
    setCardSize(p.cardSize);
    setMonochrome(p.monochrome);
    setBoldDistanceElevation(p.boldDistanceElevation);
    setRows(p.rows);
    setProfileName(profile.name);
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ selectedFirearm, selectedBuild, selectedAmmo, zeroDistance, unit, angularUnit, clickValue, temperature, altitude, wind, cardSize, monochrome, boldDistanceElevation, rows }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dope-cards.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportCsv() {
    const lines = ["distance,elevation,wind,note,clicksUp,clicksWind"];
    rows.forEach((r) => {
      const clicksUp = clickValue ? Math.round((Number(r.elevation) || 0) / Number(clickValue)) : 0;
      const clicksWind = clickValue ? Math.round((Number(r.wind) || 0) / Number(clickValue)) : 0;
      lines.push([r.distance, r.elevation, r.wind, `"${r.note.replace(/"/g, '""')}"`, clicksUp, clicksWind].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dope-cards.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importFile(file?: File) {
    if (!file) return;
    file.text().then((text) => {
      if (file.name.endsWith(".json")) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.rows)) setRows(parsed.rows.map((r: DopeRow) => ({ ...r, id: r.id || crypto.randomUUID() })));
        if (parsed.unit) setUnit(parsed.unit);
        if (parsed.angularUnit) setAngularUnit(parsed.angularUnit);
        if (parsed.clickValue) setClickValue(parsed.clickValue);
      } else {
        const [, ...data] = text.trim().split("\n");
        const imported = data.map((line) => {
          const [distance, elevation, windValue, ...noteParts] = line.split(",");
          return { id: crypto.randomUUID(), distance: distance || "", elevation: elevation || "", wind: windValue || "", note: noteParts.join(",").replace(/^"|"$/g, "") };
        });
        setRows(imported);
      }
    });
  }

  return (
    <main className="min-h-screen bg-vault-bg pb-10">
      <PageHeader title="DOPE Cards" subtitle="Build, print, save, and share quick-reference hold cards." actions={<><Link href="/range" className="rounded-md border border-vault-border px-3 py-2 text-xs text-vault-text-muted hover:bg-vault-muted">Back to Range</Link><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-md bg-[#00C2FF] px-3 py-2 text-xs font-semibold text-black hover:bg-[#44d4ff]"><Printer className="h-3.5 w-3.5" />Print Card</button></>} />

      <div className="mx-auto grid w-full max-w-6xl gap-6 p-4 lg:grid-cols-[minmax(360px,420px)_1fr]">
        <section className="print:hidden rounded-lg border border-vault-border bg-vault-surface p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-vault-text-muted">Card Setup</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button className={`rounded-md border px-3 py-2 text-xs ${unit === "yd" ? "border-[#00C2FF] text-[#00C2FF]" : "border-vault-border"}`} onClick={() => setUnit("yd")}>Yards</button>
              <button className={`rounded-md border px-3 py-2 text-xs ${unit === "m" ? "border-[#00C2FF] text-[#00C2FF]" : "border-vault-border"}`} onClick={() => setUnit("m")}>Meters</button>
              <button className={`rounded-md border px-3 py-2 text-xs ${angularUnit === "mil" ? "border-[#00C2FF] text-[#00C2FF]" : "border-vault-border"}`} onClick={() => setAngularUnit("mil")}>MIL</button>
              <button className={`rounded-md border px-3 py-2 text-xs ${angularUnit === "moa" ? "border-[#00C2FF] text-[#00C2FF]" : "border-vault-border"}`} onClick={() => setAngularUnit("moa")}>MOA</button>
            </div>
            <div>
              <label className={LABEL_CLASS}>Scope Click Value ({angularUnit.toUpperCase()})</label>
              <input className={INPUT_CLASS} value={clickValue} onChange={(e) => setClickValue(e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Firearm</label>
              <select className={INPUT_CLASS} value={selectedFirearm} onChange={(e) => { const firearmId = e.target.value; setSelectedFirearm(firearmId); if (!firearmId) { setBuilds([]); setSelectedBuild(""); } }}>
                <option value="">Select firearm</option>
                {firearms.map((firearm) => <option key={firearm.id} value={firearm.id}>{firearm.name} • {firearm.caliber}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Rifle Build</label>
              <select className={INPUT_CLASS} value={selectedBuild} onChange={(e) => setSelectedBuild(e.target.value)} disabled={!selectedFirearm}><option value="">Select build</option>{builds.map((build) => <option key={build.id} value={build.id}>{build.name}</option>)}</select>
            </div>
            <div>
              <label className={LABEL_CLASS}>Ammo</label>
              <select className={INPUT_CLASS} value={selectedAmmo} onChange={(e) => setSelectedAmmo(e.target.value)}>
                <option value="">Select ammo</option>
                {ammoProfiles.map((ammo) => <option key={ammo.id} value={ammo.id}>{[ammo.brand, ammo.caliber, ammo.grainWeight ? `${ammo.grainWeight}gr` : ""].filter(Boolean).join(" • ")}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL_CLASS}>Zero Distance</label><input className={INPUT_CLASS} value={zeroDistance} onChange={(e) => setZeroDistance(e.target.value)} /></div>
              <div><label className={LABEL_CLASS}>Temp (°F)</label><input className={INPUT_CLASS} value={temperature} onChange={(e) => setTemperature(e.target.value)} /></div>
              <div><label className={LABEL_CLASS}>Altitude (ft)</label><input className={INPUT_CLASS} value={altitude} onChange={(e) => setAltitude(e.target.value)} /></div>
              <div><label className={LABEL_CLASS}>Wind (mph @ 90°)</label><input className={INPUT_CLASS} value={wind} onChange={(e) => setWind(e.target.value)} /></div>
            </div>

            <div><p className={LABEL_CLASS}>Preset Templates</p><div className="flex flex-wrap gap-2">{Object.entries(PRESET_TEMPLATES).map(([name, distances]) => <button key={name} type="button" onClick={() => setRows(buildRowsFromDistances(distances))} className="rounded-md border border-vault-border px-2.5 py-1.5 text-xs text-vault-text hover:bg-vault-muted">{name}</button>)}</div></div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className={LABEL_CLASS}>Print Card Size</label>
                <select className={INPUT_CLASS} value={cardSize} onChange={(e) => setCardSize(e.target.value as "index" | "half" | "compact")}>
                  <option value="index">Index Card (3x5&quot;)</option><option value="half">Half Page (5.5x8.5&quot;)</option><option value="compact">Compact Strip</option>
                </select>
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-vault-text"><input type="checkbox" checked={monochrome} onChange={(e) => setMonochrome(e.target.checked)} />High contrast monochrome</label>
              <label className="inline-flex items-center gap-2 text-sm text-vault-text"><input type="checkbox" checked={boldDistanceElevation} onChange={(e) => setBoldDistanceElevation(e.target.checked)} />Bold distance + elevation hold mode</label>
            </div>

            <div className="space-y-2 border-t border-vault-border pt-3">
              <label className={LABEL_CLASS}>Saved Profiles (solver + rifle + ammo)</label>
              <div className="flex flex-wrap gap-2">
                <input className={INPUT_CLASS + " max-w-56"} placeholder="Profile name" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                <button onClick={saveProfile} type="button" className="rounded-md border border-vault-border px-3 py-2 text-xs">Save</button>
                <select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} className={INPUT_CLASS + " max-w-56"}><option value="">Load profile…</option>{savedProfiles.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}</select>
                <button onClick={loadProfile} type="button" className="rounded-md border border-vault-border px-3 py-2 text-xs">Load</button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={exportCsv} type="button" className="inline-flex items-center gap-1 rounded-md border border-vault-border px-3 py-2 text-xs"><Download className="h-3.5 w-3.5" />Export CSV</button>
                <button onClick={exportJson} type="button" className="inline-flex items-center gap-1 rounded-md border border-vault-border px-3 py-2 text-xs"><Download className="h-3.5 w-3.5" />Export JSON</button>
                <button onClick={() => importRef.current?.click()} type="button" className="inline-flex items-center gap-1 rounded-md border border-vault-border px-3 py-2 text-xs"><Upload className="h-3.5 w-3.5" />Import CSV/JSON</button>
                <input ref={importRef} type="file" accept=".csv,.json" className="hidden" onChange={(e) => importFile(e.target.files?.[0])} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-vault-border bg-vault-surface p-4">
          <div className="mb-3 flex items-center justify-between print:hidden"><h2 className="text-sm font-semibold uppercase tracking-widest text-vault-text-muted">Distance / Hold Rows</h2><button type="button" onClick={addRow} className="inline-flex items-center gap-1 rounded-md border border-vault-border px-2.5 py-1.5 text-xs text-vault-text hover:bg-vault-muted"><Plus className="h-3.5 w-3.5" /> Add Row</button></div>

          <div className={`dope-print-card dope-print-${cardSize} ${monochrome ? "dope-print-monochrome" : ""} ${boldDistanceElevation ? "dope-print-bold-mode" : ""} overflow-hidden rounded-md border border-vault-border`}>
            <div className="border-b border-vault-border bg-vault-surface-2 px-3 py-2"><h3 className="text-sm font-semibold">DOPE Card</h3><p className="text-xs text-vault-text-muted">Zero {zeroDistance} {unit} • {selectedAmmoLabel || "Ammo not selected"}</p><p className="text-xs text-vault-text-muted">Temp {temperature}°F • Alt {altitude} ft • Wind {wind} mph • {angularUnit.toUpperCase()} clicks {clickValue}</p></div>
            <table className="w-full text-xs">
              <thead className="bg-vault-surface-2 text-left text-vault-text-muted"><tr><th className="px-3 py-2">Distance ({unit})</th><th className="px-3 py-2">Elevation ({angularUnit.toUpperCase()})</th><th className="px-3 py-2">Wind ({angularUnit.toUpperCase()})</th><th className="px-3 py-2">Clicks Up</th><th className="px-3 py-2">Clicks Wind</th><th className="px-3 py-2">Notes</th><th className="w-10 px-2 py-2 print:hidden" /></tr></thead>
              <tbody>
                {rows.map((row) => {
                  const clicksUp = clickValue ? Math.round((Number(row.elevation) || 0) / Number(clickValue)) : 0;
                  const clicksWind = clickValue ? Math.round((Number(row.wind) || 0) / Number(clickValue)) : 0;
                  return (
                    <tr key={row.id} className="border-t border-vault-border">
                      <td className="p-1.5"><input className={INPUT_CLASS} value={row.distance} onChange={(e) => updateRow(row.id, "distance", e.target.value)} /></td>
                      <td className="p-1.5"><input className={INPUT_CLASS} value={row.elevation} onChange={(e) => updateRow(row.id, "elevation", e.target.value)} /></td>
                      <td className="p-1.5"><input className={INPUT_CLASS} value={row.wind} onChange={(e) => updateRow(row.id, "wind", e.target.value)} /></td>
                      <td className="px-3 py-2 font-mono">{clicksUp}</td>
                      <td className="px-3 py-2 font-mono">{clicksWind}</td>
                      <td className="p-1.5"><input className={INPUT_CLASS} value={row.note} onChange={(e) => updateRow(row.id, "note", e.target.value)} /></td>
                      <td className="p-1.5 print:hidden"><button type="button" onClick={() => removeRow(row.id)} className="rounded-md p-1.5 text-vault-text-muted hover:bg-vault-muted hover:text-vault-text"><Trash2 className="h-3.5 w-3.5" /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
