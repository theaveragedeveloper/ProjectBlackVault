export interface DistanceRow {
  distanceYd: number;
}

export interface BallisticOutputRow {
  distanceYd: number;
  dropIn: number;
  windIn: number;
}

export interface AngularDopeRow extends BallisticOutputRow {
  dropMil: number;
  dropMoa: number;
  windMil: number;
  windMoa: number;
  confirmed: boolean;
}

export interface DopeRowCorrection {
  dropIn?: number;
  windIn?: number;
  confirmed?: boolean;
}

export type WindDirectionUnit = "degrees" | "clock";

export interface WindInput {
  speedMph: number;
  directionValue: number;
  directionUnit: WindDirectionUnit;
}

export interface WindZoneInput extends WindInput {
  startYd: number;
  endYd: number | null;
}

export interface WindSolverInput {
  windDriftPerMphPer100YdIn: number;
  defaultWind: WindInput;
  zones?: WindZoneInput[];
}

const INCHES_PER_100YD_PER_MIL = 3.6;
const INCHES_PER_100YD_PER_MOA = 1.047;
const DISTANCE_EPSILON = 1e-6;

function roundTo(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toMil(inches: number, distanceYd: number): number {
  return inches / ((distanceYd / 100) * INCHES_PER_100YD_PER_MIL);
}

function toMoa(inches: number, distanceYd: number): number {
  return inches / ((distanceYd / 100) * INCHES_PER_100YD_PER_MOA);
}

function safeInches(value: number): number {
  // Keep conversions stable even if a caller passes invalid correction/input values.
  return Number.isFinite(value) ? value : 0;
}

export function windDirectionToDegrees(directionValue: number, directionUnit: WindDirectionUnit): number {
  if (!Number.isFinite(directionValue)) return 0;
  if (directionUnit === "clock") {
    const clock = ((directionValue % 12) + 12) % 12;
    return clock * 30;
  }

  const normalized = directionValue % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

export function effectiveCrosswindMph(speedMph: number, directionDegrees: number): number {
  if (!Number.isFinite(speedMph) || !Number.isFinite(directionDegrees)) {
    return 0;
  }

  const radians = (directionDegrees * Math.PI) / 180;
  return Math.abs(speedMph * Math.sin(radians));
}

function resolveWindForDistance(distanceYd: number, input: WindSolverInput): WindInput {
  const zone = input.zones?.find((candidate) => {
    const withinStart = distanceYd >= candidate.startYd;
    const withinEnd = candidate.endYd == null || distanceYd < candidate.endYd;
    return withinStart && withinEnd;
  });

  return zone ?? input.defaultWind;
}

export function estimateWindDriftIn(distanceYd: number, input: WindSolverInput): number {
  if (!Number.isFinite(distanceYd) || distanceYd <= 0 || !Number.isFinite(input.windDriftPerMphPer100YdIn)) {
    return 0;
  }

  const wind = resolveWindForDistance(distanceYd, input);
  const directionDegrees = windDirectionToDegrees(wind.directionValue, wind.directionUnit);
  const crosswindMph = effectiveCrosswindMph(wind.speedMph, directionDegrees);

  return roundTo((distanceYd / 100) * input.windDriftPerMphPer100YdIn * crosswindMph, 2);
}

export function generateDistanceRows(startYd: number, endYd: number, stepYd: number): DistanceRow[] {
  if (!Number.isFinite(startYd) || !Number.isFinite(endYd) || !Number.isFinite(stepYd)) {
    return [];
  }

  if (startYd <= 0 || endYd < startYd || stepYd <= 0) {
    return [];
  }

  const normalizedEndYd = roundTo(endYd, 4);
  const rows: DistanceRow[] = [];

  for (let distance = startYd; distance <= endYd; distance += stepYd) {
    const normalizedDistance = roundTo(distance, 4);
    rows.push({ distanceYd: normalizedDistance });
  }

  const hasExactEnd =
    rows.length > 0 &&
    Math.abs(rows[rows.length - 1].distanceYd - normalizedEndYd) < DISTANCE_EPSILON;

  if (!hasExactEnd) {
    rows.push({ distanceYd: normalizedEndYd });
  }

  return rows
    .sort((a, b) => a.distanceYd - b.distanceYd)
    .filter((row, index, allRows) => {
      if (index === 0) return true;
      return Math.abs(row.distanceYd - allRows[index - 1].distanceYd) >= DISTANCE_EPSILON;
    });
}

export function convertDropWindToAngular(rows: BallisticOutputRow[]): AngularDopeRow[] {
  return rows
    .filter((row) => row.distanceYd > 0)
    .map((row) => {
      const dropIn = safeInches(row.dropIn);
      const windIn = safeInches(row.windIn);

      return {
        ...row,
        dropIn,
        windIn,
        dropMil: roundTo(toMil(dropIn, row.distanceYd), 2),
        dropMoa: roundTo(toMoa(dropIn, row.distanceYd), 2),
        windMil: roundTo(toMil(windIn, row.distanceYd), 2),
        windMoa: roundTo(toMoa(windIn, row.distanceYd), 2),
        confirmed: false,
      };
    });
}

export function applyDopeCorrections(
  rows: AngularDopeRow[],
  correctionsByDistance: Record<number, DopeRowCorrection>
): AngularDopeRow[] {
  return rows.map((row) => {
    const correction = correctionsByDistance[row.distanceYd];
    if (!correction) return row;

    const dropIn = safeInches(correction.dropIn ?? row.dropIn);
    const windIn = safeInches(correction.windIn ?? row.windIn);

    return {
      ...row,
      dropIn,
      windIn,
      dropMil: roundTo(toMil(dropIn, row.distanceYd), 2),
      dropMoa: roundTo(toMoa(dropIn, row.distanceYd), 2),
      windMil: roundTo(toMil(windIn, row.distanceYd), 2),
      windMoa: roundTo(toMoa(windIn, row.distanceYd), 2),
      confirmed: correction.confirmed ?? row.confirmed,
    };
  });
}
