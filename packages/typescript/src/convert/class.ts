import type { Capture, Edge, Node } from "@/models";

import { convert } from "./convert";

function convertClasses(
  classes: Capture.Class[],
  parentId: string,
): {
  edges: Edge[];
  nodes: Node[];
} {
  const edges: Edge[] = [];
  const nodes: Node[] = [];

  for (const cls of classes) {
    const range: Node["range"] = {
      startIndex: cls.node.startIndex,
      endIndex: cls.node.endIndex,
      startPosition: cls.node.startPosition,
      endPosition: cls.node.endPosition,
    };

    edges.push({
      from: parentId,
      to: cls.id,
      kind: "defines",
    } satisfies Edge);

    nodes.push({
      id: cls.id,
      kind: "class",
      range,
      meta: {
        name: cls.name,
        type_params: cls.type_params,
        extends: cls.extends,
        implements: cls.implements,
      },
    } satisfies Node);

    if (cls.body) {
      const nested = convert(cls.body, cls.id);
      edges.push(...nested.edges);
      nodes.push(...nested.nodes);
    }
  }

  return { edges, nodes };
}

export { convertClasses };
