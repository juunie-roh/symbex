import type TSParser from "tree-sitter";

import type { QueryTag, QueryType } from "@/models";

/**
 * Get 1-depth children of a given node.
 */
function getMatches(
  by: TSParser.Query,
  from: TSParser.SyntaxNode,
): TSParser.QueryMatch[] {
  const matches = by.matches(from);

  return matches.filter((match) =>
    match.captures.some(
      (captured) =>
        captured.node.parent?.id === from.id ||
        // include export declarations
        captured.node.parent?.type === "export_statement",
    ),
  );
}

/**
 * Group the matches by a tag.
 */
function groupMatches(
  by: QueryType | string,
  from: TSParser.QueryMatch[],
): TSParser.QueryMatch[] {
  return from.filter((match) =>
    match.captures.some((captured) => captured.name === by),
  );
}

/**
 * Find a {@link TSParser.SyntaxNode | node} by name within a {@link TSParser.QueryMatch | match}.
 */
function getNode(by: string, from: TSParser.QueryMatch) {
  return from.captures.find((c) => c.name === by)?.node;
}

/**
 * Create type-safe getter looking up a name within {@link TSParser.QueryCapture | captures} of {@link TSParser.QueryMatch | match}.
 */
function createGetter<Q extends keyof QueryTag>(match: TSParser.QueryMatch) {
  function get(tag: QueryTag[Q]["required"]): TSParser.SyntaxNode;
  function get(tag: QueryTag[Q]["optional"]): TSParser.SyntaxNode | undefined;
  function get(
    tag: string,
  ): TSParser.SyntaxNode | TSParser.SyntaxNode[] | undefined {
    return match.captures.find((c) => c.name === tag)?.node;
  }
  return get;
}

export { createGetter, getMatches, getNode, groupMatches };
