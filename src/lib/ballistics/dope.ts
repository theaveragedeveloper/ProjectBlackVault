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

const INCHES_PER_100YD_PER_MIL = 3.6;
const INCHES_PER_100YD_PER_MOA = 1.047;

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

export function generateDistanceRows(startYd: number, endYd: number, stepYd: number): DistanceRow[] {
  if (!Number.isFinite(startYd) || !Number.isFinite(endYd) || !Number.isFinite(stepYd)) {
    return [];
  }

  if (startYd <= 0 || endYd < startYd || stepYd <= 0) {
    return [];
  }

  const rows: DistanceRow[] = [];
  for (let distance = startYd; distance <= endYd; distance += stepYd) {
    rows.push({ distanceYd: roundTo(distance, 4) });
  }

  const hasExactEnd = rows.length > 0 && rows[rows.length - 1].distanceYd === endYd;
  if (!hasExactEnd) {
    rows.push({ distanceYd: endYd });
  }

  return rows;
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
