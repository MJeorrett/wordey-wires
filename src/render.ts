import { escapeHtml } from "./escape.js";
import type { BoxNode, RowNode, WireNode, Wireframe } from "./types.js";

const GRID_COLUMNS = 12;
const DEFAULT_SPAN = 3;
const INDENT = "  ";

/**
 * Renders a wireframe's nodes to an HTML fragment (no <html>/<head> wrapper),
 * one element per line, indented two spaces per level.
 */
export function renderWireframe(wireframe: Wireframe): string {
  return wireframe.children.flatMap(renderNode).join("\n");
}

// Each render function returns the element as lines, with children already
// indented relative to the element's own opening tag.

function renderNode(node: WireNode): string[] {
  switch (node.type) {
    case "Box":
      return renderBox(node);
    case "Row":
      return renderRow(node);
  }
}

/** @param gridColumn CSS `grid-column` value, set when the box is laid out by a Row. */
function renderBox(box: BoxNode, gridColumn?: string): string[] {
  const classes = ["box"];
  if (box.border === "none") classes.push("borderless");

  const style = gridColumn === undefined ? "" : ` style="grid-column: ${gridColumn}"`;
  const [open, close] =
    box.to !== undefined
      ? [`<a class="${classes.join(" ")}" href="/${escapeHtml(box.to)}"${style}>`, "</a>"]
      : [`<div class="${classes.join(" ")}"${style}>`, "</div>"];

  const text = escapeHtml(box.text ?? "");
  const children = (box.children ?? []).flatMap(renderNode);

  if (children.length === 0) return [open + text + close];
  return wrap(open, close, [...(text ? [text] : []), ...children]);
}

function renderRow(row: RowNode): string[] {
  if (row.children.length === 0) return ['<div class="row"></div>'];

  return row.align === undefined ? renderFillingRow(row) : renderAlignedRow(row);
}

/**
 * Without `align`, the children fill the whole row and share it in proportion
 * to their widths (a width is a weight, so 2 and 3 split the row 2:3).
 */
function renderFillingRow(row: RowNode): string[] {
  const tracks = row.children
    .map((node) => `minmax(0, ${node.type === "Box" ? (node.width ?? DEFAULT_SPAN) : DEFAULT_SPAN}fr)`)
    .join(" ");

  return wrap(
    `<div class="row" style="grid-template-columns: ${tracks}">`,
    "</div>",
    row.children.flatMap(renderNode),
  );
}

/**
 * With `align`, widths are literal columns of the 12-column grid and the
 * children are positioned left, centre or right within the row.
 */
function renderAlignedRow(row: RowNode): string[] {
  const spanOf = (node: WireNode) =>
    node.type === "Box" ? (node.width ?? DEFAULT_SPAN) : 0;
  const totalSpan = row.children.reduce((sum, node) => sum + spanOf(node), 0);
  const start = alignedStart(row.align, totalSpan);

  const children = row.children.flatMap((node, index) => {
    if (node.type !== "Box") return renderNode(node);

    const span = `span ${spanOf(node)}`;
    // Only the first child needs an explicit start; the rest flow on after it.
    const gridColumn = index === 0 && start !== undefined ? `${start} / ${span}` : span;
    return renderBox(node, gridColumn);
  });

  return wrap('<div class="row">', "</div>", children);
}

function wrap(open: string, close: string, innerLines: string[]): string[] {
  return [open, ...innerLines.map((line) => INDENT + line), close];
}

/** The 1-based grid column the first child should start at, or undefined to flow from the left. */
function alignedStart(align: RowNode["align"], totalSpan: number): number | undefined {
  const free = GRID_COLUMNS - totalSpan;
  if (free <= 0) return undefined;

  switch (align) {
    case "right":
      return 1 + free;
    case "center":
      return 1 + Math.floor(free / 2);
    default:
      return undefined;
  }
}
