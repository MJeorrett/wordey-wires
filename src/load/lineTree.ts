export interface Line {
  /** 1-based line number in the source, for error messages. */
  number: number;
  indent: number;
  content: string;
  children: Line[];
}

/** Groups non-blank lines into a tree based on indentation. */
export function parseLineTree(source: string): Line[] {
  const roots: Line[] = [];
  const stack: Line[] = [];

  source.split(/\r?\n/).forEach((raw, index) => {
    if (raw.trim() === "") return;

    const indent = raw.length - raw.trimStart().length;
    const line: Line = {
      number: index + 1,
      indent,
      content: raw.trim(),
      children: [],
    };

    while (stack.length > 0 && stack[stack.length - 1]!.indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    if (parent) {
      parent.children.push(line);
    } else {
      roots.push(line);
    }
    stack.push(line);
  });

  return roots;
}
