import type { NodeId, NodePath } from "@/models";

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

  // IDE sync entry point
  static atPosition(graph: Graph, offset: number): GraphCursor | undefined {
    let deepestId: NodeId | undefined;
    let deepestDepth = -1;

    for (const [id, node] of graph.nodes) {
      if ("name" in node.at) continue;
      const { startIndex, endIndex } = node.at ?? {};
      if (startIndex === undefined || endIndex === undefined) continue;
      if (offset < startIndex || offset > endIndex) continue;

      // path length is scope depth — longer path = deeper node
      const depth = graph.depth(id);
      if (depth > deepestDepth) {
        deepestDepth = depth;
        deepestId = id;
      }
    }

    return deepestId ? new GraphCursor(graph, deepestId) : undefined;
  }

  get node(): ReturnType<Graph["nodes"]["get"]> {
    return this._graph.nodes.get(this._id);
  }

  get path(): NodePath {
    return this._graph.path(this._id);
  }

  get depth(): number {
    return this._graph.depth(this._id);
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
      c.children().some((child) => {
        const path = child.path;
        return path[path.length - 1] === symbol;
      }),
    );
    // scope is the parent — you probably want the child
    return scope?.children().find((child) => {
      const path = child.path;
      return path[path.length - 1] === symbol;
    });
  }
}

export default GraphCursor;
