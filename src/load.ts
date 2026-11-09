import type { BoxNode, WireDocument, WireNode, Wireframe } from "./types.js";

interface Line {
  /** 1-based line number in the source, for error messages. */
  number: number;
  indent: number;
  content: string;
  children: Line[];
}

/**
 * Loads .wire source text and evaluates it into a plain JSON-serialisable
 * document of primitive layout nodes.
 */
export function loadWire(source: string): WireDocument {
  const roots = parseLineTree(source);
  return { wireframes: roots.map(loadWireframe) };
}

/** Groups non-blank lines into a tree based on indentation. */
function parseLineTree(source: string): Line[] {
  const roots: Line[] = [];
  const stack: Line[] = [];

  source.split(/\r?\n/).forEach((raw, index) => {
    if (raw.trim() === "") return;

    const indent = raw.length - raw.trimStart().length;
    const line: Line = {
      number: index + 1,
      indent,
      content: raw.trim(),
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    if (parent) {
      parent.children.push(line);
    } else {
      roots.push(line);
    }
    stack.push(line);
  });

  return roots;
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

function loadNode(line: Line): WireNode {
  const match = /^Box(?:\s+"([^"]*)")?$/.exec(line.content);
  if (!match) {
    const unquoted = /^(Box)\s+([^"].*)$/.exec(line.content);
    if (unquoted) {
      throw new Error(
        `Line ${line.number}: text must be quoted, e.g. ${unquoted[1]} "${unquoted[2]}"`,
      );
    }

    throw new Error(`Line ${line.number}: unsupported syntax "${line.content}"`);
  }

  const box: BoxNode = { type: "Box" };
  if (match[1] !== undefined) {
    box.text = match[1];
  }
  return box;
}
