import path from "node:path";

import type TSParser from "tree-sitter";

import { Config } from "@/config";

import { CoreError } from "./error";
import { Plugin } from "./plugin";

class Parser {
  /** A singleton parser instance */
  private static _instance: Parser | undefined;
  /** A tree-sitter parser instances */
  private _plugins: Map<string, Plugin>;

  private constructor(config: Config) {
    this._plugins = new Map();
    config.plugin.forEach((p) => {
      this._plugins.set(p.ext, new Plugin(p.name));
    });
  }

  static get(config?: Config): Parser {
    if (!this._instance) {
      if (!config)
        throw new CoreError(
          "CORE_NO_CONFIG",
          "Configuration must be specified for initialization",
        );

      this._instance = new Parser(config);
    }

    return this._instance;
  }

  get plugin() {
    return this._plugins;
  }

  parse(
    file: string,
    oldTree?: TSParser.Tree | null,
    options?: TSParser.Options,
  ) {
    const ext = path.extname(file);
    if (!this._plugins.has(ext))
      throw new CoreError(
        "CORE_UNSUPPORTED_LANGUAGE",
        "Unsupported language: no available plugin found",
      );

    try {
      return this._plugins.get(ext)!.parse(file, oldTree, options);
    } catch (e) {
      throw new CoreError(
        "CORE_PLUGIN_PARSE_FAILED",
        `Failed to parse ${file}`,
        { cause: e },
      );
    }
  }
}

export { Parser };
