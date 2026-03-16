import type { Edge, Node, NodeId, NodePath } from "@/models";
import { defined } from "@/shared/defined";

import GraphError from "./error";
import { HashRegistry } from "./hash-registry";

type GraphNode<N extends Node = Node> = Omit<N, "path"> & { id: NodeId };
type GraphEdge<E extends Edge = Edge> = E & { from: NodeId; to: NodeId };

class Graph<N extends Node = Node, E extends Edge = Edge> {
  private _registry: HashRegistry;
  private _nodes: Map<NodeId, GraphNode<N>>;
  private _edges: Map<NodeId, Map<NodeId, Set<GraphEdge<E>["kind"]>>>;
  private _edgeProps: Map<
    NodeId,
    Map<NodeId, Map<GraphEdge<E>["kind"], GraphEdge<E>["props"]>>
  >;

  constructor(nodes: N[], edges: E[]) {
    this._registry = new HashRegistry();
    this._nodes = new Map();
    this._edges = new Map();
    this._edgeProps = new Map();

    for (const node of nodes) {
      this.addNode(node);
    }

    for (const edge of edges) {
      this.addEdge(edge);
    }
  }

  /**
   * Contains all the nodes added to the graph.
   */
  get nodes(): ReadonlyMap<NodeId, GraphNode<N>> {
    return this._nodes;
  }
  /**
   * The adjacency list of the graph.
   */
  get edges(): ReadonlyMap<
    NodeId,
    ReadonlyMap<NodeId, ReadonlySet<GraphEdge<E>["kind"]>>
  > {
    return this._edges;
  }
  /**
   * Language specific metadata for each edges.
   */
  get edgeProps(): ReadonlyMap<
    NodeId,
    ReadonlyMap<
      NodeId,
      ReadonlyMap<GraphEdge<E>["kind"], GraphEdge<E>["props"]>
    >
  > {
    return this._edgeProps;
  }

  /**
   * Adds a node to the graph.
   */
  addNode(node: N): this {
    const id = this._registry.encode(node.path);
    if (!this._nodes.has(id)) {
      this._nodes.set(id, {
        ...node,
        id,
      });
    }

    if (!this._edges.has(id)) {
      this._edges.set(id, new Map());
    }

    return this;
  }

  /**
   * Removes a node from the graph.
   */
  removeNode(node: N): this {
    const id = this._registry.encode(node.path);
    this._edges.delete(id);
    this._nodes.delete(id);
    this._edgeProps.delete(id); // outgoing props

    for (const adjacentNodes of this._edges.values()) {
      adjacentNodes.delete(id);
    }

    for (const toMap of this._edgeProps.values()) {
      toMap.delete(id); // incoming props
    }

    return this;
  }

  /**
   * Gets the adjacent node ids set for the given node id.
   */
  adjacent(
    id: NodeId,
  ): ReadonlyMap<NodeId, ReadonlySet<GraphEdge<E>["kind"]>> | undefined {
    return this._edges.get(id);
  }

  getEdgeProperties(
    from: NodeId,
    to: NodeId,
    kind: GraphEdge<E>["kind"],
  ): GraphEdge<E>["props"] {
    return this._edgeProps.get(from)?.get(to)?.get(kind);
  }

  /**
   * Adds an edge to the graph.
   */
  addEdge(edge: E): this {
    const { from, to, kind, props } = edge;
    const fromId = this._registry.encode(from);
    const toId = this._registry.encode(to);

    if (!this._edges.has(fromId)) {
      throw new GraphError(
        "GRAPH_NO_NODE",
        `There is no node with id: ${fromId}`,
      );
    }

    const adjacentNodes = this._adjacent(fromId);
    defined(
      adjacentNodes,
      new GraphError(
        "GRAPH_UNDEFINED_INSTANCE",
        `No adjacency map found for node: ${fromId}`,
      ),
    );

    if (!adjacentNodes.has(toId)) {
      adjacentNodes.set(toId, new Set());
    }

    adjacentNodes.get(toId)!.add(kind);

    if (props !== undefined) {
      this._setEdgeProperties(fromId, toId, kind, props);
    }

    return this;
  }

  removeEdge(from: NodeId, to: NodeId, kind: GraphEdge<E>["kind"]): this {
    this._edges.get(from)?.get(to)?.delete(kind);
    this._edgeProps.get(from)?.get(to)?.delete(kind);
    return this;
  }

  /**
   * Returns true if there is an edge from the `source` node to `target` node.
   */
  hasEdge(from: NodeId, to: NodeId, kind: GraphEdge<E>["kind"]): boolean {
    return this._edges.get(from)?.get(to)?.has(kind) ?? false;
  }

  destroy() {
    this._nodes.clear();
    this._edges.clear();
    this._edgeProps.clear();
  }

  serialize() {
    const nodes = Array.from(
      this._nodes.values().map((n) => ({
        ...n,
        name: this._registry.decode(n.id).pop()!,
        range: {
          byte: `${n.range?.startIndex}:${n.range?.endIndex}`,
          line: `L${n.range?.startPosition.row}:L${n.range?.endPosition.row}`,
        },
      })),
    );
    const edges = [];

    for (const [from, toMap] of this._edges) {
      for (const [to, kinds] of toMap) {
        for (const kind of kinds) {
          const props = this._edgeProps.get(from)?.get(to)?.get(kind);
          edges.push({
            from,
            fromName: this._registry.decode(from).pop()!,
            to,
            toName: this._registry.decode(to).pop()!,
            kind,
            ...(props !== undefined && { props }),
          });
        }
      }
    }

    return { nodes, edges };
  }

  private _adjacent(
    id: NodeId,
  ): Map<NodeId, Set<GraphEdge<E>["kind"]>> | undefined {
    return this._edges.get(id);
  }

  /**
   * Sets the properties of the given edge.
   */
  private _setEdgeProperties(
    from: NodeId,
    to: NodeId,
    kind: GraphEdge<E>["kind"],
    props: GraphEdge<E>["props"],
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

  private _parent(id: NodeId): NodeId | undefined {
    const path = this._registry.decode(id);
    const parentPath = path.slice(0, -1) as NodePath;

    if (!this._registry.has(parentPath)) return;

    return this._registry.encode(parentPath);
  }

  private _resolve(name: string, from: NodeId): NodeId {
    // resolve id by name
    let scope: NodeId | undefined = from;
    // bread-first-search with adjacent nodes
    while (scope !== undefined) {
      const adj = this.adjacent(scope);
      if (adj) {
        for (const [id] of adj) {
          const path = this._registry.decode(id);
          // get identifier (last element of path array)
          const identifier = path[path.length - 1];
          if (identifier === name) {
            return id;
          }
        }
      }
      // continue search on parent
      scope = this._parent(scope);
    }

    // TODO: Global resolution

    throw new GraphError(
      "GRAPH_NAME_RESOLUTION_FAILED",
      `Failed to resolve ${name} from ${from}`,
    );
  }
}

export default Graph;
