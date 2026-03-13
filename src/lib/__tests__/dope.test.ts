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
});
