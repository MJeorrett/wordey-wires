import { describe, expect, it } from "vitest";
import { loadWire } from "./load.js";

describe("loadWire", () => {
  it("loads a wireframe containing a single box", () => {
    const source = `
wireframe #home
    Box "Hello, World"
`;

    expect(loadWire(source)).toEqual({
      wireframes: [
        {
          id: "home",
          children: [{ type: "Box", text: "Hello, World" }],
        },
      ],
    });
  });

  it("rejects unquoted text, reporting the line number", () => {
    const source = `
wireframe #home
    Box "Hello, World"
    Box Another one
`;

    expect(() => loadWire(source)).toThrow(
      'Line 4: text must be quoted, e.g. Box "Another one"',
    );
  });

  describe("Row", () => {
    it("loads a row with its indented children", () => {
      const source = `
wireframe #home
    Row
        Box "A"
        Box "B"
`;

      expect(loadWire(source).wireframes[0]!.children).toEqual([
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

      expect(loadWire(source).wireframes[0]!.children).toEqual([
        { type: "Row", children: [] },
      ]);
    });

    it("loads boxes nested inside a box inside a row", () => {
      const source = `
wireframe #home
    Row
        Box
            Box "Inner"
`;

      expect(loadWire(source).wireframes[0]!.children).toEqual([
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
});
