import type { Capture, Edge, Node } from "@/models";

function convertImports(
  captures: Capture.Import[],
  parentId: string,
): {
  edges: Edge[];
  nodes: Node[];
} {
  const edges: Edge[] = [];
  const nodes: Node[] = [];
  const sources = new Set<string>();

  for (const captured of captures) {
    const { source, name, type, alias } = captured;
    if (!sources.has(source)) {
      sources.add(source);
    }

    const representative = alias ? alias : name;
    const defId = `${parentId}:${representative}`;

    if (representative) {
      // defines
      edges.push({
        from: parentId,
        to: defId,
        kind: "defines",
        resolved: true,
      } satisfies Edge);

      nodes.push({
        id: defId,
        kind: "variable",
        props: alias
          ? {
              alias_of: name,
            }
          : undefined,
      } satisfies Node);
    }

    // import relationship
    edges.push({
      from: representative ? defId : parentId,
      to: source,
      kind: "imports",
      resolved: true,
      props: type
        ? {
            type,
          }
        : undefined,
    } satisfies Edge);
  }

  // deduplicated source nodes
  sources.forEach((source) => {
    nodes.push({
      id: source,
      kind: "module",
    } satisfies Node);
  });

  return { edges, nodes };
}

export { convertImports };
