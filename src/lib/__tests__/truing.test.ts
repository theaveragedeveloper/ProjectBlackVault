import { describe, expect, it } from "vitest";
import { trueBallisticProfile } from "@/lib/ballistics/truing";

const baseRows = [
  { distanceYd: 100, dropIn: 3.5, windIn: 1.2 },
  { distanceYd: 200, dropIn: 7, windIn: 2.4 },
  { distanceYd: 300, dropIn: 10.5, windIn: 3.6 },
  { distanceYd: 400, dropIn: 14, windIn: 4.8 },
];

describe("trueBallisticProfile", () => {
  it("converges when truing muzzle velocity from an observed impact", () => {
    const result = trueBallisticProfile({
      rows: baseRows,
      baselineMv: 2750,
      baselineBc: 0.5,
      targetDistanceYd: 400,
      observedElevationMil: 1.2,
      adjust: "mv",
    });

    expect(result).not.toBeNull();
    expect(result!.truedMv).toBeCloseTo(2475.28, 2);
    expect(result!.truedBc).toBe(0.5);
    expect(Math.abs(result!.targetErrorMil)).toBeLessThan(0.0001);
  });

  it("returns deterministic output for repeated runs", () => {
    const runA = trueBallisticProfile({
      rows: baseRows,
      baselineMv: 2750,
      baselineBc: 0.5,
      targetDistanceYd: 300,
      observedElevationMil: 1.1,
      adjust: "bc",
    });

    const runB = trueBallisticProfile({
      rows: baseRows,
      baselineMv: 2750,
      baselineBc: 0.5,
      targetDistanceYd: 300,
      observedElevationMil: 1.1,
      adjust: "bc",
    });

    expect(runA).toEqual(runB);
    expect(runA!.truedBc).toBeCloseTo(0.442, 3);
  });
});
