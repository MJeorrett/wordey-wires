import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { loadWire } from "./load.js";
import { startServer } from "./server.js";

const USAGE = `Usage:
  node dist/cli.js <file.wire>                              Print the loaded JSON
  node dist/cli.js serve <folder> --home <id> [--port N]    Serve wireframes with hot reload`;

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const [command, ...rest] = process.argv.slice(2);

if (!command) fail(USAGE);

if (command === "serve") {
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      home: { type: "string" },
      port: { type: "string", default: "3000" },
    },
  });

  const dir = positionals[0];
  if (!dir || !values.home) fail(USAGE);

  const port = Number(values.port);
  if (!Number.isInteger(port)) fail(`Invalid port "${values.port}"`);

  startServer({ dir, home: values.home.replace(/^#/, ""), port });
} else {
  try {
    console.log(JSON.stringify(loadWire(readFileSync(command, "utf8")), null, 2));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}
