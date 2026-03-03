import { readFileSync } from "node:fs";

import TSParser from "tree-sitter";

import { Edge, Node } from "@/models";

import { CoreError } from "./error";

/**
 * Represents a loaded and initialized spine language plugin.
 */
class Language {
  private _parser: TSParser;

  private _query: TSParser.Query;

  private _module: Language.Module;

  constructor(packageName: string) {
    this._module = Language.load(packageName);
    this._parser = new TSParser();
    this._parser.setLanguage(this._module.language);
    this._query = new TSParser.Query(
      this._module.language,
      this._module.queryString,
    );
  }

  /**
   * The {@link TSParser.Language | tree-sitter `Language`} instance used by this plugin.
   */
  get language() {
    return this._module.language;
  }
  /**
   * The {@link TSParser.Query | tree-sitter `Query`} instance used by this plugin.
   */
  get query() {
    return this._query;
  }

  /**
   * Parses a source file to the {@link TSParser.Tree | tree-sitter `Tree`}.
   * @param filePath Path to the source file to parse.
   * @param oldTree Previous tree for incremental parsing.
   * @param options Parsing options passed to tree-sitter.
   * @throws If the language plugin fails to parse the file.
   */
  parse(
    filePath: string,
    oldTree?: TSParser.Tree | null,
    options?: TSParser.Options,
  ): TSParser.Tree {
    try {
      const source = readFileSync(filePath, "utf-8");
      return this._parser.parse(source, oldTree, options);
    } catch (e) {
      throw new CoreError(
        "CORE_PLUGIN_PARSE_FAILED",
        `Failed to parse ${filePath}`,
        { cause: e },
      );
    }
  }

  extract(
    filePath: string,
    node: TSParser.SyntaxNode,
  ): { edges: Edge[]; nodes: Node[] } {
    const captures = this._module.capture(node, this._query, filePath);
    return this._module.convert(captures, filePath);
  }
}

namespace Language {
  /**
   * Plugin package module interface.
   */
  export interface Module {
    language: TSParser.Language;
    /**
     * Temporary field.
     * @todo Specify fields.
     */
    [k: string]: any;
  }

  /**
   * Loads a language module with the name provided.
   * @param name The npm package name of the plugin.
   * @returns The resolved module containing language, query string, and converter.
   * @throws If the package cannot be found under `node_modules`.
   * @throws If the loaded module is incompatible with {@link Language.Module | language module}.
   */
  export function load(name: string): Module {
    let m: Module;

    try {
      m = require(name);
    } catch (e) {
      throw new CoreError(
        "CORE_PLUGIN_LOAD_FAILED",
        `Failed to load plugin "${name}"`,
        { cause: e },
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

  /**
   *
   * @param m A module to validate.
   * @returns Whether the imported module satisfies the language module interface.
   * @todo Specify module interface.
   */
  function isModule(m: unknown): m is Module {
    return typeof m === "object" && m !== null && "language" in m;
  }
}

export { Language };
