import { describe, expect, it } from "vitest";
import { renderWireframe } from "./render.js";
import type { WireNode } from "./types.js";

function render(...children: WireNode[]): string {
  return renderWireframe({ id: "test", children });
}

/**
 * Lets expectations be written as indented multi-line blocks: drops the blank
 * first/last lines and the indentation shared by every line.
 */
function html(strings: TemplateStringsArray): string {
  const lines = strings.raw[0]!.split("\n");
  if (lines[0]!.trim() === "") lines.shift();
  if (lines[lines.length - 1]!.trim() === "") lines.pop();

  const indent = Math.min(
    ...lines.filter((line) => line.trim() !== "").map((line) => line.length - line.trimStart().length),
  );
  return lines.map((line) => line.slice(indent)).join("\n");
}

describe("renderWireframe", () => {
  describe("Box", () => {
    it("renders a box with text as a div", () => {
      const output = renderWireframe({
        id: "home",
        children: [{ type: "Box", text: "Hello, World" }],
      });

      expect(output).toBe(html`
        <div class="box">Hello, World</div>
      `);
    });

    it("escapes html in text", () => {
      expect(render({ type: "Box", text: `<b>"Tom" & 'Jerry'</b>` })).toBe(html`
        <div class="box">&lt;b&gt;&quot;Tom&quot; &amp; &#39;Jerry&#39;&lt;/b&gt;</div>
      `);
    });

    it("renders a box with border none as borderless", () => {
      expect(render({ type: "Box", text: "Title", border: "none" })).toBe(html`
        <div class="box borderless">Title</div>
      `);
    });

    it("renders nested boxes", () => {
      expect(
        render({
          type: "Box",
          children: [
            { type: "Box", text: "A" },
            { type: "Box", text: "B" },
          ],
        }),
      ).toBe(html`
        <div class="box">
          <div class="box">A</div>
          <div class="box">B</div>
        </div>
      `);
    });

    it("renders a box's text before its children", () => {
      expect(
        render({
          type: "Box",
          text: "Title",
          children: [{ type: "Box", text: "A" }],
        }),
      ).toBe(html`
        <div class="box">
          Title
          <div class="box">A</div>
        </div>
      `);
    });

    it("renders a box with a link as an anchor to the wireframe path", () => {
      expect(render({ type: "Box", text: "Home", to: "home" })).toBe(html`
        <a class="box" href="/home">Home</a>
      `);
    });
  });

  describe("Row", () => {
    it("renders an empty row", () => {
      expect(render({ type: "Row", children: [] })).toBe(html`
        <div class="row"></div>
      `);
    });

    it("renders boxes with their column widths as grid spans", () => {
      expect(
        render({
          type: "Row",
          children: [
            { type: "Box", text: "A", width: 3 },
            { type: "Box", text: "B", width: 9 },
          ],
        }),
      ).toBe(html`
        <div class="row">
          <div class="box" style="grid-column: span 3">A</div>
          <div class="box" style="grid-column: span 9">B</div>
        </div>
      `);
    });

    it("gives boxes without a width a default span of 3", () => {
      expect(render({ type: "Row", children: [{ type: "Box", text: "A" }] })).toBe(html`
        <div class="row">
          <div class="box" style="grid-column: span 3">A</div>
        </div>
      `);
    });

    it("aligns children to the right by starting the first child so they end at column 12", () => {
      expect(
        render({
          type: "Row",
          align: "right",
          children: [
            { type: "Box", text: "A" },
            { type: "Box", text: "B" },
          ],
        }),
      ).toBe(html`
        <div class="row">
          <div class="box" style="grid-column: 7 / span 3">A</div>
          <div class="box" style="grid-column: span 3">B</div>
        </div>
      `);
    });

    it("aligns children to the centre", () => {
      expect(
        render({
          type: "Row",
          align: "center",
          children: [{ type: "Box", text: "A" }],
        }),
      ).toBe(html`
        <div class="row">
          <div class="box" style="grid-column: 5 / span 3">A</div>
        </div>
      `);
    });

    it("leaves left-aligned children at the start", () => {
      expect(
        render({
          type: "Row",
          align: "left",
          children: [{ type: "Box", text: "A" }],
        }),
      ).toBe(html`
        <div class="row">
          <div class="box" style="grid-column: span 3">A</div>
        </div>
      `);
    });

    it("keeps links on boxes inside rows", () => {
      expect(
        render({
          type: "Row",
          children: [{ type: "Box", text: "Create", to: "create", width: 2 }],
        }),
      ).toBe(html`
        <div class="row">
          <a class="box" href="/create" style="grid-column: span 2">Create</a>
        </div>
      `);
    });

    it("indents boxes nested inside a box inside a row", () => {
      expect(
        render({
          type: "Row",
          children: [
            {
              type: "Box",
              width: 3,
              children: [{ type: "Box", text: "Home", to: "home" }],
            },
          ],
        }),
      ).toBe(html`
        <div class="row">
          <div class="box" style="grid-column: span 3">
            <a class="box" href="/home">Home</a>
          </div>
        </div>
      `);
    });
  });

  it("renders multiple top-level nodes in order, one per line", () => {
    expect(render({ type: "Box", text: "A" }, { type: "Box", text: "B" })).toBe(html`
      <div class="box">A</div>
      <div class="box">B</div>
    `);
  });
});
