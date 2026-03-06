import type { Node } from "@/models";
import { Edge } from "@/models";

import { GraphError } from "./error";
import { Graph } from "./graph";

type ResolvedEdge<E extends Edge> = E & {
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
  const i = id.lastIndexOf(":");
  return i > 0 ? id.slice(0, i) : undefined;
}

/**
 *
 */
function resolve<N extends Node = Node, E extends Edge = Edge>(
  graph: Graph<N, E>,
  edge: E,
): ResolvedEdge<E>;
/**
 *
 */
function resolve<N extends Node = Node, E extends Edge = Edge>(
  graph: Graph<N, E>,
  name: string,
  from: Node["id"],
): Node["id"];
function resolve<N extends Node = Node, E extends Edge = Edge>(
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
          if (targetId.endsWith(":" + name)) {
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

export { resolve };
export type { ResolvedEdge };
