import type Parser from "tree-sitter";

import type { QueryConfig } from "./global";

export type CaptureConfigOptions = {
  bypass?: (node: Parser.SyntaxNode) => Parser.QueryMatch[];
  maxStartDepth?: number;
};

export type CaptureConfig<Q extends QueryConfig> = {
  [K in keyof Q]?: CaptureConfigOptions;
};

export type SingleCaptureResult<T extends QueryConfig[string]> = {
  [K in T["required"]]: Parser.SyntaxNode;
} & {
  [K in T["optional"]]?: Parser.SyntaxNode;
};

export type FullCaptureResult<Q extends QueryConfig> = {
  [K in keyof Q]: SingleCaptureResult<Q[K]>[];
};
