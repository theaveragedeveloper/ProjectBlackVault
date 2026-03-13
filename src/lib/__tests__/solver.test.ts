import { describe, expect, it } from "vitest";
import { generateDistanceRows } from "@/lib/ballistics/dope";
import { solveTrajectoryRows } from "@/lib/ballistics/solver";

describe("solveTrajectoryRows", () => {
  it("produces realistic benchmark trajectory trend for 6.5CM-like profile", () => {
    const rows = solveTrajectoryRows(generateDistanceRows(100, 800, 100), {
      muzzleVelocityFps: 2650,
      ballisticCoefficient: 0.275,
      dragModel: "G7",
      zeroRangeYd: 100,
      sightHeightIn: 1.9,
      twistIn: 8,
      temperatureF: 59,
      pressureInHg: 29.92,
      humidityPercent: 50,
      windSpeedMph: 10,
      windAngleDeg: 90,
    });

    const dropAt300 = rows.find((row) => row.distanceYd === 300)?.dropIn;
    const dropAt600 = rows.find((row) => row.distanceYd === 600)?.dropIn;
    const dropAt800 = rows.find((row) => row.distanceYd === 800)?.dropIn;

    expect(dropAt300).toBeGreaterThan(10);
    expect(dropAt300).toBeLessThan(25);
    expect(dropAt600).toBeGreaterThan(70);
    expect(dropAt600).toBeLessThan(130);
    expect(dropAt800).toBeGreaterThan(150);
    expect(dropAt800).toBeLessThan(280);
  });

  it("increases wind drift when crosswind and distance increase", () => {
    const rows = solveTrajectoryRows(generateDistanceRows(100, 600, 100), {
      muzzleVelocityFps: 2750,
      ballisticCoefficient: 0.23,
      dragModel: "G7",
      zeroRangeYd: 100,
      sightHeightIn: 1.8,
      twistIn: 7,
      temperatureF: 75,
      pressureInHg: 29.5,
      humidityPercent: 35,
      windSpeedMph: 12,
      windAngleDeg: 90,
    });

    expect(rows[0].windIn).toBeGreaterThan(0);
    expect(rows[5].windIn).toBeGreaterThan(rows[0].windIn);
  });
});
