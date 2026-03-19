import { createChildPath, createConvertResult, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const variableHandler: ConvertHandler<"variable"> = (
  captures,
  parent,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();
  const excludes = new Set([
    "arrow_function",
    "function_expression",
    "generator_function",
    "class",
  ]);

  for (const c of captures) {
    const { pattern, node, kind, name } = c;

    const declarator = node.namedChildren.find(
      (c) => c.type === "variable_declarator",
    );
    // exclude value node types:
    if (
      declarator?.childForFieldName("value")?.type &&
      excludes.has(declarator.childForFieldName("value")!.type)
    ) {
      continue;
    }

    if (name) {
      const path = createChildPath(parent, name.text);
      result.edges.push({
        from: parent,
        to: path,
        kind: "defines",
      });
      result.nodes.push({
        path,
        type: "binding",
        kind: "variable",
        at: getRange(node),
        props: { kind: kind.text },
      });
    } else if (pattern) {
      result.push(convert(capture(pattern, "pattern"), parent, "pattern"));
    }
  }

  return result;
};

export default variableHandler;
