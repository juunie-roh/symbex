import { readFileSync } from "node:fs";

import TSParser, { Language } from "tree-sitter";

import { CoreError } from "./error";

/**
 * Represents a loaded and initialized spine plugin.
 */
class Plugin {
  private _parser: TSParser;

  private _language: TSParser.Language;

  private _query: TSParser.Query;

  private _convert: any;

  constructor(packageName: string) {
    const { language, convert, queryString } = Plugin.load(packageName);
    this._parser = new TSParser();
    this._language = language;
    this._parser.setLanguage(language);
    this._query = new TSParser.Query(language, queryString);
    this._convert = convert;
  }
  /** The {@link TSParser.Language `Language`} instance used by this plugin */
  get language() {
    return this._language;
  }
  /** The {@link TSParser.Query `Query`} instance used by this plugin */
  get query() {
    return this._query;
  }

  /**
   * Parses a source file and converts the syntax tree using the plugin's converter.
   * @param file Path to the source file to parse
   * @param oldTree Previous tree for incremental parsing
   * @param options Parsing options passed to tree-sitter
   */
  parse(
    file: string,
    oldTree?: TSParser.Tree | null,
    options?: TSParser.Options,
  ) {
    const source = readFileSync(file, "utf-8");
    const tree = this._parser.parse(source, oldTree, options);
    return this._convert(tree, this._query, file);
  }
}

namespace Plugin {
  /**
   * Plugin package module interface
   */
  export interface Module {
    language: Language;
    convert: any;
    queryString: string;
  }

  /**
   * @param name The npm package name of the plugin
   * @returns The resolved module containing language, query string, and converter
   * @throws If the package cannot be found under `node_modules`
   * @throws If the loaded module is incompatible with {@link Plugin.Module}
   */
  export function load(name: string): Module {
    let m: Module;
    try {
      m = require(name);
    } catch {
      throw new CoreError(
        "CORE_PLUGIN_LOAD_FAILED",
        `Failed to load plugin "${name}": plugin is not installed.`,
      );
    }

    if (!isModule(m)) {
      throw new CoreError(
        "CORE_PLUGIN_LOAD_FAILED",
        `Failed to load plugin "${name}": module is incompatible with Plugin.Module.`,
      );
    }

    return m;
  }

  function isModule(m: unknown): m is Module {
    return (
      typeof m === "object" &&
      m !== null &&
      "language" in m &&
      "convert" in m &&
      "queryString" in m &&
      typeof (m as Plugin.Module).queryString === "string"
    );
  }
}

export { Plugin };
