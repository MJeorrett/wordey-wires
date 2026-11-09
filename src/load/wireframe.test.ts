import { describe, expect, it } from "vitest";
import { loadWire } from "./index.js";

describe("loadWire: wireframes", () => {
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
});
