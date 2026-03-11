import { createCanonicalId } from "@juun-roh/spine/utils";

import type { Capture, Edge, Node } from "@/models";

function convertVariables(
  variables: Capture<"variable">[],
  parentId: string,
): { edges: Edge[]; nodes: Node[] } {
  const edges: Edge[] = [];
  const nodes: Node[] = [];

  const excludes = new Set([
    "arrow_function",
    "function_expression",
    "generator_function",
    "class",
  ]);

  for (const v of variables) {
    const id = createCanonicalId(parentId, v.name.text);

    const declarator = v.variable.namedChildren.find(
      (c) => c.type === "variable_declarator",
    );

    if (
      declarator?.childForFieldName("value")?.type &&
      excludes.has(declarator.childForFieldName("value")!.type)
    ) {
      continue;
    }

    edges.push({
      from: parentId,
      to: id,
      kind: "defines",
      resolved: true,
    } satisfies Edge);

    nodes.push({
      id,
      kind: "variable",
      range: {
        startIndex: v.variable.startIndex,
        endIndex: v.variable.endIndex,
        startPosition: v.variable.startPosition,
        endPosition: v.variable.endPosition,
      },
      props: {
        name: v.name.text,
        kind: v.kind.text,
        type: v.type?.text,
        alias_of: v.key?.text,
      },
    } satisfies Node);
  }

  return { edges, nodes };
}

export { convertVariables };
