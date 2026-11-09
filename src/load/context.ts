import type { Line } from "./lineTree.js";
import type { TemplateRegistry } from "./templates.js";

/** A template call that is currently being expanded. */
export interface ActiveTemplate {
  name: string;
  /** Parameter name -> the string passed by the call. */
  args: Record<string, string>;
  /** The call's indented lines: what `{children}` expands to. */
  children: Line[];
  /** Line number of the call, for error messages. */
  callLine: number;
  /** Context to load `children` in: they are written by the caller, not the template. */
  callerContext: Context;
}

export interface Context {
  templates: TemplateRegistry;
  /** Set while loading the body of a template. */
  template?: ActiveTemplate;
}

/** Throws an error for `line`, saying which template (and call) it came from if inside one. */
export function fail(line: Line, context: Context, message: string): never {
  const origin = context.template
    ? ` (in template ${context.template.name}, used at line ${context.template.callLine})`
    : "";
  throw new Error(`Line ${line.number}: ${message}${origin}`);
}
