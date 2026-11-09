import { describe, expect, it } from "vitest";
import { loadChildren } from "../testing.js";
import { loadWire } from "./index.js";

describe("loadWire: Row", () => {
  it("loads a row with its indented children", () => {
    const source = `
wireframe #home
    Row
        Box "A"
        Box "B"
`;

    expect(loadChildren(source)).toEqual([
      {
        type: "Row",
        children: [
          { type: "Box", text: "A" },
          { type: "Box", text: "B" },
        ],
      },
    ]);
  });

  it("loads a row with no children", () => {
    const source = `
wireframe #home
    Row
`;

    expect(loadChildren(source)).toEqual([{ type: "Row", children: [] }]);
  });

  it("loads boxes nested inside a box inside a row", () => {
    const source = `
wireframe #home
    Row
        Box
            Box "Inner"
`;

    expect(loadChildren(source)).toEqual([
      {
        type: "Row",
        children: [{ type: "Box", children: [{ type: "Box", text: "Inner" }] }],
      },
    ]);
  });

  it("rejects text on a row, reporting the line number", () => {
    const source = `
wireframe #home
    Row "Not allowed"
`;

    expect(() => loadWire(source)).toThrow('Line 3: unsupported syntax "Row "Not allowed""');
  });
});
