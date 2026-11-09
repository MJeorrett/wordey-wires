import { describe, expect, it } from "vitest";
import { loadChildren } from "../testing.js";
import { loadWire } from "./index.js";

describe("loadWire: templates", () => {
  describe("expansion", () => {
    it("expands a call, substituting string parameters", () => {
      const source = `
template Page(title)
    Box "{title}"

wireframe #home
    Page title="Home"
`;

      expect(loadChildren(source)).toEqual([{ type: "Box", text: "Home" }]);
    });

    it("expands every node in the body, in order", () => {
      const source = `
template Page(title)
    Text "{title}"
    Row
        Box "Left"
        Box "{title} right"

wireframe #home
    Page title="Home"
`;

      expect(loadChildren(source)).toEqual([
        { type: "Box", text: "Home", border: "none" },
        {
          type: "Row",
          children: [
            { type: "Box", text: "Left" },
            { type: "Box", text: "Home right" },
          ],
        },
      ]);
    });

    it("substitutes several parameters, inside larger text", () => {
      const source = `
template Greeting(first, last)
    Box "Hello, {first} {last}!"

wireframe #home
    Greeting last="Lovelace" first="Ada"
`;

      expect(loadChildren(source)).toEqual([{ type: "Box", text: "Hello, Ada Lovelace!" }]);
    });

    it("expands a template with no parameters", () => {
      const source = `
template Footer()
    Box "Footer"

wireframe #home
    Footer
`;

      expect(loadChildren(source)).toEqual([{ type: "Box", text: "Footer" }]);
    });

    it("can be used many times, alongside other nodes", () => {
      const source = `
template Tag(label)
    Box "[{label}]"

wireframe #home
    Box "Before"
    Tag label="A"
    Tag label="B"
`;

      expect(loadChildren(source)).toEqual([
        { type: "Box", text: "Before" },
        { type: "Box", text: "[A]" },
        { type: "Box", text: "[B]" },
      ]);
    });

    it("can be called inside rows and boxes", () => {
      const source = `
template Tag(label)
    Box "[{label}]"

wireframe #home
    Row
        Box
            Tag label="A"
`;

      expect(loadChildren(source)).toEqual([
        {
          type: "Row",
          children: [{ type: "Box", children: [{ type: "Box", text: "[A]" }] }],
        },
      ]);
    });

    it("can be defined after it is used", () => {
      const source = `
wireframe #home
    Tag label="A"

template Tag(label)
    Box "[{label}]"
`;

      expect(loadChildren(source)).toEqual([{ type: "Box", text: "[A]" }]);
    });

    it("does not produce wireframes for template definitions", () => {
      const source = `
template Tag(label)
    Box "[{label}]"

wireframe #home
    Tag label="A"
`;

      expect(loadWire(source).wireframes.map((w) => w.id)).toEqual(["home"]);
    });
  });

  describe("{children}", () => {
    const panel = `
template Panel(title)
    Box "{title}"
    Box
        {children}

template Tag(label)
    Box "[{label}]"
`;

    it("is replaced by the indented children of the call", () => {
      const source = `${panel}
wireframe #home
    Panel title="Settings"
        Box "One"
        Box "Two"
`;

      expect(loadChildren(source)).toEqual([
        { type: "Box", text: "Settings" },
        {
          type: "Box",
          children: [
            { type: "Box", text: "One" },
            { type: "Box", text: "Two" },
          ],
        },
      ]);
    });

    it("is empty when the call has no children", () => {
      const source = `${panel}
wireframe #home
    Panel title="Empty"
`;

      expect(loadChildren(source)).toEqual([
        { type: "Box", text: "Empty" },
        { type: "Box", children: [] },
      ]);
    });

    it("can sit at the top level of the body, between other nodes", () => {
      const source = `
template Wrap()
    Box "top"
    {children}
    Box "bottom"

wireframe #home
    Wrap
        Box "A"
        Box "B"
`;

      expect(loadChildren(source)).toEqual([
        { type: "Box", text: "top" },
        { type: "Box", text: "A" },
        { type: "Box", text: "B" },
        { type: "Box", text: "bottom" },
      ]);
    });

    it("can contain calls to other templates, as they are written by the caller", () => {
      const source = `${panel}
wireframe #home
    Panel title="Outer"
        Tag label="Inner"
`;

      expect(loadChildren(source)).toEqual([
        { type: "Box", text: "Outer" },
        { type: "Box", children: [{ type: "Box", text: "[Inner]" }] },
      ]);
    });
  });

  describe("errors", () => {
    it("rejects a call with a missing parameter", () => {
      const source = `
template Page(title)
    Box "{title}"

wireframe #home
    Page
`;

      expect(() => loadWire(source)).toThrow('Line 6: Page is missing parameter "title"');
    });

    it("rejects a call with an unknown parameter", () => {
      const source = `
template Page(title)
    Box "{title}"

wireframe #home
    Page title="Home" subtitle="Hi"
`;

      expect(() => loadWire(source)).toThrow('Line 6: Page has no parameter "subtitle"');
    });

    it("rejects a parameter given twice", () => {
      const source = `
template Page(title)
    Box "{title}"

wireframe #home
    Page title="A" title="B"
`;

      expect(() => loadWire(source)).toThrow('Line 6: parameter "title" given twice');
    });

    it("rejects unquoted parameter values", () => {
      const source = `
template Page(title)
    Box "{title}"

wireframe #home
    Page title=Home
`;

      expect(() => loadWire(source)).toThrow(
        'Line 6: arguments must be written key="value", got "title=Home"',
      );
    });

    it("rejects an unknown element or template", () => {
      const source = `
wireframe #home
    Pge title="Home"
`;

      expect(() => loadWire(source)).toThrow('Line 3: unknown element or template "Pge"');
    });

    it("rejects children on a call when the template has no {children}", () => {
      const source = `
template Tag(label)
    Box "[{label}]"

wireframe #home
    Tag label="A"
        Box "Dropped"
`;

      expect(() => loadWire(source)).toThrow(
        "Line 6: Tag does not accept children (its body has no {children})",
      );
    });

    it("rejects {children} outside a template", () => {
      const source = `
wireframe #home
    {children}
`;

      expect(() => loadWire(source)).toThrow(
        "Line 3: {children} can only be used inside a template",
      );
    });

    it("rejects braces in text outside a template", () => {
      const source = `
wireframe #home
    Box "Hello {name}"
`;

      expect(() => loadWire(source)).toThrow(
        "Line 3: braces are reserved for template parameters, found {name}",
      );
    });

    it("rejects a parameter in the body that the template does not declare", () => {
      const source = `
template Page(title)
    Box "{titel}"

wireframe #home
    Page title="Home"
`;

      expect(() => loadWire(source)).toThrow("Line 3: unknown parameter {titel} in template Page");
    });

    it("rejects {children} written inside text", () => {
      const source = `
template Page()
    Box "see {children}"

wireframe #home
    Page
`;

      expect(() => loadWire(source)).toThrow("Line 3: {children} must be on its own line");
    });

    it("rejects a template calling another template, for now", () => {
      const source = `
template Tag(label)
    Box "[{label}]"

template Page(title)
    Tag label="{title}"

wireframe #home
    Page title="Home"
`;

      expect(() => loadWire(source)).toThrow(
        "Line 6: templates cannot call other templates yet (in template Page, used at line 9)",
      );
    });

    it("says which template and call a body error came from", () => {
      const source = `
template Page(title)
    Box Unquoted

wireframe #home
    Page title="Home"
`;

      expect(() => loadWire(source)).toThrow(
        'Line 3: text must be quoted, e.g. Box "Unquoted" (in template Page, used at line 6)',
      );
    });

    it("rejects a malformed template header", () => {
      const source = `
template Page
    Box "x"
`;

      expect(() => loadWire(source)).toThrow(
        'Line 2: expected "template Name(param, ...)", got "template Page"',
      );
    });

    it("rejects a template named like a built-in element", () => {
      const source = `
template Box(title)
    Box "{title}"
`;

      expect(() => loadWire(source)).toThrow(
        'Line 2: template name "Box" clashes with a built-in element',
      );
    });

    it("rejects duplicate parameter names", () => {
      const source = `
template Page(title, title)
    Box "{title}"
`;

      expect(() => loadWire(source)).toThrow('Line 2: duplicate parameter "title"');
    });

    it("rejects children as a parameter name", () => {
      const source = `
template Page(children)
    Box "x"
`;

      expect(() => loadWire(source)).toThrow(
        'Line 2: "children" is reserved and cannot be a parameter name',
      );
    });

    it("rejects defining the same template twice", () => {
      const source = `
template Page(title)
    Box "{title}"

template Page(title)
    Box "again"
`;

      expect(() => loadWire(source)).toThrow(
        'Line 5: Duplicate template Page (already defined at line 2)',
      );
    });
  });
});
