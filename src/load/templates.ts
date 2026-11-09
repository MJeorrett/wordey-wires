import type { Line } from "./lineTree.js";
import { parseLineTree } from "./lineTree.js";

export interface TemplateDefinition {
  name: string;
  params: string[];
  body: Line[];
  /** Whether the body has a `{children}` slot. */
  acceptsChildren: boolean;
  /** Line number of the definition. */
  line: number;
  /** File the template was defined in, when loading a folder. */
  origin?: string;
}

export type TemplateRegistry = Map<string, TemplateDefinition>;

/** Names a template may not use, because they are (or will be) built-in elements. */
const RESERVED_NAMES = new Set(["Box", "Text", "Row", "Table", "Form"]);

export function isTemplateLine(line: Line): boolean {
  return /^template\b/.test(line.content);
}

/** Adds the templates defined in `source` to `registry`. */
export function collectTemplates(
  source: string,
  registry: TemplateRegistry,
  origin?: string,
): TemplateRegistry {
  return collectTemplatesFromLines(parseLineTree(source), registry, origin);
}

export function collectTemplatesFromLines(
  roots: Line[],
  registry: TemplateRegistry,
  origin?: string,
): TemplateRegistry {
  for (const line of roots.filter(isTemplateLine)) {
    const template = parseTemplate(line, origin);

    const existing = registry.get(template.name);
    if (existing) {
      const where = existing.origin
        ? `in ${existing.origin}, line ${existing.line}`
        : `at line ${existing.line}`;
      throw new Error(
        `Line ${line.number}: Duplicate template ${template.name} (already defined ${where})`,
      );
    }
    registry.set(template.name, template);
  }
  return registry;
}

function parseTemplate(line: Line, origin?: string): TemplateDefinition {
  const match = /^template\s+(\w+)\s*\(([^)]*)\)$/.exec(line.content);
  if (!match) {
    throw new Error(
      `Line ${line.number}: expected "template Name(param, ...)", got "${line.content}"`,
    );
  }

  const name = match[1]!;
  if (RESERVED_NAMES.has(name)) {
    throw new Error(`Line ${line.number}: template name "${name}" clashes with a built-in element`);
  }

  const params = match[2]!.trim() === "" ? [] : match[2]!.split(",").map((p) => p.trim());
  params.forEach((param, index) => {
    if (!/^[A-Za-z_]\w*$/.test(param)) {
      throw new Error(`Line ${line.number}: invalid parameter name "${param}"`);
    }
    if (param === "children") {
      throw new Error(`Line ${line.number}: "children" is reserved and cannot be a parameter name`);
    }
    if (params.indexOf(param) !== index) {
      throw new Error(`Line ${line.number}: duplicate parameter "${param}"`);
    }
  });

  const acceptsChildren = checkBody(line.children, name, params);

  return { name, params, body: line.children, acceptsChildren, line: line.number, origin };
}

/** Checks every `{name}` in the body is a declared parameter. Returns whether there is a `{children}` slot. */
function checkBody(lines: Line[], templateName: string, params: string[]): boolean {
  let hasSlot = false;

  for (const line of lines) {
    if (line.content === "{children}") {
      hasSlot = true;
    } else {
      for (const match of line.content.matchAll(/\{(\w*)\}/g)) {
        const name = match[1]!;
        if (name === "children") {
          throw new Error(`Line ${line.number}: {children} must be on its own line`);
        }
        if (!params.includes(name)) {
          throw new Error(
            `Line ${line.number}: unknown parameter {${name}} in template ${templateName}`,
          );
        }
      }
    }
    if (checkBody(line.children, templateName, params)) hasSlot = true;
  }

  return hasSlot;
}
