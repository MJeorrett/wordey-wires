import type { BoxNode, WireNode } from "../types.js";
import { fail, type Context } from "./context.js";
import type { Field } from "./fields.js";
import type { Line } from "./lineTree.js";
import type { TemplateDefinition } from "./templates.js";

const BUILT_IN_ELEMENTS = new Set(["Box", "Text", "Row"]);

/** Loads lines into nodes. One line can produce several (a template call) or none (an empty `{children}`). */
export function loadNodes(lines: Line[], context: Context): WireNode[] {
  return lines.flatMap((line) => loadLine(line, context));
}

function loadLine(original: Line, context: Context): WireNode[] {
  if (original.content === "{children}") {
    return expandChildren(original, context);
  }

  // Inside a template body, parameters are replaced before the line is read.
  const line = context.template ? substitute(original, context, context.template.args) : original;

  if (!context.template) {
    const brace = /\{(\w*)\}/.exec(line.content);
    if (brace) {
      fail(line, context, `braces are reserved for template parameters, found {${brace[1]}}`);
    }
  }

  const name = /^\w+/.exec(line.content)?.[0];
  const template = name === undefined ? undefined : context.templates.get(name);
  if (template) {
    if (context.template) {
      fail(line, context, "templates cannot call other templates yet");
    }
    return expandCall(line, template, context);
  }

  if (name !== undefined && !BUILT_IN_ELEMENTS.has(name)) {
    fail(line, context, `unknown element or template "${name}"`);
  }

  return [loadElement(line, context)];
}

function loadElement(line: Line, context: Context): WireNode {
  if (line.content === "Row") {
    return { type: "Row", children: loadNodes(line.children, context) };
  }

  const match = /^(Box|Text)(?:\s+"([^"]*)")?$/.exec(line.content);
  if (!match) {
    const unquoted = /^(Box|Text)\s+([^"].*)$/.exec(line.content);
    if (unquoted) {
      fail(line, context, `text must be quoted, e.g. ${unquoted[1]} "${unquoted[2]}"`);
    }

    fail(line, context, `unsupported syntax "${line.content}"`);
  }

  const isText = match[1] === "Text";
  const text = match[2];

  // Text is a Box without a border, so it loads as one.
  const box: BoxNode = { type: "Box" };
  if (isText) {
    if (text === undefined) {
      fail(line, context, 'Text needs quoted text, e.g. Text "Hello"');
    }
    if (line.children.length > 0) {
      fail(line, context, "Text cannot have children");
    }
    box.border = "none";
  }

  if (text !== undefined) {
    box.text = text;
  }
  if (line.children.length > 0) {
    box.children = loadNodes(line.children, context);
  }
  return box;
}

/** `{children}`: the lines the caller indented under the template call. */
function expandChildren(line: Line, context: Context): WireNode[] {
  if (!context.template) {
    fail(line, context, "{children} can only be used inside a template");
  }
  if (line.children.length > 0) {
    fail(line, context, "{children} cannot have children");
  }
  // The children were written by the caller, so they load in the caller's context.
  return loadNodes(context.template.children, context.template.callerContext);
}

function expandCall(line: Line, template: TemplateDefinition, context: Context): WireNode[] {
  const args = parseArgs(line, template, context);

  if (line.children.length > 0 && !template.acceptsChildren) {
    fail(line, context, `${template.name} does not accept children (its body has no {children})`);
  }

  return loadNodes(template.body, {
    templates: context.templates,
    fields: context.fields,
    template: {
      name: template.name,
      args,
      children: line.children,
      callLine: line.number,
      callerContext: context,
    },
  });
}

/** Reads `key="value"` and `key=<entity>` arguments from a template call and checks them against its parameters. */
function parseArgs(
  line: Line,
  template: TemplateDefinition,
  context: Context,
): Record<string, string | Field[]> {
  const rest = line.content.slice(template.name.length).trim();
  const args: Record<string, string | Field[]> = {};

  const argument = /(\w+)=(?:"([^"]*)"|<(\w+)>)\s*/y;
  let position = 0;
  while (position < rest.length) {
    argument.lastIndex = position;
    const match = argument.exec(rest);
    if (!match) {
      fail(line, context, `arguments must be written key="value", got "${rest.slice(position)}"`);
    }

    const [, key, value, entity] = match;
    if (!template.params.includes(key!)) {
      fail(line, context, `${template.name} has no parameter "${key}"`);
    }
    if (Object.hasOwn(args, key!)) {
      fail(line, context, `parameter "${key}" given twice`);
    }
    if (entity === undefined) {
      args[key!] = value!;
    } else {
      const fields = context.fields.get(entity);
      if (!fields) {
        fail(line, context, `unknown data <${entity}> (expected fields/${entity}.csv)`);
      }
      args[key!] = fields;
    }
    position = argument.lastIndex;
  }

  for (const param of template.params) {
    if (!Object.hasOwn(args, param)) {
      fail(line, context, `${template.name} is missing parameter "${param}"`);
    }
  }

  return args;
}

function substitute(line: Line, context: Context, args: Record<string, string | Field[]>): Line {
  const content = line.content.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = args[name];
    if (Array.isArray(value)) {
      fail(line, context, `{${name}} holds data, which cannot be used inside text`);
    }
    return value ?? whole;
  });
  return { ...line, content };
}
