import type Parser from "tree-sitter";

import type { QueryConfig } from "./global";

type CaptureConfigOptions = {
  bypass?: (node: Parser.SyntaxNode) => Parser.QueryMatch[];
  maxStartDepth?: number;
};

type CaptureConfig<Q extends QueryConfig> = {
  [K in keyof Q]?: CaptureConfigOptions;
};

type SingleCaptureResult<T extends QueryConfig[string]> = {
  [K in T["required"]]: Parser.SyntaxNode;
} & {
  [K in T["optional"]]?: Parser.SyntaxNode;
};

type FullCaptureResult<Q extends QueryConfig> = {
  [K in keyof Q]: SingleCaptureResult<Q[K]>[];
};

export type {
  CaptureConfig,
  CaptureConfigOptions,
  FullCaptureResult,
  SingleCaptureResult,
};
