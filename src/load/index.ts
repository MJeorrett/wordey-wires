import type { WireDocument, Wireframe } from "../types.js";
import type { Context } from "./context.js";
import { parseLineTree, type Line } from "./lineTree.js";
import { loadNodes } from "./nodes.js";
import {
  collectTemplatesFromLines,
  isTemplateLine,
  type TemplateRegistry,
} from "./templates.js";

export { collectTemplates, type TemplateRegistry } from "./templates.js";

/**
 * Loads .wire source text and evaluates it into a plain JSON-serialisable
 * document of primitive layout nodes.
 *
 * Templates defined in `source` are available to its wireframes. Pass
 * `templates` (see `collectTemplates`) to use a shared set instead, e.g. when
 * loading a folder where templates and wireframes are in different files.
 */
export function loadWire(source: string, templates?: TemplateRegistry): WireDocument {
  const roots = parseLineTree(source);
  const registry = templates ?? collectTemplatesFromLines(roots, new Map());
  const context: Context = { templates: registry };

  return {
    wireframes: roots.filter((line) => !isTemplateLine(line)).map((line) => loadWireframe(line, context)),
  };
}

function loadWireframe(line: Line, context: Context): Wireframe {
  const match = /^wireframe\s+#([\w-]+)$/.exec(line.content);
  if (!match) {
    throw new Error(`Line ${line.number}: expected "wireframe #id", got "${line.content}"`);
  }

  return {
    id: match[1]!,
    children: loadNodes(line.children, context),
  };
}
