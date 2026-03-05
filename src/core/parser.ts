import path from "node:path";

import type TSParser from "tree-sitter";

import { Config } from "@/config";

import { CoreError } from "./error";
import { Language } from "./language";

class Parser {
  private _languages: Map<string, Language>;

  private constructor(config: Config) {
    this._languages = new Map();
    config.language.forEach((p) => {
      this._languages.set(p.ext, new Language(p.name));
    });
  }

  /**
   * Returns the singleton instance, creating it on first call.
   * @param config Required on first call to initialize the parser; ignored thereafter.
   * @throws If called for the first time without a config.
   */
  static create(config?: Config): Parser {
    if (!config)
      throw new CoreError(
        "CORE_NO_CONFIG",
        "Configuration must be specified for initialization",
      );

    return new Parser(config);
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
   * @param oldTree Previous tree for incremental parsing.
   * @param options Parsing options passed to tree-sitter.
   * @throws If no language is registered for the file's extension.
   */
  parse(
    filePath: string,
    oldTree?: TSParser.Tree | null,
    options?: TSParser.Options,
  ) {
    const ext = path.extname(filePath);
    if (!this._languages.has(ext))
      throw new CoreError(
        "CORE_UNSUPPORTED_LANGUAGE",
        `Unsupported file extension: ${ext}`,
      );

    const language = this._languages.get(ext)!;

    const tree = language.parse(filePath, oldTree, options);
    return language.extract(filePath, tree.rootNode);
  }

  /**
   * Cleans up resources and resets the singleton instance.
   */
  destroy(): void {
    this._languages.clear();
  }
}

export { Parser };
