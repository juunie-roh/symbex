import type * as Spine from "@juun-roh/spine";

// TODO: specify other declaration kinds
type NodeKind =
  | "file"
  | "module"
  | "function"
  | "class"
  | "abstract_class"
  | "variable";

/**
 * Override {@link Spine.Node | `Node`}'s `kind` with language specific {@link NodeKind | kinds of node}.
 */
type Node = Spine.Node<NodeKind>;

// TODO: specify other relationship kinds
type EdgeKind = "imports" | "calls" | "implements" | "extends" | "defines";

/**
 * Override {@link Spine.Edge | `Edge`}'s `kind` with language specific {@link EdgeKind | kinds of edge}.
 */
type Edge = Spine.Edge<EdgeKind>;

export type { Edge, EdgeKind, Node, NodeKind };
