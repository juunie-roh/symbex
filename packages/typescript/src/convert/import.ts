import { createCanonicalId } from "@juun-roh/spine/utils";

import type { Capture, Edge, Node } from "@/types";

function convertImports(
  captures: Capture<"import">[],
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
    if (!sources.has(source.text)) {
      sources.add(source.text);
    }

    const representative = alias ? alias.text : name.text;

    if (representative) {
      // defines
      const defId = createCanonicalId(parentId, representative);
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
              alias_of: name.text,
              source: source.text,
            }
          : undefined,
      } satisfies Node);
    }

    // import relationship
    edges.push({
      from: parentId,
      to: source.text,
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
