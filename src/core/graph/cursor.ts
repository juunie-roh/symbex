import type Parser from "tree-sitter";

import type { NodeId, NodePath } from "@/models";
import { defined } from "@/shared/defined";

import GraphError from "./error";
import type Graph from "./graph";

/**
 * A lightweight immutable cursor instance.
 */
class GraphCursor {
  private readonly _graph: Graph;
  private readonly _id: NodeId;

  constructor(graph: Graph, id: NodeId) {
    this._graph = graph;
    this._id = id;
  }

  /**
   * Get graph cursor instance at given {@link Parser.Point | point} or byte offset.
   */
  static at(graph: Graph, target: Parser.Point | number): GraphCursor {
    let cursor = graph.walk();
    let next: GraphCursor | undefined;

    while ((next = cursor.children().find(GraphCursor._contains(target)))) {
      cursor = next;
    }

    return cursor;
  }

  get node(): Graph.Node {
    const n = this._graph.nodes.get(this._id);
    defined(
      n,
      new GraphError(
        "GRAPH_NO_NODE",
        `Failed to get node with id: ${this._id}`,
      ),
    );
    return n;
  }

  get path(): NodePath {
    return this._graph.path(this._id);
  }

  get depth(): number {
    return this._graph.depth(this._id);
  }

  get name(): string {
    return this.node.name;
  }

  parent(): GraphCursor | undefined {
    const parentId = this._graph.parent(this._id);
    return parentId ? new GraphCursor(this._graph, parentId) : undefined;
  }

  children(edgeKind?: string): GraphCursor[] {
    const cursors: GraphCursor[] = [];

    this._graph.adjacent(this._id)?.forEach((kinds, id) => {
      if (edgeKind && !kinds.has(edgeKind)) return;
      cursors.push(new GraphCursor(this._graph, id));
    });

    return cursors;
  }

  nearest(
    predicate: (cursor: GraphCursor) => boolean,
  ): GraphCursor | undefined {
    let c: GraphCursor | undefined = this;

    while (c) {
      if (predicate(c)) return c;
      c = c.parent();
    }

    return undefined;
  }

  resolve(symbol: string): GraphCursor | undefined {
    const scope = this.nearest((c) =>
      c.children().some((child) => child.name === symbol),
    );
    // scope is the parent — you probably want the child
    return scope?.children().find((child) => child.name === symbol);
  }

  private static _contains(target: Parser.Point | number) {
    return (child: GraphCursor) => {
      if ("name" in child.node.at) return false;
      if (typeof target === "number") {
        const { startIndex, endIndex } = child.node.at;
        return startIndex <= target && endIndex >= target;
      }

      const { startPosition, endPosition } = child.node.at;
      return (
        startPosition.row <= target.row &&
        startPosition.column <= target.column &&
        endPosition.row >= target.row &&
        endPosition.column >= target.column
      );
    };
  }
}

export default GraphCursor;
