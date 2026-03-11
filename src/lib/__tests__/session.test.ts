import { describe, it, expect } from "vitest";
import { signToken, verifyTokenNode } from "../session";

describe("signToken", () => {
  it("returns a string containing the original token", () => {
    const signed = signToken("mytoken", "mysecret");
    expect(signed).toContain("mytoken");
  });

  it("appends an HMAC separated by a dot", () => {
    const signed = signToken("mytoken", "mysecret");
    const parts = signed.split(".");
    expect(parts.length).toBeGreaterThanOrEqual(2);
    // The last segment is the HMAC hex (64 chars for sha256)
    expect(parts[parts.length - 1]).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces the same output for the same inputs (deterministic HMAC)", () => {
    const s1 = signToken("abc", "secret");
    const s2 = signToken("abc", "secret");
    expect(s1).toBe(s2);
  });

  it("produces different output for different secrets", () => {
    const s1 = signToken("abc", "secret1");
    const s2 = signToken("abc", "secret2");
    expect(s1).not.toBe(s2);
  });
});

describe("verifyTokenNode", () => {
  it("returns true for a correctly signed token", () => {
    const signed = signToken("mytoken", "mysecret");
    expect(verifyTokenNode(signed, "mysecret")).toBe(true);
  });

  it("returns false for a wrong secret", () => {
    const signed = signToken("mytoken", "correctsecret");
    expect(verifyTokenNode(signed, "wrongsecret")).toBe(false);
  });

  it("returns false if the token is tampered with", () => {
    const signed = signToken("mytoken", "mysecret");
    const tampered = "tampered." + signed.split(".").pop();
    expect(verifyTokenNode(tampered, "mysecret")).toBe(false);
  });

  it("returns false if the signature is tampered with", () => {
    const signed = signToken("mytoken", "mysecret");
    const tamperedSig = signed.slice(0, -4) + "aaaa";
    expect(verifyTokenNode(tamperedSig, "mysecret")).toBe(false);
  });

  it("returns false when there is no dot separator", () => {
    expect(verifyTokenNode("nodot", "mysecret")).toBe(false);
  });

  it("handles tokens that contain dots (e.g. JWT-like values)", () => {
    const tokenWithDot = "part1.part2";
    const signed = signToken(tokenWithDot, "secret");
    expect(verifyTokenNode(signed, "secret")).toBe(true);
  });
});
