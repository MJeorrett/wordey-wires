import { describe, expect, it } from "vitest";
import { parseFields } from "./fields.js";

const HEADER = "label, placeholder, input, examples";

describe("parseFields", () => {
  it("reads a field per row, trimming whitespace and splitting examples on ;", () => {
    const csv = `${HEADER}
Name,  Enter a name , singleLineText,  Org 1; Org 2 ;Org 3
`;

    expect(parseFields(csv)).toEqual([
      {
        label: "Name",
        placeholder: "Enter a name",
        input: "singleLineText",
        examples: ["Org 1", "Org 2", "Org 3"],
      },
    ]);
  });

  it("treats n/a as no value for placeholder and input", () => {
    const csv = `${HEADER}
ID, n/a, n/a, 1;2;3
`;

    const [field] = parseFields(csv);

    expect(field).toEqual({ label: "ID", examples: ["1", "2", "3"] });
    expect(field).not.toHaveProperty("placeholder");
    expect(field).not.toHaveProperty("input");
  });

  it("returns no fields for a file with only a header", () => {
    expect(parseFields(`${HEADER}\n`)).toEqual([]);
  });

  it("rejects a wrong header", () => {
    expect(() => parseFields("label, input\nName, singleLineText\n")).toThrow(
      'Line 1: expected header "label, placeholder, input, examples", got "label, input"',
    );
  });

  it.each([
    ["wrong case", "Label, placeholder, input, examples"],
    ["wrong order", "label, input, placeholder, examples"],
    ["a misspelt column", "label, placeholder, input, example"],
    ["a missing column", "label, placeholder, input"],
    ["an extra column", "label, placeholder, input, examples, notes"],
  ])("rejects a header with %s", (_description, header) => {
    expect(() => parseFields(`${header}\nName, n/a, n/a, A\n`)).toThrow(
      `Line 1: expected header "label, placeholder, input, examples", got "${header}"`,
    );
  });

  it.each([
    ["an empty file", ""],
    ["a file with only blank lines", "\n  \n"],
  ])("rejects %s, which has no header", (_description, csv) => {
    expect(() => parseFields(csv)).toThrow(
      'Line 1: expected header "label, placeholder, input, examples", but the file is empty',
    );
  });

  it("rejects a row with the wrong number of columns, reporting the line number", () => {
    const csv = `${HEADER}
Name, n/a, singleLineText, A;B
Oops, only two
`;

    expect(() => parseFields(csv)).toThrow("Line 3: expected 4 columns, got 2");
  });
});
