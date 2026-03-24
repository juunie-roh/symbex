import path from "node:path";

import type Parser from "tree-sitter";

import type { Config } from "@/models/config";
import { defined } from "@/shared/defined";

import CoreError from "./error";
import Graph from "./graph";
import GraphCursor from "./graph/cursor";
import Plugin from "./plugin";

namespace PluginHandler {
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
   * @param options Parsing options passed to tree-sitter.
   * @throws If the file has any syntax error.
   */
  parse(
    filePath: string,
    source: string,
    oldTree?: Parser.Tree | null,
    options?: Parser.Options,
  ): PluginHandler.ParseResult {
    const plugin = this._getPlugin(filePath);
    const tree = plugin.parse(filePath, source, oldTree, options);

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

  /**
   * @param tree A tree from which to search for references.
   * @param cursor Position at which to start searching for references.
   * @param pluginName A name of the plugin.
   */
  references(
    tree: Parser.Tree,
    cursor: GraphCursor,
    pluginName: string,
  ): string[] {
    const plugin = this.plugins.get(pluginName);
    if (!this.plugins.has(pluginName))
      throw new CoreError(
        "CORE_UNREGISTERED_LANGUAGE",
        `Unregistered: language for "${pluginName}" not registered in configuration`,
      );
    defined(plugin);

    let offset: number;

    const cursorNode = cursor.node;

    if (cursorNode.type !== "binding") {
      // for scope node, set start index as its block start index
      offset = cursorNode.blockStartIndex;
    } else if ("name" in cursorNode.at) {
      // if the node is an imported module, start at root
      offset = 0;
    } else {
      // neither, then set start index at the node's.
      offset = cursorNode.at.startIndex;
    }

    // const treeCursor = tree.walk();
    // treeCursor.gotoFirstChildForIndex(offset);
    const node =
      tree.rootNode.descendantForIndex(offset).parent ?? tree.rootNode;

    // const node: Parser.SyntaxNode = treeCursor.currentNode;
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
