import test from "node:test";
import assert from "node:assert/strict";
import { deriveVaultSetupState, hasVaultPassword } from "../src/lib/auth-state";

test("hasVaultPassword only returns true for non-empty strings", () => {
  assert.equal(hasVaultPassword(null), false);
  assert.equal(hasVaultPassword(undefined), false);
  assert.equal(hasVaultPassword(""), false);
  assert.equal(hasVaultPassword("hashed-password"), true);
});

test("deriveVaultSetupState requires setup when password is missing", () => {
  assert.deepEqual(deriveVaultSetupState(null), {
    passwordRequired: false,
    requiresSetup: true,
  });
});

test("deriveVaultSetupState reports setup complete when password exists", () => {
  assert.deepEqual(deriveVaultSetupState("stored-hash"), {
    passwordRequired: true,
    requiresSetup: false,
  });
});
