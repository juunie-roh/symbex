import type TSParser from "tree-sitter";

import type { QueryConfig } from "./global";

type CaptureConfigOptions = {
  bypass?: (node: TSParser.SyntaxNode) => TSParser.QueryMatch[];
  maxStartDepth?: number;
};

type CaptureConfig<Q extends QueryConfig> = {
  [K in keyof Q]?: CaptureConfigOptions;
};

type SingleCaptureResult<T extends QueryConfig[string]> = {
  [K in T["required"]]: TSParser.SyntaxNode;
} & {
  [K in T["optional"]]?: TSParser.SyntaxNode;
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
