/** Shared helpers for tests. Not part of the build output. */
import { loadWire } from "./load/index.js";
import type { WireNode } from "./types.js";

/**
 * Lets expected output be written as indented multi-line blocks: drops the
 * blank first/last lines and the indentation shared by every line.
 */
export function html(strings: TemplateStringsArray): string {
  const lines = strings.raw[0]!.split("\n");
  if (lines[0]!.trim() === "") lines.shift();
  if (lines[lines.length - 1]!.trim() === "") lines.pop();

  const indent = Math.min(
    ...lines.filter((line) => line.trim() !== "").map((line) => line.length - line.trimStart().length),
  );
  return lines.map((line) => line.slice(indent)).join("\n");
}

/** Loads a source snippet and returns the nodes of its first wireframe. */
export function loadChildren(source: string): WireNode[] {
  return loadWire(source).wireframes[0]!.children;
}
