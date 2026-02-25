import { readFileSync } from "node:fs";

import TSParser from "tree-sitter";

import { CoreError } from "./error";

/**
 * @class
 * An initialized plugin instance
 */
class Plugin {
  private _parser: TSParser;

  private _language: TSParser.Language;

  private _query: TSParser.Query;

  private _convert: any;

  constructor(packageName: string) {
    const { language, convert, queryString } = Plugin._getPlugin(packageName);
    this._parser = new TSParser();
    this._language = language;
    this._parser.setLanguage(language);
    this._query = new TSParser.Query(language, queryString);
    this._convert = convert;
  }

  get language() {
    return this._language;
  }

  get query() {
    return this._query;
  }

  parse(
    file: string,
    oldTree?: TSParser.Tree | null,
    options?: TSParser.Options,
  ) {
    const source = readFileSync(file, "utf-8");
    const tree = this._parser.parse(source, oldTree, options);
    return this._convert(tree, this._query, file);
  }

  private static _getPlugin(name: string) {
    let m: any;
    try {
      m = require(name);
    } catch {
      throw new CoreError(
        "CORE_PLUGIN_LOAD_FAILED",
        `Failed to load plugin "${name}": plugin is not installed.`,
      );
    }

    return m;
  }
}

export { Plugin };
