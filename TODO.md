# TODO

## Next steps (in suggested order)

### 1. Smoke-test the full stack
- [x] Run `pnpm dev`, open http://localhost:3000 and check: `/` redirects to `#home`, a page renders, editing `demo/*.wire` reloads the browser, a broken file shows the error page and recovers when fixed, an unknown path shows the 404 list.
- [x] Decide whether the server needs a test (a small integration test using a random port) or manual checks are enough. - manual checks for now

### 2. Loader: finish the primitives
Each item test-first.
- [x] `Row` with indented children (Boxes with indented children load too)
- [x] `Text "..."` loads as a Box with `border: "none"` (text required, no children)
- [x] Property `to=#id` on `Box`/`Text`; the quoted text and properties can come in any order
- [ ] Properties: `width=N`, `align=left|center|right` (add a case in `parseBoxArguments` in `src/load/nodes.ts`; `align` needs `Row` to use it too)
- [x] Shared rule for element syntax on `Box`/`Text`: after the element name, only one quoted string or `key=value` properties; unquoted text is an error. Still to do: apply it to `Row`, which today rejects anything after its name
- [x] Reject unknown properties on `Box`/`Text` (`Box has no property "colour"`); still to do for `Row`
- [ ] Validate values: `width` is 1-12, `align` is one of the three values
- [ ] `align` only valid on Row
- [ ] Validate `to=#id` points at a real wireframe (at folder level, since targets can be in other files)

### 3. Templates
- [x] `template Name(param, ...)` definitions, shared across all files in the folder (collected before wireframes load, so file order doesn't matter)
- [x] `{param}` substitution inside quoted strings
- [x] `{children}` special keyword: slot for the indented children of a call
- [x] Calls with string arguments (`Page title="Home"`) and indented children
- [x] Errors: unknown template, missing/unknown/duplicate params, unquoted arguments, children without a slot, `{children}` outside a template, braces outside templates, duplicate templates, built-in names
- [ ] Make the `Page` template from `example.wire` load (needs `width=` and `to=` from section 2)
- [ ] Templates calling other templates (deliberately not in v1: it's an error for now)

### 4. Field CSVs
- [x] Load `fields/<entity>.csv` (trim whitespace; columns `label, placeholder, input, examples`; `examples` separated by `;`). Files are read lazily, only when referenced; header and column count are validated
- [x] `<entity>` data references as props (`fields=<organisation>`); error if the file is missing. Done for template calls only; built-in `Form`/`Table` need the shared property parsing from section 2
- [x] `n/a` means "no value" for `placeholder` and `input`
- [x] Include `.csv` files in change detection (already watched; check the folder loader reads them)
- [x] Data parameters (`<entity>`) can't be used inside strings (`{fields}` is an error); only `Form`/`Table` will consume them

### 5. Built-in `Form`
- [x] Renders a labelled box plus placeholder box for each field; skips fields whose `input` is `n/a` (stacked: borderless label, then the input box, empty if the placeholder is `n/a`; every `input` is single-line until the vocabulary item below)
- [ ] `Form` inside a template: pass the data through (`Form fields={fields}`); today `fields=<entity>` must be written literally
- [ ] `input` vocabulary: `singleLineText`, `multiLineText`, `dropdown`; error on anything else
- [ ] Taller box for `multiLineText`, a dropdown indicator for `dropdown`
- [ ] Renders fields only (buttons are written explicitly in the wireframe)

### 6. Built-in `Table`
- [x] One column per field, header from `label`, data from `examples` (cycled)
- [ ] 10 rows by default (done, hardcoded), `rows=N` to override
- [ ] All columns default to width 3 and fill the available space

### 7. End to end
- [ ] `example.wire` loads and renders all three pages (`#home`, `#organisations`, `#create-organisation`) with working navigation
- [ ] Move `example.wire` and `fields/` into a sample project folder (and probably point `pnpm dev` at it)

### 8. Housekeeping
- [ ] `git init` and a first commit
- [ ] README: syntax reference, folder layout, `pnpm dev` / `pnpm test`
- [ ] Friendlier error page: show the file and line, keep the last good render visible
- [ ] Handle the port already being in use
- [ ] Remove or repurpose `hello.wire` (it deliberately contains an unquoted-text error)

## Done

- [x] Loader for `wireframe #id` with quoted `Box "text"` (errors report the line number)
- [x] Renderer: Box, Row, 12-column spans (default 3), `align`, links, escaping, formatted output
- [x] Folder loader: merges all `.wire` files, errors on duplicate ids, prefixes errors with the file name
- [x] Page shell, request handler (`/`, `/<id>`, 404, error page), `serve` CLI with `fs.watch` + SSE reload
- [x] `ideas.md` for parked ideas