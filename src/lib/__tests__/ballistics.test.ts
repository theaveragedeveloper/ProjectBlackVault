import { describe, expect, it } from "vitest";
import { buildDopeCard } from "@/lib/ballistics";

describe("buildDopeCard", () => {
  it("returns a row at the zero range with near-zero elevation correction", () => {
    const rows = buildDopeCard({
      muzzleVelocityFps: 2650,
      ballisticCoefficientG1: 0.47,
      zeroRangeYards: 100,
      sightHeightInches: 1.8,
      windSpeedMph: 10,
      temperatureF: 59,
      altitudeFeet: 1200,
      startRangeYards: 100,
      endRangeYards: 100,
      stepYards: 25,
    });

    expect(rows).toHaveLength(1);
    expect(Math.abs(rows[0].elevationMil)).toBeLessThan(0.05);
  });

  it("increases drop and decreases velocity as range increases", () => {
    const rows = buildDopeCard({
      muzzleVelocityFps: 2800,
      ballisticCoefficientG1: 0.5,
      zeroRangeYards: 100,
      sightHeightInches: 1.9,
      windSpeedMph: 10,
      temperatureF: 70,
      altitudeFeet: 0,
      startRangeYards: 100,
      endRangeYards: 500,
      stepYards: 100,
    });

    expect(rows).toHaveLength(5);
    expect(rows.at(-1)?.dropInches ?? 0).toBeGreaterThan(rows[0].dropInches);
    expect(rows.at(-1)?.velocityFps ?? 99999).toBeLessThan(rows[0].velocityFps);
    expect(rows.at(-1)?.timeOfFlightSec ?? 0).toBeGreaterThan(rows[0].timeOfFlightSec);
  });
});
