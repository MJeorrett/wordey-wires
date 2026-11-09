import { describe, expect, it } from "vitest";
import { loadWire } from "./index.js";
import type { Field } from "./fields.js";

const organisation: Field[] = [{ label: "Name", examples: ["Org 1"] }];

const source = `
template List(fields)
    Box "List"

wireframe #home
    List fields=<organisation>
`;

describe("loadWire: data references", () => {
  it("accepts <entity> as a template argument when the data exists", () => {
    const fields = new Map([["organisation", organisation]]);

    expect(loadWire(source, undefined, fields).wireframes).toEqual([
      { id: "home", children: [{ type: "Box", text: "List" }] },
    ]);
  });

  it("rejects <entity> when there is no data for it, reporting the line number", () => {
    expect(() => loadWire(source)).toThrow(
      "Line 6: unknown data <organisation> (expected fields/organisation.csv)",
    );
  });

  it("rejects a data parameter used inside a string", () => {
    const fields = new Map([["organisation", organisation]]);
    const source = `
template List(fields)
    Box "Fields: {fields}"

wireframe #home
    List fields=<organisation>
`;

    expect(() => loadWire(source, undefined, fields)).toThrow(
      "Line 3: {fields} holds data, which cannot be used inside text (in template List, used at line 6)",
    );
  });
});
