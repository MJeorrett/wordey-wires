import type { BoxNode, WireNode } from "../types.js";
import type { Line } from "./lineTree.js";

export function loadNode(line: Line): WireNode {
  if (line.content === "Row") {
    return { type: "Row", children: line.children.map(loadNode) };
  }

  const match = /^(Box|Text)(?:\s+"([^"]*)")?$/.exec(line.content);
  if (!match) {
    const unquoted = /^(Box|Text)\s+([^"].*)$/.exec(line.content);
    if (unquoted) {
      throw new Error(
        `Line ${line.number}: text must be quoted, e.g. ${unquoted[1]} "${unquoted[2]}"`,
      );
    }

    throw new Error(`Line ${line.number}: unsupported syntax "${line.content}"`);
  }

  const isText = match[1] === "Text";
  const text = match[2];

  // Text is a Box without a border, so it loads as one.
  const box: BoxNode = { type: "Box" };
  if (isText) {
    if (text === undefined) {
      throw new Error(`Line ${line.number}: Text needs quoted text, e.g. Text "Hello"`);
    }
    if (line.children.length > 0) {
      throw new Error(`Line ${line.number}: Text cannot have children`);
    }
    box.border = "none";
  }

  if (text !== undefined) {
    box.text = text;
  }
  if (line.children.length > 0) {
    box.children = line.children.map(loadNode);
  }
  return box;
}
