#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const baseline = JSON.parse(readFileSync(".quality-baseline.json", "utf8"));

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  return { code: result.status ?? 1, output };
}

function parseEslintTotals(output) {
  const match = output.match(/✖\s+\d+\s+problems\s+\((\d+)\s+errors,\s+(\d+)\s+warnings\)/);
  if (!match) {
    return { errors: 0, warnings: 0 };
  }
  return { errors: Number(match[1]), warnings: Number(match[2]) };
}

function parseTypeErrors(output) {
  const matches = output.match(/: error TS\d+:/g);
  return matches ? matches.length : 0;
}

const checks = [];

const scopedLint = run("npx", ["eslint", "src/app/api", "src/components", "--max-warnings=0"]);
checks.push({ name: "Scoped lint (src/app/api + src/components)", passed: scopedLint.code === 0, output: scopedLint.output });

const fullLint = run("npm", ["run", "lint", "--", "--max-warnings=9999"]);
const lintTotals = parseEslintTotals(fullLint.output);
checks.push({
  name: "Debt baseline - lint totals",
  passed: lintTotals.errors <= baseline.lint.errors && lintTotals.warnings <= baseline.lint.warnings,
  output: `${fullLint.output}\nCurrent lint totals: ${lintTotals.errors} errors / ${lintTotals.warnings} warnings. Baseline: ${baseline.lint.errors} errors / ${baseline.lint.warnings} warnings.`,
});

const typecheck = run("npx", ["tsc", "--noEmit"]);
const typeErrorCount = parseTypeErrors(typecheck.output);
checks.push({
  name: "Debt baseline - typecheck totals",
  passed: typeErrorCount <= baseline.typecheck.errors,
  output: `${typecheck.output}\nCurrent TS errors: ${typeErrorCount}. Baseline: ${baseline.typecheck.errors}.`,
});

let allPassed = true;
for (const check of checks) {
  const icon = check.passed ? "✅" : "❌";
  console.log(`${icon} ${check.name}`);
  if (!check.passed) {
    allPassed = false;
    console.log(check.output);
  }
}

if (!allPassed) {
  process.exit(1);
}
