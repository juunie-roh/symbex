import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    include: [
      "src/**/*.(test|spec).*",
      "packages/javascript/src/**/*.(test|spec).*",
    ],
    exclude: ["**/node_modules/**"],
    environment: "node",
    coverage: {
      include: ["src/**", "packages/javascript/src/**"],
      exclude: [
        "**/index.*",
        "**/__mocks__/**",
        "**/*.test.*",
        "**/types.ts",
        "**/models/**",
        "**/error.ts",
        "**/*.d.ts",
      ],
    },
  },
});
