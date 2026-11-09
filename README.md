# wordey-wires

Text-driven wireframes. Describe screens in a small indentation-based language and
get clickable, low-fidelity wireframes in the browser, with hot reload as you edit.

The aim is convention over configuration: only boxes and text, sensible layout
defaults, and mock data that comes from CSV files rather than from the markup.

> **Status:** early. The core pipeline works end to end (load, render, serve, hot
> reload), but the language is still small. See [TODO.md](TODO.md) for what's next
> and [ideas.md](ideas.md) for parked ideas. [example.wire](example.wire) shows
> the syntax we're building towards and does not load yet.

## Quick start

Requires Node and [pnpm](https://pnpm.io).

```
pnpm install
pnpm dev
```

Then open http://localhost:3000. `pnpm dev` builds and serves the `demo/` folder,
with `#home` as the start page. Edit any `.wire` or `.csv` file in the folder and the
browser reloads. Load errors show on the page with the file name and line number.

## The language (what works today)

A folder of `.wire` files. Each file defines wireframes; indentation shows nesting
and all text is quoted.

```
wireframe #home
    Text "Welcome"
    Box "A box with text"
    Row
        Box "Left"
        Box "Right"
```

| Element | Meaning |
| --- | --- |
| `wireframe #id` | A page, served at `/<id>`. Ids must be unique across the folder. |
| `Box "text"` | A bordered, full-width box. Boxes can contain other boxes. |
| `Text "text"` | Like a Box, without the border. |
| `Row` | Lays its children out side by side. Children share the row in proportion to their `width` (default 3). |

Not yet in the loader (the renderer already supports `width` and `align`): `width=`,
`to=#id` links between wireframes, `align=`, templates, field CSVs, and the built-in
`Form` and `Table`.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Build, then serve `demo/` on port 3000 with hot reload |
| `pnpm test` | Run the tests (`pnpm test:watch` to watch) |
| `pnpm typecheck` | Type-check without emitting |
| `pnpm build` | Compile `src/` to `dist/` |
| `node dist/cli.js <file.wire>` | Print the loaded JSON for one file |
| `node dist/cli.js serve <folder> --home <id> [--port N]` | Serve any folder of wireframes |

## How it works

```
.wire files ──load──▶ JSON tree of Box/Row nodes ──render──▶ HTML ──serve──▶ browser
```

- `src/load/` parses a `.wire` file into a JSON-serialisable document of primitive nodes.
- `src/loadFolder.ts` merges every `.wire` file under a folder.
- `src/render.ts` turns a wireframe into formatted HTML (12-column grid, sketch-style CSS in `src/page.ts`).
- `src/handler.ts` and `src/server.ts` map URLs to pages and push reloads over server-sent events when files change.

The project is built test-first: each loader and renderer behaviour has a test in
`src/**/*.test.ts`.
