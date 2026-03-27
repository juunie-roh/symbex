import { CharacterEncoding } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cwd } from "node:process";

import Parser from "tree-sitter";

import { Log } from "@/common/decorators";
import { GraphCursor, PluginHandler } from "@/core";
import type { Config, Offset } from "@/models";

import { NormalizePath } from "./decorators";
import WorkspaceError from "./error";

class Workspace {
  /** An anchor for the workspace to be opened at. */
  private readonly _rootDir: string;
  private _handler: PluginHandler;
  private _files: Map<string, PluginHandler.ParseResult>;

  private constructor(config: Config, handler: PluginHandler) {
    this._rootDir = config.rootDir || ".";
    this._handler = handler;
    this._files = new Map();
  }

  static async create(config: Config): Promise<Workspace> {
    const handler = await PluginHandler.create(config);
    return new Workspace(config, handler);
  }

  get rootDir(): string {
    return this._rootDir;
  }

  @NormalizePath
  @Log({ level: "debug", label: "Workspace.openSource" })
  openSource(filePath: string, source: string): PluginHandler.ParseResult {
    const parsed = this._handler.parse(filePath, source);
    this._files.set(filePath, parsed);
    return parsed;
  }

  @NormalizePath
  @Log({ level: "debug", label: "Workspace.openFile" })
  async openFile(
    filePath: string,
    encoding: CharacterEncoding = "utf-8",
  ): Promise<PluginHandler.ParseResult> {
    const fp = path.resolve(cwd(), this._rootDir, filePath);
    const src = await readFile(fp, { encoding });
    const parsed = this._handler.parse(filePath, src);
    this._files.set(filePath, parsed);
    return parsed;
  }

  @NormalizePath
  get(filePath: string): PluginHandler.ParseResult {
    const parsed = this._files.get(filePath);
    if (!parsed) {
      throw new WorkspaceError(
        "WORKSPACE_FILE_NOT_PARSED",
        `"${filePath}" has not been opened.`,
      );
    }
    return parsed;
  }

  @NormalizePath
  has(filePath: string): boolean {
    return this._files.has(filePath);
  }

  @NormalizePath
  @Log({ level: "debug", label: "Workspace.trace" })
  trace(filePath: string, target: Offset) {
    const { ext, cursor, node } = this._syncOffset(filePath, target);

    const references = this._handler.references(node, ext);

    for (const ref of references) {
      const resolved = cursor.resolve(ref);
      if (!resolved) {
        console.log(`Unresolved reference: ${ref}`);
      } else {
        console.log(
          resolved.path.join(" > "),
          resolved.node.kind,
          "at:",
          "name" in resolved.node.at
            ? `${resolved.node.at.name}(${resolved.node.at.external ?? false})`
            : resolved.node.at.startPosition.row,
        );
      }
    }
  }

  @Log({
    level: "debug",
    label: "Workspace.destroy",
    message: "Workspace Destroyed",
  })
  destroy(): void {
    this._handler.destroy();
    this._files.clear();
  }

  /**
   * Synchronize a node with given offset.
   */
  @NormalizePath
  @Log({ level: "debug", label: "Workspace._syncOffset" })
  private _syncOffset(
    filePath: string,
    target: Offset,
  ): {
    ext: string;
    cursor: GraphCursor;
    node: Parser.SyntaxNode;
  } {
    const { graph, tree, ext } = this.get(filePath);
    const cursor = GraphCursor.at(graph, target);

    const cursorNode = cursor.node;

    let offset: number;

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

    const node =
      tree.rootNode.descendantForIndex(offset).parent ?? tree.rootNode;

    return {
      ext,
      cursor,
      node,
    };
  }
}

export default Workspace;
