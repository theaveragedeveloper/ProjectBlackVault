import test from "node:test";
import assert from "node:assert/strict";
import {
  clearRuntimeConfigValidationCache,
  getRuntimeConfigValidation,
} from "../src/lib/runtime-config";

const BASE_ENV = { ...process.env };

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    delete process.env[key];
  }
  Object.assign(process.env, BASE_ENV);
  clearRuntimeConfigValidationCache();
}

test.afterEach(() => {
  resetEnv();
});

test("passes validation with a minimal SQLite configuration", () => {
  resetEnv();
  process.env.DATABASE_URL = "file:./data/vault.db";
  delete process.env.VAULT_ENCRYPTION_KEY;
  delete process.env.SESSION_SECRET;

  const result = getRuntimeConfigValidation(true);
  assert.equal(result.ok, true);
  assert.deepEqual(result.errors, []);
});

test("fails when DATABASE_URL is missing", () => {
  resetEnv();
  delete process.env.DATABASE_URL;

  const result = getRuntimeConfigValidation(true);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /DATABASE_URL is required/i);
});

test("fails on invalid encryption key format", () => {
  resetEnv();
  process.env.DATABASE_URL = "file:./data/vault.db";
  process.env.VAULT_ENCRYPTION_KEY = "not-a-valid-key";

  const result = getRuntimeConfigValidation(true);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /VAULT_ENCRYPTION_KEY/i);
});

test("fails on invalid port", () => {
  resetEnv();
  process.env.DATABASE_URL = "file:./data/vault.db";
  process.env.PORT = "abc";

  const result = getRuntimeConfigValidation(true);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /PORT must be a number/i);
});

test("fails on invalid bind address", () => {
  resetEnv();
  process.env.DATABASE_URL = "file:./data/vault.db";
  process.env.BIND_ADDRESS = "example.invalid.local";

  const result = getRuntimeConfigValidation(true);
  assert.equal(result.ok, false);
  assert.match(result.errors.join(" "), /BIND_ADDRESS/i);
});

test("warns when LAN access and key export are enabled", () => {
  resetEnv();
  process.env.DATABASE_URL = "file:./data/vault.db";
  process.env.BIND_ADDRESS = "0.0.0.0";
  process.env.ALLOW_ENCRYPTION_KEY_EXPORT = "true";

  const result = getRuntimeConfigValidation(true);
  assert.equal(result.ok, true);
  assert.match(result.warnings.join(" "), /BIND_ADDRESS=0\.0\.0\.0/i);
  assert.match(result.warnings.join(" "), /ALLOW_ENCRYPTION_KEY_EXPORT=true/i);
});
