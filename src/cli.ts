import { readFileSync } from "node:fs";
import { loadWire } from "./load.js";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node dist/cli.js <file.wire>");
  process.exit(1);
}

try {
  const document = loadWire(readFileSync(file, "utf8"));
  console.log(JSON.stringify(document, null, 2));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
