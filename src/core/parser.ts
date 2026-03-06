import path from "node:path";

import type TSParser from "tree-sitter";

import { Config } from "@/config";
import type { Edge, Node } from "@/models";
import { defined } from "@/shared/defined";

import { CoreError } from "./error";
import type { Graph } from "./graph";
import { Language } from "./language";

class Parser {
  private _languages: Map<string, Language>;

  constructor(config: Config) {
    this._languages = new Map();
    config.language.forEach((p) => {
      this._languages.set(p.ext, new Language(p.name));
    });
  }

  /**
   * {@link Language | spine `Language`} instances keyed by file extension.
   */
  get languages(): ReadonlyMap<string, Language> {
    return this._languages;
  }

  /**
   * Parses a source file using the language registered for its file extension.
   * @param filePath Path to the source file to parse.
   * @param source String source to parse.
   * @param oldTree Previous tree for incremental parsing.
   * @param options Parsing options passed to tree-sitter.
   * @throws If the file has any syntax error.
   */
  parse(
    filePath: string,
    source: string,
    oldTree?: TSParser.Tree | null,
    options?: TSParser.Options,
  ) {
    const language = this._getLanguage(filePath);
    const tree = language.parse(filePath, source, oldTree, options);

    if (tree.rootNode.hasError) {
      throw new CoreError("CORE_SYNTAX_ERROR", `Syntax error in ${filePath}`);
    }

    return language.extract(filePath, tree.rootNode);
  }

  /**
   * Cleans up all registered language resources.
   */
  destroy(): void {
    this._languages.clear();
  }
  // TEMPORARY
  toDot<N extends Node = Node, E extends Edge = Edge>(
    filePath: string,
    graph: Graph<N, E>,
  ) {
    const language = this._getLanguage(filePath);
    return language.toDot(graph);
  }

  /**
   * @param filePath Path to the source file to parse.
   * @throws If no language is registered for the file's extension.
   * @throws If the language is registered but cannot be found in runtime.
   */
  private _getLanguage(filePath: string): Language {
    const ext = path.extname(filePath);
    if (!this.languages.has(ext))
      throw new CoreError(
        "CORE_UNSUPPORTED_LANGUAGE",
        `Unsupported file extension: ${ext}`,
      );

    const language = this.languages.get(ext);
    defined(
      language,
      new CoreError(
        "CORE_UNDEFINED_INSTANCE",
        `Undefined language corresponding ${ext}`,
      ),
    );

    return language;
  }
}

export { Parser };
