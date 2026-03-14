import type TSParser from "tree-sitter";

/**
 * @template K - String union of valid `kind` values for this node. Defaults to
 * `string` for untyped use; narrow it to a literal union to get type-safe `kind` access.
 * @example
 * import type * as symbex from "symbex";
 * type Node = symbex.Node<"node kind" | "string literals">;
 */
export interface Node<K extends string = string> {
  /**
   * Unique human-readable id identifying the node.
   */
  id: string;
  /**
   * Kind of this node.
   */
  kind: K;
  type: "scope" | "binding";
  /**
   * A range of positions in a multi-line text document, specified both in terms of byte offsets and row/column positions.
   * @see {@link TSParser.Range | tree-sitter `Range`}
   */
  range?: TSParser.Range;
  /**
   * Language-specific property supplements.
   */
  props?: Record<string, unknown>;
}

/**
 * @template K - String union of valid `kind` values for this edge. Defaults to
 * `string` for untyped use; narrow it to a literal union to get type-safe `kind` access.
 * @example
 * import type * as symbex from "symbex";
 * type Edge = symbex.Edge<"edge kind" | "string literals">;
 */
export interface Edge<K extends string = string> {
  /**
   * ID of the source node where the relationship originates.
   */
  from: Node["id"];
  /**
   * ID of the target node where the relationship terminates.
   */
  to: string;
  /**
   * Kind of relationship this edge represents.
   */
  kind: K;
  /**
   * Whether the target node id has been resolved.
   */
  resolved?: boolean;
  /**
   * Language-specific property supplements.
   */
  props?: Record<string, unknown>;
}

export type QueryTag = {
  required: string;
  optional: string;
};

export type QueryConfig = Record<string, QueryTag>;
