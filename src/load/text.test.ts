import { describe, expect, it } from "vitest";
import { loadChildren } from "../testing.js";
import { loadWire } from "./index.js";

describe("loadWire: Text", () => {
  it("loads as a box with no border", () => {
    const source = `
wireframe #home
    Text "Welcome"
`;

    expect(loadChildren(source)).toEqual([
      { type: "Box", text: "Welcome", border: "none" },
    ]);
  });

  it("can be nested inside a row", () => {
    const source = `
wireframe #home
    Row
        Text "A"
        Box "B"
`;

    expect(loadChildren(source)).toEqual([
      {
        type: "Row",
        children: [
          { type: "Box", text: "A", border: "none" },
          { type: "Box", text: "B" },
        ],
      },
    ]);
  });

  it("rejects unquoted text, reporting the line number", () => {
    const source = `
wireframe #home
    Text Welcome home
`;

    expect(() => loadWire(source)).toThrow(
      'Line 3: text must be quoted, e.g. Text "Welcome home"',
    );
  });

  it("rejects a text with no content", () => {
    const source = `
wireframe #home
    Text
`;

    expect(() => loadWire(source)).toThrow('Line 3: Text needs quoted text, e.g. Text "Hello"');
  });

  it("rejects children, which would otherwise be dropped", () => {
    const source = `
wireframe #home
    Text "Title"
        Box "Inner"
`;

    expect(() => loadWire(source)).toThrow("Line 3: Text cannot have children");
  });
});
