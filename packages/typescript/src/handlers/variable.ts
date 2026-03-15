import { createConvertResult, createSignature, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const variableHandler: ConvertHandler<"variable"> = (
  captures,
  parentId,
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
    const { pattern, node, kind, type, name } = c;

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
      const sign = createSignature(parentId, name.text);
      result.edges.push({
        from: parentId,
        to: sign,
        kind: "defines",
      });
      result.nodes.push({
        signature: sign,
        type: "binding",
        kind: "variable",
        range: getRange(node),
        props: {
          kind: kind.text,
          type: type?.text,
        },
      });
    } else if (pattern) {
      result.push(convert(capture(pattern, "pattern"), parentId, "pattern"));
    }
  }

  return result;
};

export default variableHandler;
