import { defineConfig, type Options } from "tsup";

const entry: string[] = [
  "src/index.ts",
  "src/config/index.ts",
  "src/dot/index.ts",
  "src/utils/index.ts",
  "src/utils/query/index.ts",
];

const options: Options = {
  clean: true,
  dts: false,
  entry,
  splitting: false,
  treeshake: true,
  minify: false,
  target: ["node22", "node24", "node25"],
  sourcemap: false,
};

export default defineConfig([
  {
    ...options,
    format: "esm",
    outExtension: () => ({ js: ".mjs" }),
  },
  {
    ...options,
    dts: { entry },
    entry: [...entry, "src/bin/symbex.ts"],
    format: "cjs",
  },
]);
