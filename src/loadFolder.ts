import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { collectTemplates, loadWire, type TemplateRegistry } from "./load/index.js";
import type { WireDocument, Wireframe } from "./types.js";

/**
 * Loads every .wire file under `dir` (including subfolders) and merges their
 * wireframes into a single document. Files are processed in name order so the
 * result is deterministic.
 *
 * Templates are collected from all files first, so a wireframe can use a
 * template defined in any file, whatever the order.
 */
export function loadWireFolder(dir: string): WireDocument {
  const files = readdirSync(dir, { recursive: true, encoding: "utf8" })
    .map((file) => file.replace(/\\/g, "/"))
    .filter((file) => file.endsWith(".wire") && !file.split("/").includes("node_modules"))
    .sort();

  const sources = files.map((file) => ({ file, source: readFileSync(join(dir, file), "utf8") }));

  const templates: TemplateRegistry = new Map();
  for (const { file, source } of sources) {
    inFile(file, () => collectTemplates(source, templates, file));
  }

  const wireframes: Wireframe[] = [];
  const definedIn = new Map<string, string>();

  for (const { file, source } of sources) {
    const loaded = inFile(file, () => loadWire(source, templates));

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

/** Runs `work`, prefixing any error with the file it came from. */
function inFile<T>(file: string, work: () => T): T {
  try {
    return work();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${file}: ${message}`);
  }
}
