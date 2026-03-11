import type * as Spine from "@juun-roh/spine";

// TODO: specify other declaration kinds
type NodeKind =
  | "file"
  | "module"
  | "function"
  | "class"
  | "abstract_class"
  | "method"
  | "member"
  | "variable";

/**
 * Override {@link Spine.Node | `Node`}'s `kind` with language specific {@link NodeKind | kinds of node}.
 */
type Node = Spine.Node<NodeKind>;

// TODO: specify other relationship kinds
type EdgeKind = "imports" | "implements" | "extends" | "defines";

/**
 * Override {@link Spine.Edge | `Edge`}'s `kind` with language specific {@link EdgeKind | kinds of edge}.
 */
type Edge = Spine.Edge<EdgeKind>;

type Graph = Spine.Graph<Node, Edge>;

type QueryTag = {
  class: {
    required: "class" | "name" | "body";
    optional:
      | "heritage"
      | "extends"
      | "type_args"
      | "extends_body"
      | "implements"
      | "type_params";
  };
  function: {
    required: "function" | "name" | "params" | "body";
    optional: "is_async" | "type_params" | "return_type";
  };
  import: {
    required: "import" | "name" | "source";
    optional: "alias" | "is_type" | "type";
  };
  member: {
    required: "member" | "name";
    optional: "modifier" | "is_static" | "type";
  };
  method: {
    required: "method" | "name" | "body" | "params";
    optional:
      | "modifier"
      | "is_static"
      | "is_async"
      | "type_params"
      | "return_type";
  };
  params: {
    required: string;
    optional: string;
  };
  variable: {
    required: "variable" | "name" | "kind";
    optional: "key" | "type";
  };
};

type Capture<K extends keyof QueryTag> = Spine.Capture<QueryTag[K]>;
type CaptureResult = Spine.CaptureResult<QueryTag>;

export type {
  Capture,
  CaptureResult,
  Edge,
  EdgeKind,
  Graph,
  Node,
  NodeKind,
  QueryTag,
};
