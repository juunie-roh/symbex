import { defineConfig } from "tsup";

export default defineConfig([
  {
    clean: true,
    dts: true,
    entry: [
      "src/index.ts",
      "src/bin/spine.ts",
      "src/config/index.ts",
      "src/core/index.ts",
      "src/utils/index.ts",
      "src/utils/query/index.ts",
    ],
    format: "cjs",
    minify: true,
    target: ["node22", "node24", "node25"],
    sourcemap: true,
  },
]);
