import type { Plugin } from "esbuild";
import fs from "fs";

import { normalize } from "./normalize";

const scmPlugin: Plugin = {
  name: "symbex-scm",
  setup(build) {
    build.onLoad({ filter: /\.scm$/ }, (args) => {
      const raw = fs.readFileSync(args.path, "utf8");
      return {
        contents: `export default ${JSON.stringify(normalize(raw))}`,
        loader: "js",
      };
    });
  },
};

export default scmPlugin;
