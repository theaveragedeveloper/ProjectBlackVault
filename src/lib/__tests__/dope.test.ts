import { describe, expect, it } from "vitest";
import {
  applyDopeCorrections,
  convertDropWindToAngular,
  generateDistanceRows,
} from "@/lib/ballistics/dope";

describe("generateDistanceRows", () => {
  it("builds inclusive rows and appends end distance", () => {
    expect(generateDistanceRows(100, 350, 100)).toEqual([
      { distanceYd: 100 },
      { distanceYd: 200 },
      { distanceYd: 300 },
      { distanceYd: 350 },
    ]);
  });

  it("returns empty for invalid input", () => {
    expect(generateDistanceRows(0, 600, 100)).toEqual([]);
    expect(generateDistanceRows(600, 100, 100)).toEqual([]);
    expect(generateDistanceRows(100, 600, 0)).toEqual([]);
  });
});

describe("convertDropWindToAngular", () => {
  it("converts inches to mil/moa", () => {
    const rows = convertDropWindToAngular([{ distanceYd: 200, dropIn: 8, windIn: 4 }]);
    expect(rows[0]).toMatchObject({
      dropMil: 1.11,
      dropMoa: 3.82,
      windMil: 0.56,
      windMoa: 1.91,
      confirmed: false,
    });
  });

  it("coerces invalid drop/wind values to 0 so angular values stay finite", () => {
    const rows = convertDropWindToAngular([{ distanceYd: 200, dropIn: Number.NaN, windIn: Number.POSITIVE_INFINITY }]);

    expect(rows[0]).toMatchObject({
      dropIn: 0,
      windIn: 0,
      dropMil: 0,
      dropMoa: 0,
      windMil: 0,
      windMoa: 0,
    });
    expect(Number.isNaN(rows[0].dropMil)).toBe(false);
    expect(Number.isNaN(rows[0].dropMoa)).toBe(false);
    expect(Number.isNaN(rows[0].windMil)).toBe(false);
    expect(Number.isNaN(rows[0].windMoa)).toBe(false);
  });
});

describe("applyDopeCorrections", () => {
  it("applies manual per-row corrections and recomputes angular values", () => {
    const generated = convertDropWindToAngular([{ distanceYd: 300, dropIn: 9, windIn: 6 }]);
    const corrected = applyDopeCorrections(generated, {
      300: { dropIn: 12, confirmed: true },
    });

    expect(corrected[0]).toMatchObject({
      dropIn: 12,
      windIn: 6,
      dropMil: 1.11,
      confirmed: true,
    });
  });

  it("falls back to generated values when correction fields are undefined", () => {
    const generated = convertDropWindToAngular([{ distanceYd: 300, dropIn: 9, windIn: 6 }]);
    const corrected = applyDopeCorrections(generated, {
      300: { dropIn: undefined, windIn: undefined },
    });

    expect(corrected[0]).toMatchObject({
      dropIn: 9,
      windIn: 6,
      dropMil: 0.83,
      dropMoa: 2.87,
      windMil: 0.56,
      windMoa: 1.91,
    });
    expect(Number.isNaN(corrected[0].dropMil)).toBe(false);
    expect(Number.isNaN(corrected[0].dropMoa)).toBe(false);
    expect(Number.isNaN(corrected[0].windMil)).toBe(false);
    expect(Number.isNaN(corrected[0].windMoa)).toBe(false);
  });
});
