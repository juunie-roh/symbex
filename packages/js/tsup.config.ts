import { scmPlugin } from "letant/query";
import { defineConfig, type Options } from "tsup";

const options: Options = {
  clean: true,
  entry: ["src/index.ts"],
  esbuildPlugins: [scmPlugin],
  minify: false,
  target: ["node22", "node24", "node25"],
  external: ["letant", "tree-sitter-javascript"],
  sourcemap: false,
};

export default defineConfig([
  { ...options, dts: true, format: "cjs" },
  { ...options, dts: false, format: "esm" },
]);
