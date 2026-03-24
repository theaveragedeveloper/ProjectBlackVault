export type DrillPerformanceMode = "time" | "accuracy" | "both";

export type DrillMetricKey = "time" | "score" | "hitFactor";

export interface DrillMetricDefinition {
  key: DrillMetricKey;
  label: string;
  color: string;
  unit?: string;
  yAxisId?: "left" | "right";
}

export function resolveDrillMetrics(mode?: DrillPerformanceMode | null): DrillMetricDefinition[] {
  if (mode === "time") {
    return [{ key: "time", label: "Time", unit: "s", color: "#00C2FF", yAxisId: "left" }];
  }
  if (mode === "accuracy") {
    return [{ key: "score", label: "Score", unit: "pts", color: "#7CFF6B", yAxisId: "left" }];
  }

  return [
    { key: "time", label: "Time", unit: "s", color: "#00C2FF", yAxisId: "left" },
    { key: "hitFactor", label: "Hit Factor", color: "#F5A623", yAxisId: "right" },
  ];
}

export function inferDrillModeFromEntry(entry: { timeSeconds?: number | null; points?: number | null; hitFactor?: number | null }): DrillPerformanceMode {
  const points = Number(entry.points ?? 0);
  const time = Number(entry.timeSeconds ?? 0);
  const hitFactor = Number(entry.hitFactor ?? 0);

  if (points <= 0 && time > 0) return "time";
  if (time <= 1 && points > 0 && hitFactor <= 0) return "accuracy";
  return "both";
}
