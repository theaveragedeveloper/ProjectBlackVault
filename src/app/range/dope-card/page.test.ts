import { describe, expect, it } from "vitest";
import { validateGeneratorInputs } from "@/app/range/dope-card/page";

const VALID_INPUTS = {
  startYd: "100",
  endYd: "800",
  stepYd: "100",
  muzzleVelocityFps: "2650",
  ballisticCoefficient: "0.275",
  zeroRangeYd: "100",
  sightHeightIn: "1.9",
};

describe("validateGeneratorInputs", () => {
  it("accepts valid generator values", () => {
    expect(validateGeneratorInputs(VALID_INPUTS)).toEqual([]);
  });

  it("rejects non-positive start/end/step and end before start", () => {
    const errors = validateGeneratorInputs({
      ...VALID_INPUTS,
      startYd: "0",
      endYd: "-10",
      stepYd: "0",
    });

    expect(errors).toContain("Start distance must be greater than 0.");
    expect(errors).toContain("End distance must be greater than 0.");
    expect(errors).toContain("Step distance must be greater than 0.");
    expect(errors).toContain("End distance must be greater than or equal to start distance.");
  });

  it("rejects non-positive muzzle velocity and ballistic coefficient", () => {
    const errors = validateGeneratorInputs({
      ...VALID_INPUTS,
      muzzleVelocityFps: "0",
      ballisticCoefficient: "-0.1",
    });

    expect(errors).toContain("Muzzle velocity must be greater than 0.");
    expect(errors).toContain("Ballistic coefficient must be greater than 0.");
  });

  it("rejects non-positive zero range and sight height", () => {
    const errors = validateGeneratorInputs({
      ...VALID_INPUTS,
      zeroRangeYd: "0",
      sightHeightIn: "-1",
    });

    expect(errors).toContain("Zero range must be greater than 0.");
    expect(errors).toContain("Sight height must be greater than 0.");
  });
});
