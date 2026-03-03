import type TSParser from "tree-sitter";

import { Capture } from "@/models";

import { capture } from "./capture";
import { getMatches, getNode, groupMatches } from "./utils";

function getClasses(
  node: TSParser.SyntaxNode,
  query: TSParser.Query,
  parentId: string,
): Capture.Class[] {
  const matches = getMatches(query, node);

  return groupMatches("class", matches).map((match) => {
    const get = (name: string) => getNode(name, match);

    const name = get("name")?.text;
    const id = `${parentId}:class:${name}`;
    const heritage = get("heritage");

    return {
      id,
      node: get("class")!,
      body: capture(get("body")!, query, id),
      name,

      type_params: get("type_params")?.namedChildren.map((c) => c.text) ?? [],
      implements:
        heritage?.namedChildren
          ?.find((f) => f.type === "implements_clause")
          ?.namedChildren.map((c) => c.text) ?? [],
      extends:
        heritage?.namedChildren
          ?.find((f) => f.type === "extends_clause")
          ?.namedChildren.map((c) => c.text) ?? [],
    } satisfies Capture.Class;
  });
}

export { getClasses };
