import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { loadWireFolder } from "./loadFolder.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "wire-"));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

function write(relativePath: string, content: string) {
  const full = join(dir, relativePath);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content);
}

describe("loadWireFolder", () => {
  it("returns no wireframes for an empty folder", () => {
    expect(loadWireFolder(dir)).toEqual({ wireframes: [] });
  });

  it("merges wireframes from all .wire files, in file name order", () => {
    write("b.wire", 'wireframe #second\n    Box "Two"\n');
    write("a.wire", 'wireframe #first\n    Box "One"\n');

    expect(loadWireFolder(dir).wireframes.map((w) => w.id)).toEqual(["first", "second"]);
  });

  it("includes .wire files in subfolders and ignores other files", () => {
    write("pages/home.wire", 'wireframe #home\n    Box "Home"\n');
    write("fields/organisation.csv", "label, input\nName, singleLineText\n");
    write("notes.txt", "not a wireframe");

    expect(loadWireFolder(dir).wireframes.map((w) => w.id)).toEqual(["home"]);
  });

  it("rejects duplicate wireframe ids, naming both files", () => {
    write("a.wire", 'wireframe #home\n    Box "A"\n');
    write("b.wire", 'wireframe #home\n    Box "B"\n');

    expect(() => loadWireFolder(dir)).toThrow(
      'Duplicate wireframe #home in b.wire (already defined in a.wire)',
    );
  });

  it("lets wireframes use templates defined in other files, whatever the file order", () => {
    write("a-pages.wire", 'wireframe #home\n    Page title="Home"\n');
    write("z-layout.wire", 'template Page(title)\n    Box "{title}"\n');

    expect(loadWireFolder(dir).wireframes).toEqual([
      { id: "home", children: [{ type: "Box", text: "Home" }] },
    ]);
  });

  it("rejects the same template defined in two files, naming both", () => {
    write("a.wire", 'template Page(title)\n    Box "{title}"\n');
    write("b.wire", 'template Page(title)\n    Box "{title}"\n');

    expect(() => loadWireFolder(dir)).toThrow(
      "b.wire: Line 1: Duplicate template Page (already defined in a.wire, line 1)",
    );
  });

  it("lets template calls reference fields/<entity>.csv", () => {
    write("fields/organisation.csv", "label, placeholder, input, examples\nName, n/a, n/a, A;B\n");
    write(
      "a.wire",
      'template List(fields)\n    Box "List"\n\nwireframe #home\n    List fields=<organisation>\n',
    );

    expect(loadWireFolder(dir).wireframes).toEqual([
      { id: "home", children: [{ type: "Box", text: "List" }] },
    ]);
  });

  it("rejects a reference to a CSV file that does not exist", () => {
    write(
      "a.wire",
      'template List(fields)\n    Box "List"\n\nwireframe #home\n    List fields=<organisation>\n',
    );

    expect(() => loadWireFolder(dir)).toThrow(
      "a.wire: Line 5: unknown data <organisation> (expected fields/organisation.csv)",
    );
  });

  it("reports a problem in a referenced CSV file, naming the file", () => {
    write("fields/organisation.csv", "label, input\nName, singleLineText\n");
    write(
      "a.wire",
      'template List(fields)\n    Box "List"\n\nwireframe #home\n    List fields=<organisation>\n',
    );

    expect(() => loadWireFolder(dir)).toThrow(
      'fields/organisation.csv: Line 1: expected header "label, placeholder, input, examples", got "label, input"',
    );
  });

  it("prefixes load errors with the file name", () => {
    write("pages/bad.wire", "wireframe #home\n    Box Unquoted\n");

    expect(() => loadWireFolder(dir)).toThrow(
      'pages/bad.wire: Line 2: text must be quoted, e.g. Box "Unquoted"',
    );
  });
});
