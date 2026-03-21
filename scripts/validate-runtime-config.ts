import { getRuntimeConfigValidation } from "../src/lib/runtime-config";

const result = getRuntimeConfigValidation(true);

if (!result.ok) {
  console.error("Runtime configuration is invalid:");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Runtime configuration is valid.");

if (result.warnings.length > 0) {
  console.log("Warnings:");
  for (const warning of result.warnings) {
    console.log(`- ${warning}`);
  }
}
