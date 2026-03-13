import { inchesToMil, inchesToMoa, roundTo } from "@/lib/ballistics/conversions";

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

const DISTANCE_EPSILON = 1e-6;

function safeInches(value: number): number {
  // Keep conversions stable even if a caller passes invalid correction/input values.
  return Number.isFinite(value) ? value : 0;
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
        dropMil: roundTo(inchesToMil(dropIn, row.distanceYd), 2),
        dropMoa: roundTo(inchesToMoa(dropIn, row.distanceYd), 2),
        windMil: roundTo(inchesToMil(windIn, row.distanceYd), 2),
        windMoa: roundTo(inchesToMoa(windIn, row.distanceYd), 2),
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
      dropMil: roundTo(inchesToMil(dropIn, row.distanceYd), 2),
      dropMoa: roundTo(inchesToMoa(dropIn, row.distanceYd), 2),
      windMil: roundTo(inchesToMil(windIn, row.distanceYd), 2),
      windMoa: roundTo(inchesToMoa(windIn, row.distanceYd), 2),
      confirmed: correction.confirmed ?? row.confirmed,
    };
  });
}
