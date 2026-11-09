import type { WireDocument, Wireframe } from "../types.js";
import { parseLineTree, type Line } from "./lineTree.js";
import { loadNode } from "./nodes.js";

/**
 * Loads .wire source text and evaluates it into a plain JSON-serialisable
 * document of primitive layout nodes.
 */
export function loadWire(source: string): WireDocument {
  const roots = parseLineTree(source);
  return { wireframes: roots.map(loadWireframe) };
}

function loadWireframe(line: Line): Wireframe {
  const match = /^wireframe\s+#([\w-]+)$/.exec(line.content);
  if (!match) {
    throw new Error(`Line ${line.number}: expected "wireframe #id", got "${line.content}"`);
  }

  return {
    id: match[1]!,
    children: line.children.map(loadNode),
  };
}
