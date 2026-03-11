import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, isHashed } from "../password";

describe("hashPassword", () => {
  it("returns a string starting with 'scrypt:'", () => {
    const hash = hashPassword("mypassword");
    expect(hash).toMatch(/^scrypt:/);
  });

  it("produces different hashes for the same password (unique salts)", () => {
    const h1 = hashPassword("samepassword");
    const h2 = hashPassword("samepassword");
    expect(h1).not.toBe(h2);
  });

  it("includes three colon-separated segments after prefix", () => {
    const hash = hashPassword("test");
    // format: "scrypt:<salt>:<hash>"
    const withoutPrefix = hash.slice("scrypt:".length);
    const parts = withoutPrefix.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0); // salt hex
    expect(parts[1].length).toBeGreaterThan(0); // hash hex
  });
});

describe("verifyPassword", () => {
  it("verifies a correct password against its hash", () => {
    const pw = "correct-horse-battery";
    const hash = hashPassword(pw);
    expect(verifyPassword(pw, hash)).toBe(true);
  });

  it("rejects a wrong password", () => {
    const hash = hashPassword("rightpassword");
    expect(verifyPassword("wrongpassword", hash)).toBe(false);
  });

  it("returns false for an empty stored value", () => {
    expect(verifyPassword("anything", "")).toBe(false);
  });

  it("supports legacy plaintext comparison (same length strings)", () => {
    expect(verifyPassword("hello", "hello")).toBe(true);
  });

  it("rejects mismatched-length legacy plaintext", () => {
    expect(verifyPassword("hi", "hello")).toBe(false);
  });

  it("returns false for a malformed hashed value (missing separator)", () => {
    expect(verifyPassword("test", "scrypt:noseparator")).toBe(false);
  });
});

describe("isHashed", () => {
  it("returns true for a value starting with 'scrypt:'", () => {
    expect(isHashed("scrypt:abc:def")).toBe(true);
  });

  it("returns false for plaintext", () => {
    expect(isHashed("plaintext")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isHashed("")).toBe(false);
  });
});
