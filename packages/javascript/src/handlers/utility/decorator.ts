import TSParser from "tree-sitter";

/**
 * Walk through all sibling nodes of given decorator node and return them all in sequential ordered array.
 * @param node The last decorator node captured.
 */
export function getDecorators(
  node: TSParser.SyntaxNode,
): TSParser.SyntaxNode[] {
  const result: TSParser.SyntaxNode[] = [];
  let n: TSParser.SyntaxNode | null = node;

  while (!!n && n.type === "decorator") {
    // walk up the siblings from the last
    result.push(n);
    n = n.previousNamedSibling;
  }

  // order them sequentially
  return result.reverse();
}
