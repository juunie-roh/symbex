import { SEPARATOR } from "@/consts";
import type { Edge, Node } from "@/models";
import { defined } from "@/shared/defined";

import { GraphError } from "./error";

class Graph<N extends Node = Node, E extends Edge = Edge> {
  private _nodes: Map<Node["id"], N>;
  private _edges: Map<Node["id"], Map<Node["id"], Set<E["kind"]>>>;
  private _edgeProps: Map<
    Node["id"],
    Map<Node["id"], Map<E["kind"], E["props"]>>
  >;

  constructor(nodes: N[], edges: E[]) {
    this._nodes = new Map();
    this._edges = new Map();
    this._edgeProps = new Map();

    for (const node of nodes) {
      this.addNode(node);
    }

    // adds pre-resolved edges first (definitions, imports, ...)
    for (const edge of edges.filter((e) => e.resolved === true)) {
      this.addEdge(edge);
    }

    // resolve edges by walking through pre-resolved edges
    for (const edge of edges.filter((e) => e.resolved !== true)) {
      this.addEdge(Graph.resolve(this, edge));
    }
  }

  /**
   * Contains all the nodes added to the graph.
   */
  get nodes(): ReadonlyMap<Node["id"], N> {
    return this._nodes;
  }
  /**
   * The adjacency list of the graph.
   */
  get edges(): ReadonlyMap<
    Node["id"],
    ReadonlyMap<Node["id"], ReadonlySet<E["kind"]>>
  > {
    return this._edges;
  }
  /**
   * Language specific metadata for each edges.
   */
  get edgeProps(): ReadonlyMap<
    Node["id"],
    ReadonlyMap<Node["id"], ReadonlyMap<E["kind"], E["props"]>>
  > {
    return this._edgeProps;
  }

  /**
   * Adds a node to the graph.
   */
  addNode(node: N): this {
    if (!this._nodes.has(node.id)) {
      this._nodes.set(node.id, node);
    }

    if (!this._edges.has(node.id)) {
      this._edges.set(node.id, new Map());
    }
    return this;
  }

  /**
   * Removes a node from the graph.
   */
  removeNode(node: N): this {
    this._edges.delete(node.id);
    this._nodes.delete(node.id);
    this._edgeProps.delete(node.id); // outgoing props

    for (const adjacentNodes of this._edges.values()) {
      adjacentNodes.delete(node.id);
    }

    for (const toMap of this._edgeProps.values()) {
      toMap.delete(node.id); // incoming props
    }

    return this;
  }

  /**
   * Gets the adjacent node ids set for the given node id.
   */
  adjacent(
    id: Node["id"],
  ): ReadonlyMap<Node["id"], ReadonlySet<E["kind"]>> | undefined {
    return this._edges.get(id);
  }

  getEdgeProperties(
    from: Node["id"],
    to: Node["id"],
    kind: E["kind"],
  ): E["props"] {
    return this._edgeProps.get(from)?.get(to)?.get(kind);
  }

  /**
   * Adds an edge to the graph.
   */
  addEdge(edge: E): this {
    this._assertResolved(edge);
    const { from, to, kind, props } = edge;

    if (!this._edges.has(from)) {
      throw new GraphError(
        "GRAPH_NO_NODE",
        `There is no node with id: ${from}`,
      );
    }

    const adjacentNodes = this._adjacent(from);
    defined(
      adjacentNodes,
      new GraphError(
        "GRAPH_UNDEFINED_INSTANCE",
        `No adjacency map found for node: ${from}`,
      ),
    );

    if (!adjacentNodes.has(to)) {
      adjacentNodes.set(to, new Set());
    }

    adjacentNodes.get(to)!.add(kind);

    if (props !== undefined) {
      this._setEdgeProperties(from, to, kind, props);
    }

    return this;
  }

  removeEdge(from: Node["id"], to: Node["id"], kind: E["kind"]): this {
    this._edges.get(from)?.get(to)?.delete(kind);
    this._edgeProps.get(from)?.get(to)?.delete(kind);
    return this;
  }

  /**
   * Returns true if there is an edge from the `source` node to `target` node.
   */
  hasEdge(from: Node["id"], to: Node["id"], kind: E["kind"]): boolean {
    return this._edges.get(from)?.get(to)?.has(kind) ?? false;
  }

  destroy() {
    this._nodes.clear();
    this._edges.clear();
    this._edgeProps.clear();
  }

  serialize(): { nodes: N[]; edges: Graph.ResolvedEdge<E>[] } {
    const nodes = Array.from(this._nodes.values());
    const edges: Graph.ResolvedEdge<E>[] = [];

    for (const [from, toMap] of this._edges) {
      for (const [to, kinds] of toMap) {
        for (const kind of kinds) {
          const props = this._edgeProps.get(from)?.get(to)?.get(kind);
          edges.push({
            from,
            to,
            kind,
            resolved: true,
            ...(props !== undefined && { props }),
          } as Graph.ResolvedEdge<E>);
        }
      }
    }

    return { nodes, edges };
  }

  private _adjacent(
    id: Node["id"],
  ): Map<Node["id"], Set<E["kind"]>> | undefined {
    return this._edges.get(id);
  }

  /**
   * Sets the properties of the given edge.
   */
  private _setEdgeProperties(
    from: Node["id"],
    to: Node["id"],
    kind: E["kind"],
    props: E["props"],
  ): this {
    if (!this._edgeProps.has(from)) {
      this._edgeProps.set(from, new Map());
    }

    const fromMap = this._edgeProps.get(from);
    defined(
      fromMap,
      new GraphError(
        "GRAPH_UNDEFINED_INSTANCE",
        `No edge properties map found for node: ${from}`,
      ),
    );

    if (!fromMap.has(to)) {
      fromMap.set(to, new Map());
    }

    fromMap.get(to)!.set(kind, props);
    return this;
  }

  private _assertResolved(edge: E): asserts edge is Graph.ResolvedEdge<E> {
    if (!edge.resolved) {
      throw new GraphError(
        "GRAPH_UNRESOLVED_EDGE",
        `Unresolved edge target: ${edge.to}`,
      );
    }
  }
}

namespace Graph {
  export type ResolvedEdge<E extends Edge> = E & {
    to: Node["id"];
    resolved: true;
  };

  function isEdge(item: any): item is Edge {
    return (
      "from" in item &&
      "to" in item &&
      "kind" in item &&
      "resolved" in item &&
      typeof item.resolved === "boolean"
    );
  }

  function parent(id: Node["id"]): Node["id"] | undefined {
    const i = id.lastIndexOf(SEPARATOR);
    return i > 0 ? id.slice(0, i) : undefined;
  }

  /**
   *
   */
  export function resolve<N extends Node = Node, E extends Edge = Edge>(
    graph: Graph<N, E>,
    edge: E,
  ): ResolvedEdge<E>;
  /**
   *
   */
  export function resolve<N extends Node = Node, E extends Edge = Edge>(
    graph: Graph<N, E>,
    name: string,
    from: Node["id"],
  ): Node["id"];
  export function resolve<N extends Node = Node, E extends Edge = Edge>(
    graph: Graph<N, E>,
    item: E | string,
    from?: Node["id"],
  ): ResolvedEdge<E> | Node["id"] {
    if (isEdge(item)) {
      // item is Edge
      if (item.resolved) return item as ResolvedEdge<E>;

      return {
        ...item,
        to: resolve(graph, item.to, item.from),
        resolved: true,
      } satisfies ResolvedEdge<E>;
    } else {
      // resolve id by name
      const name = item;
      let scope = from; // start from caller

      while (scope !== undefined) {
        const adj = graph.adjacent(scope);
        if (adj) {
          for (const [targetId] of adj) {
            if (targetId.endsWith(SEPARATOR + name)) {
              return targetId;
            }
          }
        }

        scope = parent(scope);
      }

      throw new GraphError(
        "GRAPH_EDGE_RESOLUTION_FAILED",
        `Failed to resolve ${item} from ${from}`,
      );
    }
  }
}

export { Graph };
