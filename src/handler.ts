import { escapeHtml } from "./escape.js";
import { renderPage } from "./page.js";
import { renderWireframe } from "./render.js";
import type { WireDocument } from "./types.js";

export interface HandlerContext {
  /** Loads the current document. Called on every request so edits show up immediately. */
  load: () => WireDocument;
  /** Id of the wireframe `/` redirects to. */
  home: string;
}

export interface HandlerResponse {
  status: number;
  html?: string;
  location?: string;
}

/** Maps a request path to a response. Pure apart from calling `context.load`. */
export function handleRequest(url: string, context: HandlerContext): HandlerResponse {
  const path = url.split("?")[0] ?? "/";

  let document: WireDocument;
  try {
    document = context.load();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: 500,
      html: renderPage({
        title: "Error",
        body: `<h2>Could not load wireframes</h2><pre class="error">${escapeHtml(message)}</pre>`,
      }),
    };
  }

  const id = path === "/" ? context.home : path.slice(1);

  if (path === "/" && document.wireframes.some((w) => w.id === id)) {
    return { status: 302, location: `/${id}` };
  }

  const wireframe = document.wireframes.find((w) => w.id === id);
  if (!wireframe) {
    return { status: 404, html: renderNotFound(id, document) };
  }

  return {
    status: 200,
    html: renderPage({ title: wireframe.id, body: renderWireframe(wireframe) }),
  };
}

function renderNotFound(id: string, document: WireDocument): string {
  const links = document.wireframes
    .map((w) => `<a href="/${escapeHtml(w.id)}">#${escapeHtml(w.id)}</a>`)
    .join("");

  return renderPage({
    title: "Not found",
    body:
      `<h2>No wireframe #${escapeHtml(id)}</h2>` +
      `<div class="wireframes">${links || "<p>No wireframes found.</p>"}</div>`,
  });
}
