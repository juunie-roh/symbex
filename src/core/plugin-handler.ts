import path from "node:path";

import type TSParser from "tree-sitter";

import type { Config } from "@/models/config";
import { defined } from "@/shared/defined";

import CoreError from "./error";
import Graph from "./graph";
import GraphCursor from "./graph/cursor";
import Plugin from "./plugin";

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
    oldTree?: TSParser.Tree | null,
    options?: TSParser.Options,
  ): {
    graph: Graph;
    tree: TSParser.Tree;
    name: string;
  } {
    const plugin = this._getPlugin(filePath);
    const tree = plugin.parse(filePath, source, oldTree, options);

    if (tree.rootNode.hasError) {
      throw new CoreError("CORE_SYNTAX_ERROR", `Syntax error in "${filePath}"`);
    }

    const { nodes, edges } = plugin.extract(filePath, tree.rootNode);

    return {
      graph: new Graph(nodes, edges),
      tree,
      name: this._inverted.get(plugin)!,
    };
  }

  /**
   * @param tree A tree from which to search for references.
   * @param cursor Position at which to start searching for references.
   * @param pluginName A name of the plugin.
   */
  references(
    tree: TSParser.Tree,
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

    let startIndex: number;

    const cursorNode = cursor.node;

    if (cursorNode.type !== "binding") {
      startIndex = cursorNode.blockStartIndex;
    } else if ("name" in cursorNode.at) {
      startIndex = 0;
    } else {
      startIndex = cursorNode.at.startIndex;
    }
    // Get root level cursor for the tree
    const treeCursor = tree.walk();
    // Move the tree cursor to the target position
    treeCursor.gotoFirstChildForIndex(startIndex);
    // The tree cursor doesn't have direct API to return the very node at index,
    // so manually call the parent node.
    const node: TSParser.SyntaxNode | null = treeCursor.currentNode.parent;
    return node ? plugin.references(node) : [];
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
