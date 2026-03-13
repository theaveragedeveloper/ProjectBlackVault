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


  it("handles decimal ranges without duplicating end distance and keeps order", () => {
    const rows = generateDistanceRows(100, 550, 33.3);

    expect(rows[rows.length - 1]).toEqual({ distanceYd: 550 });
    expect(rows.filter((row) => row.distanceYd === 550)).toHaveLength(1);

    for (let index = 1; index < rows.length; index += 1) {
      expect(rows[index].distanceYd).toBeGreaterThan(rows[index - 1].distanceYd);
    }
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

<<<<<<< HEAD
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
=======
  it("stays stable across repeated correction edits when recalculated from base rows", () => {
    const baseRows = [
      { distanceYd: 100, dropIn: 3.5, windIn: 1.2 },
      { distanceYd: 200, dropIn: 7, windIn: 2.4 },
    ];

    const deriveRows = (corrections: Record<number, { dropIn?: number; windIn?: number; confirmed?: boolean }>) =>
      applyDopeCorrections(convertDropWindToAngular(baseRows), corrections);

    let rows = deriveRows({});
    expect(rows[0]).toMatchObject({ dropIn: 3.5, windIn: 1.2, confirmed: false });

    rows = deriveRows({ 100: { dropIn: 4.1 } });
    expect(rows[0]).toMatchObject({ dropIn: 4.1, windIn: 1.2, confirmed: false });

    rows = deriveRows({ 100: { dropIn: 4.1, confirmed: true } });
    expect(rows[0]).toMatchObject({ dropIn: 4.1, windIn: 1.2, confirmed: true });

    rows = deriveRows({ 100: { windIn: 1.8, confirmed: false } });
    expect(rows[0]).toMatchObject({ dropIn: 3.5, windIn: 1.8, confirmed: false });

    rows = deriveRows({});
    expect(rows[0]).toMatchObject({ dropIn: 3.5, windIn: 1.2, confirmed: false });
>>>>>>> 8b8228c (Refactor dope card rows to derive from base data)
  });
});

describe("derived rows pattern", () => {
  it("stays stable across repeated correction edits when recalculated from base rows", () => {
    const baseRows = [
      { distanceYd: 100, dropIn: 3.5, windIn: 1.2 },
      { distanceYd: 200, dropIn: 7, windIn: 2.4 },
    ];

    const deriveRows = (corrections: Record<number, { dropIn?: number; windIn?: number; confirmed?: boolean }>) =>
      applyDopeCorrections(convertDropWindToAngular(baseRows), corrections);

    let rows = deriveRows({});
    expect(rows[0]).toMatchObject({ dropIn: 3.5, windIn: 1.2, confirmed: false });

    rows = deriveRows({ 100: { dropIn: 4.1 } });
    expect(rows[0]).toMatchObject({ dropIn: 4.1, windIn: 1.2, confirmed: false });

    rows = deriveRows({ 100: { dropIn: 4.1, confirmed: true } });
    expect(rows[0]).toMatchObject({ dropIn: 4.1, windIn: 1.2, confirmed: true });

    rows = deriveRows({ 100: { windIn: 1.8, confirmed: false } });
    expect(rows[0]).toMatchObject({ dropIn: 3.5, windIn: 1.8, confirmed: false });
  });
});
