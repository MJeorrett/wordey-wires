import { describe, expect, it } from "vitest";
import { renderPage } from "./page.js";

describe("renderPage", () => {
  it("wraps the body in a full html document with styles and the reload script", () => {
    const html = renderPage({ title: "home", body: '<div class="box">Hi</div>' });

    expect(html).toMatch(/^<!doctype html>/i);
    expect(html).toContain("<title>home</title>");
    expect(html).toContain('<body><div class="box">Hi</div>');
    expect(html).toContain("<style>");
    expect(html).toContain("/__reload");
  });

  it("escapes the title", () => {
    expect(renderPage({ title: "<script>", body: "" })).toContain(
      "<title>&lt;script&gt;</title>",
    );
  });
});
