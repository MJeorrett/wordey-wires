export interface Field {
  label: string;
  /** Absent when the CSV says `n/a`. */
  placeholder?: string;
  /** Absent when the CSV says `n/a`. */
  input?: string;
  examples: string[];
}

/** Looks up the fields of an entity (`fields/<entity>.csv`). A `Map` works. */
export interface FieldRegistry {
  get(entity: string): Field[] | undefined;
}

const NO_VALUE = "n/a";
const HEADER = ["label", "placeholder", "input", "examples"];

/** Reads the contents of a `fields/<entity>.csv` file. Errors report the line number. */
export function parseFields(csv: string): Field[] {
  const rows = csv
    .split(/\r?\n/)
    .map((text, index) => ({ number: index + 1, cells: text.split(",").map((cell) => cell.trim()), text }))
    .filter((row) => row.text.trim() !== "");

  const [header, ...body] = rows;
  if (!header) {
    throw new Error(`Line 1: expected header "${HEADER.join(", ")}", but the file is empty`);
  }
  if (header.cells.join(", ") !== HEADER.join(", ")) {
    throw new Error(
      `Line ${header.number}: expected header "${HEADER.join(", ")}", got "${header.cells.join(", ")}"`,
    );
  }

  return body.map((row) => {
    if (row.cells.length !== HEADER.length) {
      throw new Error(`Line ${row.number}: expected ${HEADER.length} columns, got ${row.cells.length}`);
    }

    const [label, placeholder, input, examples] = row.cells as [string, string, string, string];
    const field: Field = {
      label,
      examples: examples.split(";").map((example) => example.trim()),
    };
    if (placeholder !== NO_VALUE) field.placeholder = placeholder;
    if (input !== NO_VALUE) field.input = input;
    return field;
  });
}
