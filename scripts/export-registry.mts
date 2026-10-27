// Writes content/capabilities/registry.json from the
// canonical registry in src/lib/workforce/registry/data.ts.
// Run: npm run registry:export
import { writeFileSync } from "node:fs";
import { capabilityRegistryData } from "../src/lib/workforce/registry/data.ts";

const header =
  "Generated from src/lib/workforce/registry/data.ts by npm run registry:export. Do not edit.";
writeFileSync(
  new URL("../content/capabilities/registry.json", import.meta.url),
  `${JSON.stringify({ _generated: header, ...capabilityRegistryData }, null, 2)}\n`,
);
console.log(`Exported ${capabilityRegistryData.capabilities.length} capabilities.`);
