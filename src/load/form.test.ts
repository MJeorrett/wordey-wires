import { describe, expect, it } from "vitest";
import type { Field } from "./fields.js";
import { loadWire } from "./index.js";

const organisation: Field[] = [
  { label: "ID", examples: ["1", "2"] },
  { label: "Name", placeholder: "Enter the name", input: "singleLineText", examples: ["Org 1"] },
  { label: "Website", input: "singleLineText", examples: ["a.com"] },
];

const fields = new Map([["organisation", organisation]]);

function loadForm(body: string) {
  const source = `
wireframe #home
${body}
`;
  return loadWire(source, undefined, fields).wireframes[0]!.children;
}

describe("loadWire: Form", () => {
  it("renders a label and a placeholder box for each field, skipping fields with no input", () => {
    expect(loadForm("    Form fields=<organisation>")).toEqual([
      { type: "Box", text: "Name", border: "none" },
      { type: "Box", text: "Enter the name" },
      { type: "Box", text: "Website", border: "none" },
      { type: "Box" },
    ]);
  });

  it("can sit among other elements", () => {
    expect(loadForm('    Box "Before"\n    Form fields=<organisation>\n    Box "After"')).toHaveLength(6);
  });

  it("rejects a form with no data", () => {
    expect(() => loadForm("    Form")).toThrow(
      "Line 3: Form needs data, e.g. Form fields=<organisation>",
    );
  });

  it("rejects data that does not exist", () => {
    expect(() => loadForm("    Form fields=<person>")).toThrow(
      "Line 3: unknown data <person> (expected fields/person.csv)",
    );
  });

  it("rejects children, which would otherwise be dropped", () => {
    expect(() => loadForm('    Form fields=<organisation>\n        Box "Inner"')).toThrow(
      "Line 3: Form cannot have children",
    );
  });
});
