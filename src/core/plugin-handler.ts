import path from "node:path";

import type Parser from "tree-sitter";

import { Log } from "@/common/decorators";
import { defined } from "@/common/defined";
import type { Config } from "@/models/config";

import CoreError from "./error";
import Graph from "./graph";
import Plugin from "./plugin";

declare namespace PluginHandler {
  export type ParseResult = {
    graph: Graph;
    tree: Parser.Tree;
    language: string;
  };
}

class PluginHandler {
  private _languagePlugins: Map<string, Plugin>;
  private _inverted: Map<Plugin, string>;

  constructor(config: Config) {
    this._languagePlugins = new Map();
    this._inverted = new Map();

    config.language.forEach((c) => {
      const plugin = new Plugin(c.name);
      this._languagePlugins.set(c.ext, plugin);
      this._inverted.set(plugin, c.ext);
    });
  }

  /**
   * {@link Plugin | spine `Language`} instances keyed by file extension.
   */
  get plugins(): ReadonlyMap<string, Plugin> {
    return this._languagePlugins;
  }

  /**
   * Parses a source file using the language registered for its file extension.
   * @param filePath Path to the source file to parse.
   * @param source String source to parse.
   * @param oldTree Previous tree for incremental parsing.
   * @param options {@link Parser.Options | Parsing options} passed to tree-sitter.
   * @throws If the file has any syntax error.
   */
  @Log({ level: "debug", label: "PluginHandler.Parse" })
  parse(
    filePath: string,
    source: string,
    oldTree?: Parser.Tree | null,
    options?: Parser.Options,
  ): PluginHandler.ParseResult {
    const plugin = this._getPlugin(filePath);
    const tree = plugin.parse(source, oldTree, options);

    if (tree.rootNode.hasError) {
      throw new CoreError("CORE_SYNTAX_ERROR", `Syntax error in "${filePath}"`);
    }

    const { nodes, edges } = plugin.extract(filePath, tree.rootNode);

    return {
      graph: new Graph(nodes, edges),
      tree,
      language: this._inverted.get(plugin)!,
    };
  }

  @Log({ level: "debug", label: "PluginHandler.references" })
  references(node: Parser.SyntaxNode, pluginName: string): string[] {
    const plugin = this.plugins.get(pluginName);
    if (!this.plugins.has(pluginName))
      throw new CoreError(
        "CORE_UNREGISTERED_LANGUAGE",
        `Unregistered: language for "${pluginName}" not registered in configuration`,
      );
    defined(plugin);

    return plugin.references(node);
  }

  /**
   * Cleans up all registered language resources.
   */
  destroy(): void {
    this._languagePlugins.clear();
    this._inverted.clear();
  }

  /**
   * @param filePath Path to the source file to parse.
   * @throws If no language is registered for the file's extension.
   * @throws If the language is registered but cannot be found in runtime.
   */
  private _getPlugin(filePath: string): Plugin {
    const ext = path.extname(filePath);
    if (!this.plugins.has(ext))
      throw new CoreError(
        "CORE_UNREGISTERED_LANGUAGE",
        `Unregistered: language for "${ext}" not registered in configuration`,
      );

    const plugin = this.plugins.get(ext);
    defined(
      plugin,
      new CoreError(
        "CORE_UNDEFINED_INSTANCE",
        `Undefined language corresponding ${ext}`,
      ),
    );

    return plugin;
  }
}

export default PluginHandler;
