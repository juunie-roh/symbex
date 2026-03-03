import type TSParser from "tree-sitter";

import { Capture } from "@/models";

import { getClasses } from "./class";
import { getFunctions } from "./function";
import { getImports } from "./import";

function capture(
  node: TSParser.SyntaxNode,
  query: TSParser.Query,
  parentId: string,
): Capture.Result {
  return {
    imports: getImports(node, query, parentId),
    functions: getFunctions(node, query, parentId),
    classes: getClasses(node, query, parentId),
  };
}

export { capture };
