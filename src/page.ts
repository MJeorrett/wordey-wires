import { escapeHtml } from "./escape.js";

/** Path the browser connects to for live-reload events (served by the dev server). */
export const RELOAD_PATH = "/__reload";

const STYLES = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 16px;
    font-family: "Segoe Print", "Comic Sans MS", "Bradley Hand", cursive;
    color: #222;
    background: #fafafa;
  }
  .box {
    display: block;
    margin: 4px 0;
    padding: 10px 12px;
    border: 2px solid #333;
    border-radius: 255px 12px 225px 12px / 12px 225px 12px 255px;
    background: #fff;
    color: inherit;
    text-decoration: none;
  }
  .box.borderless { border-color: transparent; background: transparent; }
  a.box:hover { background: #eef3ff; }
  .row {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 8px;
    align-items: start;
  }
  .row > .box { margin: 4px 0; }
  .error { white-space: pre-wrap; color: #b00020; }
  .wireframes a { display: block; margin: 4px 0; }
`;

const RELOAD_SCRIPT = `
  new EventSource("${RELOAD_PATH}").onmessage = () => location.reload();
`;

export function renderPage(options: { title: string; body: string }): string {
  return (
    "<!doctype html>" +
    `<html><head><meta charset="utf-8"><title>${escapeHtml(options.title)}</title>` +
    `<style>${STYLES}</style></head>` +
    `<body>${options.body}<script>${RELOAD_SCRIPT}</script></body></html>`
  );
}
