import TSParser from "tree-sitter";

import type {
  Edge,
  Node,
  NodePath,
  PluginDescriptor,
  QueryConfig,
} from "@/models";
import { assertPluginDescriptor } from "@/shared/checker";
import { createCapture, createConvert } from "@/utils";

import CoreError from "./error";

/**
 * Represents a loaded and initialized symbex language plugin.
 */
class Plugin {
  private _parser: TSParser;

  private _module: PluginDescriptor;

  private _capture: ReturnType<typeof createCapture<QueryConfig>>;

  private _convert: ReturnType<typeof createConvert<QueryConfig, Node, Edge>>;

  constructor(name: string) {
    this._module = Plugin.load(name);

    this._capture = createCapture<QueryConfig>(
      this._module.query,
      this._module.captureConfig,
    );

    this._convert = createConvert<QueryConfig, Node, Edge>(
      this._capture,
      this._module.convertConfig,
    );

    this._parser = new TSParser();
    this._parser.setLanguage(this._module.language);
  }

  static load(name: string): PluginDescriptor {
    let m: PluginDescriptor;

    try {
      require.resolve(name);
    } catch (e) {
      throw new CoreError(
        "CORE_PLUGIN_LOAD_FAILED",
        `Plugin "${name}" not found`,
        { cause: e },
      );
    }

    try {
      m = require(name).default;
    } catch (e) {
      throw new CoreError(
        "CORE_PLUGIN_LOAD_FAILED",
        `Plugin "${name}" threw during initialization`,
        { cause: e },
      );
    }

    assertPluginDescriptor(
      m,
      name,
      new CoreError("CORE_PLUGIN_LOAD_FAILED", "Failed to load plugin"),
    );

    return m;
  }

  /**
   * The {@link TSParser.Language | tree-sitter `Language`} instance used by this plugin.
   */
  get language() {
    return this._parser.getLanguage();
  }

  /**
   * Parses a source file to the {@link TSParser.Tree | tree-sitter `Tree`}.
   * @param filePath Path to the source file to parse.
   * @param source String source to parse.
   * @param oldTree Previous tree for incremental parsing.
   * @param options Parsing options passed to tree-sitter.
   * @throws If the language plugin fails to parse the file.
   */
  parse(
    filePath: string,
    source: string,
    oldTree?: TSParser.Tree | null,
    options?: TSParser.Options,
  ): TSParser.Tree {
    try {
      return this._parser.parse(source, oldTree, options);
    } catch (e) {
      throw new CoreError(
        "CORE_PLUGIN_PARSE_FAILED",
        `Failed to parse ${filePath}`,
        { cause: e },
      );
    }
  }

  references(node: TSParser.SyntaxNode): string[] {
    return this._module.references(node);
  }

  extract(
    filePath: string,
    node: TSParser.SyntaxNode,
  ): { edges: Edge[]; nodes: Node[] } {
    const captures = this._capture(node);
    const result = this._convert(captures, [filePath] as NodePath);
    // add root file node once
    result.nodes.push({
      path: [filePath] as NodePath,
      kind: "file",
      type: "scope",
      at: { name: filePath },
      blockStartIndex: 0,
    });

    return result;
  }
}

export default Plugin;
