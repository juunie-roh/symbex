/**
 * Strips comments and normalizes whitespace from a tree-sitter query string.
 * Removes `;;` and `;` line comments, then collapses surrounding whitespace.
 */
function normalize(query: string): string {
  return query
    .split("\n")
    .map((line) => line.replace(/;.*$/, "").trimEnd())
    .filter((line) => line.trim().length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export { normalize };
