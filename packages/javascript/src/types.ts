import type * as symbex from "symbex";

export type QueryConfig = {
  iife: {
    required: "node" | "body";
    optional: never;
  };
  import: {
    required: "node" | "source";
    optional: "alias" | "name";
  };
  member: {
    required: "node" | "name";
    optional: "is_static" | "decorator";
  };
  variable: {
    required: "node" | "name" | "kind";
    optional: never;
  };
  class: {
    required: "node" | "name" | "body";
    optional: "extends" | "decorator";
  };
  function: {
    required: "node" | "name" | "params" | "body";
    optional: "is_async";
  };
  method: {
    required: "node" | "name" | "body" | "params";
    optional: "is_static" | "is_async" | "decorator";
  };
};

export type BypassQueryKey = "export";

export type NodeKind = keyof QueryConfig | "parameter";

export type Node = symbex.Node<NodeKind>;

export type EdgeKind = "defines" | "extends" | "imports" | "contains";

export type Edge = symbex.Edge<EdgeKind>;

export type CaptureConfig = symbex.CaptureConfig<QueryConfig>;

export type SingleCaptureResult<K extends keyof QueryConfig> =
  symbex.SingleCaptureResult<QueryConfig[K]>;

export type FullCaptureResult = symbex.FullCaptureResult<QueryConfig>;

export type ConvertConfig = symbex.ConvertConfig<QueryConfig, Node, Edge>;

export type ConvertContext = symbex.ConvertContext<QueryConfig, Node, Edge>;

export type ConvertResult = symbex.ConvertResult<Node, Edge>;

export type ConvertHandler<K extends keyof QueryConfig> = symbex.ConvertHandler<
  QueryConfig,
  QueryConfig[K],
  Node,
  Edge
>;

export type PluginDescriptor = symbex.PluginDescriptor<QueryConfig, Node, Edge>;
