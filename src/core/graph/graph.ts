import type { Edge, Node } from "@/models";
import { defined } from "@/shared/defined";

import { GraphError } from "./error";
import { resolve, type ResolvedEdge } from "./resolve";

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
      this.addEdge(resolve(this, edge));
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

  serialize(): { nodes: N[]; edges: ResolvedEdge<E>[] } {
    const nodes = Array.from(this._nodes.values());
    const edges: ResolvedEdge<E>[] = [];

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
          } as ResolvedEdge<E>);
        }
      }
    }

    return { nodes, edges };
  }

  /**
   * Outputs the graph in DOT format for visualization with Graphviz or compatible tools.
   * @param name Optional graph name.
   */
  toDot(name = "spine"): string {
    const lines: string[] = [
      `digraph ${JSON.stringify(name)} {`,
      "  rankdir=LR;",
    ];

    // Build a scope tree from all node IDs split by ":"
    const scopeChildren = new Map<string, Set<string>>();
    scopeChildren.set("", new Set());

    for (const id of this._nodes.keys()) {
      const parts = id.split(":");
      for (let i = 1; i <= parts.length; i++) {
        const scope = parts.slice(0, i).join(":");
        const parent = parts.slice(0, i - 1).join(":");
        if (!scopeChildren.has(parent)) scopeChildren.set(parent, new Set());
        scopeChildren.get(parent)!.add(scope);
        if (!scopeChildren.has(scope)) scopeChildren.set(scope, new Set());
      }
    }

    const renderScope = (scope: string, indent: string): void => {
      for (const child of scopeChildren.get(scope) ?? []) {
        const childChildren = scopeChildren.get(child);
        const hasChildren = (childChildren?.size ?? 0) > 0;
        const isNode = this._nodes.has(child);
        const label = child.split(":").pop()!;

        if (hasChildren || child.includes(":")) {
          lines.push(
            `${indent}subgraph ${JSON.stringify("cluster_" + child)} {`,
          );
          lines.push(`${indent}  label=${JSON.stringify(label)};`);
          if (isNode) {
            const node = this._nodes.get(child)!;
            const nodeLabel = `<${node.kind}>\n${label}`;
            lines.push(
              `${indent}  ${JSON.stringify(child)} [label=${JSON.stringify(nodeLabel)}, group=${JSON.stringify(node.kind)}];`,
            );
          }
          renderScope(child, indent + "  ");
          lines.push(`${indent}}`);
        } else if (isNode) {
          const node = this._nodes.get(child)!;
          const nodeLabel = `<${node.kind}>\n${label}`;
          lines.push(
            `${indent}${JSON.stringify(child)} [label=${JSON.stringify(nodeLabel)}, group=${JSON.stringify(node.kind)}];`,
          );
        }
      }
    };

    renderScope("", "  ");

    const moduleIds = [...this._nodes.entries()]
      .filter(([, node]) => node.kind === "module")
      .map(([id]) => JSON.stringify(id));
    if (moduleIds.length > 0) {
      lines.push(`  { rank=min; ${moduleIds.join("; ")}; }`);
    }

    for (const [from, toMap] of this._edges) {
      for (const [to, kinds] of toMap) {
        for (const kind of kinds) {
          lines.push(
            `  ${JSON.stringify(from)} -> ${JSON.stringify(to)} [label=${JSON.stringify(kind)}];`,
          );
        }
      }
    }

    lines.push("}");
    return lines.join("\n");
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

  private _assertResolved(edge: E): asserts edge is ResolvedEdge<E> {
    if (!edge.resolved) {
      throw new GraphError(
        "GRAPH_UNRESOLVED_EDGE",
        `Unresolved edge target: ${edge.to}`,
      );
    }
  }
}

export { Graph };
