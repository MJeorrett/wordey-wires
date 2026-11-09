import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadWire } from "./load/index.js";
import type { WireDocument, Wireframe } from "./types.js";

/**
 * Loads every .wire file under `dir` (including subfolders) and merges their
 * wireframes into a single document. Files are processed in name order so the
 * result is deterministic.
 */
export function loadWireFolder(dir: string): WireDocument {
  const files = readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((file) => file.replace(/\\/g, "/"))
    .filter((file) => file.endsWith(".wire") && !file.split("/").includes("node_modules"))
    .sort();

  const wireframes: Wireframe[] = [];
  const definedIn = new Map<string, string>();

  for (const file of files) {
    let loaded: WireDocument;
    try {
      loaded = loadWire(readFileSync(join(dir, file), "utf8"));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`${file}: ${message}`);
    }

    for (const wireframe of loaded.wireframes) {
      const existing = definedIn.get(wireframe.id);
      if (existing !== undefined) {
        throw new Error(
          `Duplicate wireframe #${wireframe.id} in ${file} (already defined in ${existing})`,
        );
      }
      definedIn.set(wireframe.id, file);
      wireframes.push(wireframe);
    }
  }

  return { wireframes };
}
