import { describe, expect, it } from "vitest";
import { handleRequest } from "./handler.js";
import type { WireDocument } from "./types.js";

const document: WireDocument = {
  wireframes: [
    { id: "home", children: [{ type: "Box", text: "Welcome home" }] },
    { id: "about", children: [{ type: "Box", text: "About us" }] },
  ],
};

const context = { load: () => document, home: "home" };

describe("handleRequest", () => {
  it("redirects / to the home wireframe", () => {
    expect(handleRequest("/", context)).toEqual({ status: 302, location: "/home" });
  });

  it("renders a wireframe at /<id> as a full page", () => {
    const response = handleRequest("/about", context);

    expect(response.status).toBe(200);
    expect(response.html).toContain('<div class="box">About us</div>');
    expect(response.html).toContain("<title>about</title>");
    expect(response.html).not.toContain("Welcome home");
  });

  it("ignores the query string", () => {
    expect(handleRequest("/home?x=1", context).status).toBe(200);
  });

  it("returns 404 for an unknown wireframe, listing the available ones", () => {
    const response = handleRequest("/missing", context);

    expect(response.status).toBe(404);
    expect(response.html).toContain("#missing");
    expect(response.html).toContain('<a href="/home">#home</a>');
    expect(response.html).toContain('<a href="/about">#about</a>');
  });

  it("returns 404 from / when the home wireframe does not exist", () => {
    const response = handleRequest("/", { ...context, home: "nope" });

    expect(response.status).toBe(404);
    expect(response.html).toContain("#nope");
  });

  it("shows load errors on a page that can still hot reload", () => {
    const response = handleRequest("/home", {
      ...context,
      load: () => {
        throw new Error('bad.wire: Line 2: text must be quoted, e.g. Box "x"');
      },
    });

    expect(response.status).toBe(500);
    expect(response.html).toContain("bad.wire: Line 2: text must be quoted, e.g. Box &quot;x&quot;");
    expect(response.html).toContain("/__reload");
  });
});
