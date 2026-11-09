# Ideas

Things we've noticed but deliberately parked.

## Nested Rows

A `Row` inside a `Row` currently gets no grid span and doesn't count toward the
parent's `align` total (see `renderRow` in `src/render.ts`). It's untested, so
decide on a rule if it comes up (probably: span 12, or an explicit `width`).
