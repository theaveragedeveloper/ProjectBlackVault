export interface BallisticsInputs {
  muzzleVelocityFps: number;
  ballisticCoefficientG1: number;
  zeroRangeYards: number;
  sightHeightInches: number;
  windSpeedMph: number;
  temperatureF: number;
  altitudeFeet: number;
  startRangeYards: number;
  endRangeYards: number;
  stepYards: number;
}

export interface DopeRow {
  rangeYards: number;
  dropInches: number;
  driftInches: number;
  elevationMil: number;
  windMil: number;
  elevationMoa: number;
  windMoa: number;
  velocityFps: number;
  timeOfFlightSec: number;
}

const GRAVITY_FTPS2 = 32.174;
const SEA_LEVEL_DENSITY = 1.225;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function airDensityKgM3(temperatureF: number, altitudeFeet: number): number {
  const tempC = (temperatureF - 32) * (5 / 9);
  const tempK = tempC + 273.15;
  const altitudeMeters = altitudeFeet * 0.3048;
  const pressure = 101325 * Math.pow(1 - 2.25577e-5 * altitudeMeters, 5.25588);
  const density = pressure / (287.05 * tempK);
  return clamp(density, 0.7, 1.35);
}

function dragKPerFoot(bcG1: number, densityKgM3: number): number {
  const densityRatio = densityKgM3 / SEA_LEVEL_DENSITY;
  const normalizedBc = clamp(bcG1, 0.1, 1.2);
  return (0.00004 * densityRatio) / normalizedBc;
}

function velocityAtRange(v0: number, kPerFoot: number, rangeFeet: number): number {
  if (kPerFoot <= 0) return v0;
  return v0 * Math.exp(-kPerFoot * rangeFeet);
}

function timeOfFlight(v0: number, kPerFoot: number, rangeFeet: number): number {
  if (kPerFoot <= 0) return rangeFeet / v0;
  return (Math.exp(kPerFoot * rangeFeet) - 1) / (kPerFoot * v0);
}

function bulletHeightAboveBoreInches(
  thetaRad: number,
  v0: number,
  kPerFoot: number,
  rangeFeet: number,
): number {
  const t = timeOfFlight(v0, kPerFoot, rangeFeet);
  const verticalFromAngleFt = rangeFeet * Math.tan(thetaRad);
  const dropFt = 0.5 * GRAVITY_FTPS2 * t * t;
  return (verticalFromAngleFt - dropFt) * 12;
}

function solveMuzzleAngleRad(
  v0: number,
  kPerFoot: number,
  zeroRangeFeet: number,
  sightHeightInches: number,
): number {
  let low = toRad(-2);
  let high = toRad(4);

  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    const yMid = bulletHeightAboveBoreInches(mid, v0, kPerFoot, zeroRangeFeet);

    if (yMid > sightHeightInches) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2;
}

export function buildDopeCard(inputs: BallisticsInputs): DopeRow[] {
  const density = airDensityKgM3(inputs.temperatureF, inputs.altitudeFeet);
  const k = dragKPerFoot(inputs.ballisticCoefficientG1, density);
  const muzzleAngle = solveMuzzleAngleRad(
    inputs.muzzleVelocityFps,
    k,
    inputs.zeroRangeYards * 3,
    inputs.sightHeightInches,
  );

  const rows: DopeRow[] = [];

  for (let rangeYards = inputs.startRangeYards; rangeYards <= inputs.endRangeYards; rangeYards += inputs.stepYards) {
    const rangeFeet = rangeYards * 3;
    const time = timeOfFlight(inputs.muzzleVelocityFps, k, rangeFeet);
    const yInches = bulletHeightAboveBoreInches(muzzleAngle, inputs.muzzleVelocityFps, k, rangeFeet);
    const offsetFromLosInches = yInches - inputs.sightHeightInches;

    const windFps = inputs.windSpeedMph * 1.46667;
    const driftInches = windFps * time * 12 * 0.15;

    const milScaleInches = (rangeYards / 100) * 3.6;
    const moaScaleInches = (rangeYards / 100) * 1.047;

    const elevationMil = rangeYards > 0 ? -offsetFromLosInches / milScaleInches : 0;
    const windMil = rangeYards > 0 ? driftInches / milScaleInches : 0;
    const elevationMoa = rangeYards > 0 ? -offsetFromLosInches / moaScaleInches : 0;
    const windMoa = rangeYards > 0 ? driftInches / moaScaleInches : 0;

    rows.push({
      rangeYards,
      dropInches: -offsetFromLosInches,
      driftInches,
      elevationMil,
      windMil,
      elevationMoa,
      windMoa,
      velocityFps: velocityAtRange(inputs.muzzleVelocityFps, k, rangeFeet),
      timeOfFlightSec: time,
    });
  }

  return rows;
}
