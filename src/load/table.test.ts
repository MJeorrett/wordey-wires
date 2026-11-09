import { describe, expect, it } from "vitest";
import type { Field } from "./fields.js";
import { loadWire } from "./index.js";
import type { RowNode, WireNode } from "../types.js";

const organisation: Field[] = [
  { label: "ID", examples: ["1", "2", "3"] },
  { label: "Name", placeholder: "Enter the name", input: "singleLineText", examples: ["Org 1", "Org 2"] },
];

const fields = new Map([["organisation", organisation]]);

function loadTable(body: string): WireNode[] {
  const source = `
wireframe #home
${body}
`;
  return loadWire(source, undefined, fields).wireframes[0]!.children;
}

describe("loadWire: Table", () => {
  it("starts with a header row holding a box per field, labelled from the field", () => {
    expect(loadTable("    Table fields=<organisation>")[0]).toEqual({
      type: "Row",
      children: [
        { type: "Box", text: "ID" },
        { type: "Box", text: "Name" },
      ],
    });
  });

  it("follows the header with 10 rows of examples, cycling each column's examples", () => {
    const rows = loadTable("    Table fields=<organisation>").slice(1) as RowNode[];

    expect(rows.map((row) => row.children.map((box) => (box as { text?: string }).text))).toEqual([
      ["1", "Org 1"],
      ["2", "Org 2"],
      ["3", "Org 1"],
      ["1", "Org 2"],
      ["2", "Org 1"],
      ["3", "Org 2"],
      ["1", "Org 1"],
      ["2", "Org 2"],
      ["3", "Org 1"],
      ["1", "Org 2"],
    ]);
  });

  it("rejects a table with no data", () => {
    expect(() => loadTable("    Table")).toThrow(
      "Line 3: Table needs data, e.g. Table fields=<organisation>",
    );
  });

  it("rejects data that does not exist", () => {
    expect(() => loadTable("    Table fields=<person>")).toThrow(
      "Line 3: unknown data <person> (expected fields/person.csv)",
    );
  });

  it("rejects children, which would otherwise be dropped", () => {
    expect(() => loadTable('    Table fields=<organisation>\n        Box "Inner"')).toThrow(
      "Line 3: Table cannot have children",
    );
  });
});
