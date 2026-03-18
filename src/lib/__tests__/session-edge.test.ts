import { describe, expect, it } from "vitest";
import { signToken } from "../session";
import { verifyTokenEdge } from "../session-edge";

describe("verifyTokenEdge", () => {
  it("accepts valid signatures", async () => {
    const signed = signToken("token-123", "mysecret");
    await expect(verifyTokenEdge(signed, "mysecret")).resolves.toBe(true);
  });

  it("rejects invalid signatures", async () => {
    const signed = signToken("token-123", "mysecret");
    await expect(verifyTokenEdge(signed, "wrongsecret")).resolves.toBe(false);
  });

  it("rejects malformed values", async () => {
    await expect(verifyTokenEdge("nosig", "secret")).resolves.toBe(false);
  });
});
