import type TSParser from "tree-sitter";

import { Capture } from "@/models";

import { getMatches, getNode, groupMatches } from "./utils";

function parseType(node?: TSParser.SyntaxNode): Capture.Import["type"] {
  if (!node || !node.parent) return;

  switch (node.parent.type) {
    case "import_clause":
      return "default";
    case "import_specifier":
      return "named_imports";
    case "namespace_import":
      return "namespace_import";
    default:
      return undefined;
  }
}

function getImports(
  node: TSParser.SyntaxNode,
  query: TSParser.Query,
  parentId: string,
): Capture.Import[] {
  const matches = getMatches(query, node);

  return groupMatches("import", matches).map((match) => {
    const get = (name: string) => getNode(name, match);

    return {
      id: parentId,
      node: get("import")!,
      name: get("name")?.text,
      alias: get("alias")?.text,
      type: parseType(get("name")),
      source: get("source")!.text,
    } satisfies Capture.Import;
  });
}

export { getImports };
