import { createCanonicalId } from "@juun-roh/spine/utils";

import { capture } from "@/capture";
import type { Capture, Edge, Node } from "@/models";

import { convert } from "./convert";

function convertFunctions(
  functions: Capture<"function">[],
  parentId: string,
): {
  edges: Edge[];
  nodes: Node[];
} {
  const edges: Edge[] = [];
  const nodes: Node[] = [];

  for (const func of functions) {
    const range: NonNullable<Node["range"]> = {
      startIndex: func.function.startIndex,
      endIndex: func.function.endIndex,
      startPosition: func.function.startPosition,
      endPosition: func.function.endPosition,
    };

    const id = createCanonicalId(parentId, func.name.text);

    edges.push({
      from: parentId,
      to: id,
      kind: "defines",
      resolved: true,
    } satisfies Edge);

    nodes.push({
      id,
      kind: "function",
      range,
      props: {
        name: func.name.text,
        type_params: func.type_params?.text,
        params: func.params?.text,
        return_type: func.return_type?.text,
      },
    } satisfies Node);

    if (func.body) {
      const nested = convert(capture(func.body), id);
      edges.push(...nested.edges);
      nodes.push(...nested.nodes);
    }
  }

  return { edges, nodes };
}

export { convertFunctions };
