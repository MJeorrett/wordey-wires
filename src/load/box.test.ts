import { describe, expect, it } from "vitest";
import { loadWire } from "./index.js";

describe("loadWire: Box", () => {
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
