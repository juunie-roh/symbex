import type Parser from "tree-sitter";

import type { QueryMap } from "@/utils/query";

import type { CaptureConfig } from "./capture";
import type { ConvertConfig } from "./convert";

/**
 * @template T A type to make a brand on.
 * @template K A name of brand.
 * @example
 * type NodeId = Branded<string, "NodeId"> // NodeId = string & { readonly __brand: "NodeId" }
 */
export type Branded<T, K extends string> = T & { readonly __brand: K };
export type NodeId = Branded<string, "NODE_ID">;
export type NodePath = Branded<string[], "NODE_PATH">;
export type NodePathString = Branded<string, "NODE_PATH_STRING">;

export type NodeSource = { name: string; external?: boolean };

type BaseNode<K extends string = string> = {
  /**
   * Unique human-readable signature identifying the node.
   */
  path: NodePath;
  /**
   * Kind of the node.
   */
  kind: K;
  /**
   * A position where does the node sit in the file. If the node is from outside the file, {@link NodeSource | source}.
   * @see {@link Parser.Range | tree-sitter `Range`}
   */
  at: Parser.Range | NodeSource;
  /**
   * Language-specific property supplements.
   */
  props?: Record<string, unknown>;
};

type ScopeNode<K extends string = string> = BaseNode<K> & {
  /**
   * Type of the node.
   */
  type: "scope" | "anonymous";
  /**
   * Start index of the inner block.
   */
  blockStartIndex: number;
};

type BindingNode<K extends string = string> = BaseNode<K> & {
  /**
   * Type of the node.
   */
  type: "binding";
  /**
   * Start index of the inner block.
   */
  blockStartIndex?: never;
};

/**
 * @template K - String union of valid `kind` values for this node. Defaults to
 * `string` for untyped use; narrow it to a literal union to get type-safe `kind` access.
 * @example
 * import type * as symbex from "symbex";
 * type Node = symbex.Node<"node kind" | "string literals">;
 */
export type Node<K extends string = string> = ScopeNode<K> | BindingNode<K>;

/**
 * @template K - String union of valid `kind` values for this edge. Defaults to
 * `string` for untyped use; narrow it to a literal union to get type-safe `kind` access.
 * @example
 * import type * as symbex from "symbex";
 * type Edge = symbex.Edge<"edge kind" | "string literals">;
 */
export type Edge<K extends string = string> = {
  /**
   * ID of the source node where the relationship originates.
   */
  from: NodePath;
  /**
   * A name or ID of the target node where the relationship terminates.
   */
  to: NodePath;
  /**
   * Kind of relationship this edge represents.
   */
  kind: K;
  /**
   * Language-specific property supplements.
   */
  props?: Record<string, unknown>;
};

export type QueryConfig = Record<
  string,
  { required: string; optional: string }
>;

export interface PluginDescriptor<
  Q extends QueryConfig = QueryConfig,
  N extends Node = Node,
  E extends Edge = Edge,
> {
  language: Parser.Language;
  query: QueryMap<keyof Q & string>;
  captureConfig: CaptureConfig<Q>;
  convertConfig: ConvertConfig<Q, N, E>;
  references: (node: Parser.SyntaxNode) => string[];
}
