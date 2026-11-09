import { describe, expect, it } from "vitest";
import { renderWireframe } from "./render.js";
import { html } from "./testing.js";
import type { WireNode } from "./types.js";

function render(...children: WireNode[]): string {
  return renderWireframe({ id: "test", children });
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

    it("splits the row between children in proportion to their widths", () => {
      expect(
        render({
          type: "Row",
          children: [
            { type: "Box", text: "A", width: 3 },
            { type: "Box", text: "B", width: 9 },
          ],
        }),
      ).toBe(html`
        <div class="row" style="grid-template-columns: minmax(0, 3fr) minmax(0, 9fr)">
          <div class="box">A</div>
          <div class="box">B</div>
        </div>
      `);
    });

    it("splits proportionally even when the widths do not add up to 12", () => {
      expect(
        render({
          type: "Row",
          children: [
            { type: "Box", text: "A", width: 2 },
            { type: "Box", text: "B", width: 3 },
          ],
        }),
      ).toBe(html`
        <div class="row" style="grid-template-columns: minmax(0, 2fr) minmax(0, 3fr)">
          <div class="box">A</div>
          <div class="box">B</div>
        </div>
      `);
    });

    it("gives children without a width equal shares of the row", () => {
      expect(
        render({
          type: "Row",
          children: [
            { type: "Box", text: "A" },
            { type: "Box", text: "B" },
          ],
        }),
      ).toBe(html`
        <div class="row" style="grid-template-columns: minmax(0, 3fr) minmax(0, 3fr)">
          <div class="box">A</div>
          <div class="box">B</div>
        </div>
      `);
    });

    it("lets a single child fill the whole row", () => {
      expect(render({ type: "Row", children: [{ type: "Box", text: "A" }] })).toBe(html`
        <div class="row" style="grid-template-columns: minmax(0, 3fr)">
          <div class="box">A</div>
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
        <div class="row" style="grid-template-columns: minmax(0, 2fr)">
          <a class="box" href="/create">Create</a>
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
        <div class="row" style="grid-template-columns: minmax(0, 3fr)">
          <div class="box">
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
