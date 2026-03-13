import type { BallisticOutputRow, DistanceRow } from "@/lib/ballistics/dope";

export type DragModel = "G1" | "G7";

export interface SolverInput {
  muzzleVelocityFps: number;
  ballisticCoefficient: number;
  dragModel: DragModel;
  zeroRangeYd: number;
  sightHeightIn: number;
  twistIn: number;
  temperatureF: number;
  pressureInHg?: number;
  densityAltitudeFt?: number;
  humidityPercent: number;
  windSpeedMph: number;
  windAngleDeg: number;
}

const FT_PER_YD = 3;
const IN_PER_FT = 12;
const G_FTPS2 = 32.174;
const SEA_LEVEL_AIR_DENSITY = 0.0023769; // slug/ft^3
const SEA_LEVEL_TEMP_R = 518.67;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

function estimateAirDensity(input: SolverInput): number {
  if (Number.isFinite(input.densityAltitudeFt)) {
    const da = input.densityAltitudeFt as number;
    return SEA_LEVEL_AIR_DENSITY * Math.exp(-da / 30000);
  }

  const pressureInHg = input.pressureInHg ?? 29.92;
  const tempR = input.temperatureF + 459.67;
  const humidityFactor = 1 - clamp(input.humidityPercent, 0, 100) * 0.0015;

  const densityRatio = (pressureInHg / 29.92) * (SEA_LEVEL_TEMP_R / tempR) * humidityFactor;
  return SEA_LEVEL_AIR_DENSITY * densityRatio;
}

function dragConstant(input: SolverInput, airDensity: number): number {
  const modelFactor = input.dragModel === "G7" ? 0.65 : 1;
  return (0.000042 * (airDensity / SEA_LEVEL_AIR_DENSITY) * modelFactor) / Math.max(input.ballisticCoefficient, 0.01);
}

interface IntegratedState {
  xFt: number;
  tS: number;
  yFt: number;
  vyFps: number;
  velocityFps: number;
}

function integrateToDistance(targetYd: number, launchAngleRad: number, input: SolverInput): IntegratedState {
  const targetFt = targetYd * FT_PER_YD;
  const stepFt = 3;
  const airDensity = estimateAirDensity(input);
  const k = dragConstant(input, airDensity);

  let xFt = 0;
  let yFt = -input.sightHeightIn / IN_PER_FT;
  let vyFps = input.muzzleVelocityFps * Math.sin(launchAngleRad);
  let velocityFps = input.muzzleVelocityFps * Math.cos(launchAngleRad);
  let tS = 0;

  while (xFt < targetFt) {
    const dx = Math.min(stepFt, targetFt - xFt);
    const v = Math.max(velocityFps, 400);
    const vNext = Math.max(v - k * v * v * (dx / v), 300);
    const dt = dx / ((v + vNext) * 0.5);

    vyFps -= G_FTPS2 * dt;
    yFt += vyFps * dt;

    xFt += dx;
    tS += dt;
    velocityFps = vNext;
  }

  return { xFt, tS, yFt, vyFps, velocityFps };
}

function solveZeroLaunchAngle(input: SolverInput): number {
  let low = -0.03;
  let high = 0.08;

  for (let i = 0; i < 30; i += 1) {
    const mid = (low + high) / 2;
    const yMid = integrateToDistance(input.zeroRangeYd, mid, input).yFt;
    if (yMid > 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2;
}

function computeSpinDriftIn(distanceYd: number, timeS: number, input: SolverInput): number {
  const twistSign = input.twistIn >= 0 ? 1 : -1;
  const twistRate = Math.abs(input.twistIn) > 0 ? 12 / Math.abs(input.twistIn) : 0;
  const distanceFactor = (distanceYd / 1000) ** 1.4;
  return twistSign * 0.8 * twistRate * distanceFactor * timeS;
}

export function solveTrajectoryRows(distances: DistanceRow[], input: SolverInput): BallisticOutputRow[] {
  if (!distances.length) return [];

  const launchAngle = solveZeroLaunchAngle(input);
  const windFps = input.windSpeedMph * 1.46667 * Math.sin(toRadians(input.windAngleDeg));

  return distances.map(({ distanceYd }) => {
    const state = integrateToDistance(distanceYd, launchAngle, input);
    const dropIn = Math.max(0, -state.yFt * IN_PER_FT);
    const windIn = windFps * state.tS * IN_PER_FT * 0.9 + computeSpinDriftIn(distanceYd, state.tS, input);

    return {
      distanceYd,
      dropIn: Math.round(dropIn * 100) / 100,
      windIn: Math.round(windIn * 100) / 100,
    };
  });
}
