import type TSParser from "tree-sitter";

import { Capture } from "./models";

function capture<T extends Capture.Base>(
  node: TSParser.SyntaxNode,
  query: TSParser.Query,
): T[] {
  const result: T[] = [];
  query.matches(node).forEach((match) => {
    console.log(match);
  });
  return result;
}

export { capture };
