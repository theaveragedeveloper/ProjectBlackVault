import type { BallisticOutputRow } from "@/lib/ballistics/dope";

const INCHES_PER_100YD_PER_MIL = 3.6;

export type TruingParameter = "mv" | "bc";

export interface TrueProfileInput {
  rows: BallisticOutputRow[];
  baselineMv: number;
  baselineBc: number;
  targetDistanceYd: number;
  observedElevationMil: number;
  adjust: TruingParameter;
}

export interface TruedProfile {
  rows: BallisticOutputRow[];
  truedMv: number;
  truedBc: number;
  targetErrorMil: number;
}

function toMil(inches: number, distanceYd: number): number {
  return inches / ((distanceYd / 100) * INCHES_PER_100YD_PER_MIL);
}

function scaleRows(
  rows: BallisticOutputRow[],
  baselineMv: number,
  baselineBc: number,
  candidateMv: number,
  candidateBc: number
): BallisticOutputRow[] {
  const scale = (baselineMv / candidateMv) ** 2 * (baselineBc / candidateBc);
  return rows.map((row) => ({
    ...row,
    dropIn: row.dropIn * scale,
    windIn: row.windIn * scale,
  }));
}

export function trueBallisticProfile(input: TrueProfileInput): TruedProfile | null {
  const { rows, baselineMv, baselineBc, targetDistanceYd, observedElevationMil, adjust } = input;
  if (!rows.length || baselineMv <= 0 || baselineBc <= 0 || targetDistanceYd <= 0 || observedElevationMil <= 0) {
    return null;
  }

  const targetRow = rows.find((row) => row.distanceYd === targetDistanceYd);
  if (!targetRow) return null;

  const evaluate = (candidate: number): number => {
    const scaled =
      adjust === "mv"
        ? scaleRows(rows, baselineMv, baselineBc, candidate, baselineBc)
        : scaleRows(rows, baselineMv, baselineBc, baselineMv, candidate);
    const row = scaled.find((r) => r.distanceYd === targetDistanceYd);
    if (!row) return Number.POSITIVE_INFINITY;
    return toMil(row.dropIn, row.distanceYd) - observedElevationMil;
  };

  let low = adjust === "mv" ? baselineMv * 0.5 : baselineBc * 0.5;
  let high = adjust === "mv" ? baselineMv * 1.5 : baselineBc * 1.5;
  let lowErr = evaluate(low);
  let highErr = evaluate(high);

  let expands = 0;
  while (lowErr * highErr > 0 && expands < 8) {
    low *= 0.8;
    high *= 1.2;
    lowErr = evaluate(low);
    highErr = evaluate(high);
    expands += 1;
  }

  if (lowErr * highErr > 0) return null;

  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    const midErr = evaluate(mid);
    if (Math.abs(midErr) < 1e-6) {
      low = mid;
      high = mid;
      break;
    }

    if (lowErr * midErr <= 0) {
      high = mid;
      highErr = midErr;
    } else {
      low = mid;
      lowErr = midErr;
    }
  }

  const tunedValue = (low + high) / 2;
  const truedMv = adjust === "mv" ? tunedValue : baselineMv;
  const truedBc = adjust === "bc" ? tunedValue : baselineBc;
  const truedRows = scaleRows(rows, baselineMv, baselineBc, truedMv, truedBc);
  const targetErrorMil = evaluate(tunedValue);

  return {
    rows: truedRows,
    truedMv,
    truedBc,
    targetErrorMil,
  };
}
