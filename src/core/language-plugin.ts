import TSParser from "tree-sitter";

import type {
  Edge,
  Node,
  NodePath,
  PluginDescriptor,
  QueryConfig,
} from "@/models";
import { createCapture, createConvert } from "@/utils";

import CoreError from "./error";

/**
 * Represents a loaded and initialized symbex language plugin.
 */
class LanguagePlugin {
  private _parser: TSParser;

  private _module: PluginDescriptor;

  private _capture: ReturnType<typeof createCapture<QueryConfig>>;

  private _convert: ReturnType<typeof createConvert<QueryConfig, Node, Edge>>;

  constructor(name: string) {
    this._module = LanguagePlugin.load(name);

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

  /**
   * The {@link TSParser.Language | tree-sitter `Language`} instance used by this plugin.
   */
  get language() {
    return this._module.language;
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

  extract(
    filePath: string,
    node: TSParser.SyntaxNode,
  ): { edges: Edge[]; nodes: Node[] } {
    const captures = this._capture(node);
    return this._convert(captures, [filePath] as NodePath);
  }
}

namespace LanguagePlugin {
  /**
   * Loads a language module with the name provided.
   */
  export function load(name: string): PluginDescriptor {
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

    assertModule(m, name);

    return m;
  }

  /**
   *
   * @param m A module to validate.
   */
  function assertModule(
    m: unknown,
    name: string,
  ): asserts m is PluginDescriptor {
    const fail = (reason: string) => {
      throw new CoreError(
        "CORE_PLUGIN_LOAD_FAILED",
        `Failed to load plugin "${name}": ${reason}`,
      );
    };

    if (typeof m !== "object" || m === null) fail("module is not an object");

    const mod = m as Record<string, unknown>;

    if (!isLanguage(mod.language)) fail("missing or invalid 'language'");

    if (!mod.query) fail("missing or invalid 'query'");

    if (typeof mod.captureConfig !== "object" || mod.captureConfig === null)
      fail("missing or invalid 'captureConfig'");

    if (typeof mod.convertConfig !== "object" || mod.convertConfig === null)
      fail("missing or invalid 'convertConfig'");
  }

  /**
   * Returns whether.
   * @param language {@link TSParser.Language | Language} instance to validate.
   */
  function isLanguage(language: unknown): language is TSParser.Language {
    return (
      typeof language === "object" &&
      language !== null &&
      "name" in language &&
      language.name !== null &&
      typeof language.name === "string" &&
      "language" in language &&
      language.language !== null &&
      "nodeTypeInfo" in language &&
      language.nodeTypeInfo !== null &&
      Array.isArray(language.nodeTypeInfo)
    );
  }
}

export default LanguagePlugin;
