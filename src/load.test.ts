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
});
