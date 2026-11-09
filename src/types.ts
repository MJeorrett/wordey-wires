/**
 * The fully-evaluated output of loading a .wire file.
 * Templates, Foreach, data references etc. are all resolved away;
 * only primitive layout nodes remain.
 */

export type WireNode = BoxNode | RowNode;
export type Border = "solid" | "none";

export interface BoxNode {
  type: "Box";
  /** Literal text shown inside the box. */
  text?: string;
  /** 1-12 column width. */
  width?: number;
  /** Id of the wireframe this box links to (without the leading #). */
  to?: string;
  /** Only "none" for now. `Text` in .wire source loads as a Box with border "none". */
  border?: Border;
  children?: WireNode[];
}

export interface RowNode {
  type: "Row";
  align?: "left" | "center" | "right";
  children: WireNode[];
}

export interface Wireframe {
  /** Id without the leading #, e.g. "home". */
  id: string;
  children: WireNode[];
}

export interface WireDocument {
  wireframes: Wireframe[];
}
