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

  it("prefixes load errors with the file name", () => {
    write("pages/bad.wire", "wireframe #home\n    Box Unquoted\n");

    expect(() => loadWireFolder(dir)).toThrow(
      'pages/bad.wire: Line 2: text must be quoted, e.g. Box "Unquoted"',
    );
  });
});
