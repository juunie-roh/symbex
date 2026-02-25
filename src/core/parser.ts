import path from "node:path";

import type TSParser from "tree-sitter";

import { Config } from "@/config";

import { CoreError } from "./error";
import { Plugin } from "./plugin";

class Parser {
  private static _instance: Parser | undefined;

  private _plugins: Map<string, Plugin>;

  private constructor(config: Config) {
    this._plugins = new Map();
    config.plugin.forEach((p) => {
      this._plugins.set(p.ext, new Plugin(p.name));
    });
  }

  /**
   * Returns the singleton instance, creating it on first call.
   * @param config Required on first call to initialize the parser; ignored thereafter
   * @throws If called for the first time without a config
   */
  public static get(config?: Config): Parser {
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
  /** {@link Plugin `Plugin`} instances keyed by file extension. */
  public get plugins() {
    return this._plugins;
  }

  /**
   * Parses a source file using the plugin registered for its file extension.
   * @param file Path to the source file to parse
   * @param oldTree Previous tree for incremental parsing
   * @param options Parsing options passed to tree-sitter
   * @throws If no plugin is registered for the file's extension
   * @throws If the plugin fails to parse the file
   */
  public parse(
    file: string,
    oldTree?: TSParser.Tree | null,
    options?: TSParser.Options,
  ) {
    const ext = path.extname(file);
    if (!this._plugins.has(ext))
      throw new CoreError(
        "CORE_UNSUPPORTED_LANGUAGE",
        `Unsupported file extension: ${ext}`,
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

  /**
   * Cleans up resources and resets the singleton instance
   */
  public destroy(): void {
    this._plugins.clear();
    Parser._instance = undefined;
  }
}

export { Parser };
