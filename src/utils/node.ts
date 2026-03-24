import type Parser from "tree-sitter";

export function getRange(node: Parser.SyntaxNode): Parser.Range {
  return {
    startIndex: node.startIndex,
    endIndex: node.endIndex,
    startPosition: node.startPosition,
    endPosition: node.endPosition,
  } satisfies Parser.Range;
}

/**
 *
 * @param type A node-type string.
 * @param node A node to start searching for.
 */
export function getInnerMostParent(
  type: string,
  node: Parser.SyntaxNode,
): Parser.SyntaxNode | undefined {
  let cur = node.parent;

  while (cur) {
    if (cur.type === type) return cur;
    cur = cur.parent;
  }

  return;
}
