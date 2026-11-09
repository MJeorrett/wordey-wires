import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  collectTemplates,
  loadWire,
  parseFields,
  type Field,
  type FieldRegistry,
  type TemplateRegistry,
} from "./load/index.js";
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

  const fields = folderFields(dir);

  const wireframes: Wireframe[] = [];
  const definedIn = new Map<string, string>();

  for (const { file, source } of sources) {
    const loaded = inFile(file, () => loadWire(source, templates, fields));

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

/**
 * Serves `fields/<entity>.csv` files from `dir`. A file is only read (and
 * checked) when something references it, so unused CSVs can't break loading.
 */
function folderFields(dir: string): FieldRegistry {
  const cache = new Map<string, Field[]>();

  return {
    get(entity) {
      const cached = cache.get(entity);
      if (cached) return cached;

      const file = `fields/${entity}.csv`;
      if (!existsSync(join(dir, file))) return undefined;

      const fields = inFile(file, () => parseFields(readFileSync(join(dir, file), "utf8")));
      cache.set(entity, fields);
      return fields;
    },
  };
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
