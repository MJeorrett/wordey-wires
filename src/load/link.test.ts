import { describe, expect, it } from "vitest";
import { loadChildren } from "../testing.js";
import { loadWire } from "./index.js";

describe("loadWire: to=#id links", () => {
  it("loads a box that links to a wireframe", () => {
    const source = `
wireframe #home
    Box "Organisations" to=#organisations
`;

    expect(loadChildren(source)).toEqual([
      { type: "Box", text: "Organisations", to: "organisations" },
    ]);
  });

  it("accepts the link before the text", () => {
    const source = `
wireframe #home
    Box to=#templated "Templated"
`;

    expect(loadChildren(source)).toEqual([{ type: "Box", text: "Templated", to: "templated" }]);
  });

  it("allows a link with no text, and ids containing hyphens", () => {
    const source = `
wireframe #home
    Box to=#create-organisation
`;

    expect(loadChildren(source)).toEqual([{ type: "Box", to: "create-organisation" }]);
  });

  it("allows Text to be a link, which stays borderless", () => {
    const source = `
wireframe #home
    Text "Back" to=#home
`;

    expect(loadChildren(source)).toEqual([
      { type: "Box", text: "Back", border: "none", to: "home" },
    ]);
  });

  it("allows a linked box to have children", () => {
    const source = `
wireframe #home
    Box to=#about
        Box "Inner"
`;

    expect(loadChildren(source)).toEqual([
      { type: "Box", to: "about", children: [{ type: "Box", text: "Inner" }] },
    ]);
  });

  it("works inside a template, including from the call's children", () => {
    const source = `
template Nav(label)
    Box "{label}" to=#home

wireframe #home
    Nav label="Go home"
`;

    expect(loadChildren(source)).toEqual([{ type: "Box", text: "Go home", to: "home" }]);
  });

  it("does not read to=#id inside quoted text as a link", () => {
    const source = `
wireframe #home
    Box "to=#home"
`;

    expect(loadChildren(source)).toEqual([{ type: "Box", text: "to=#home" }]);
  });

  it.each([
    ['Box "A" "B"', 'Line 3: Box has more than one quoted text'],
    ["Box to=#a to=#b", 'Line 3: property "to" given twice'],
    ['Box "A" colour=red', 'Line 3: Box has no property "colour"'],
    ['Text "A" colour=red', 'Line 3: Text has no property "colour"'],
    ['Box "A" extra', 'Line 3: unsupported syntax "Box "A" extra"'],
    ['Box "A"to=#b', 'Line 3: unsupported syntax "Box "A"to=#b"'],
    ["Box to=#home Another one", 'Line 3: text must be quoted, e.g. Box "Another one"'],
  ])("rejects bad arguments (%s)", (element, message) => {
    const source = `
wireframe #home
    ${element}
`;

    expect(() => loadWire(source)).toThrow(message);
  });

  it.each(["to=home", "to=#", "to=", "to=#a#b"])("rejects a malformed link (%s)", (link) => {
    const source = `
wireframe #home
    Box "Go" ${link}
`;

    expect(() => loadWire(source)).toThrow(
      "Line 3: to must point at a wireframe, e.g. to=#home",
    );
  });
});
