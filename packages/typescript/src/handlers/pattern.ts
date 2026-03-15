import { createConvertResult, createSignature, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const patternHandler: ConvertHandler<"pattern"> = (
  captures,
  parentId,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    switch (c.node.type) {
      case "array_pattern":
        if (c.pattern)
          result.push(
            convert(capture(c.pattern, "pattern"), parentId, "pattern"),
          );
        break;
      case "identifier":
        const sign = createSignature(parentId, c.node.text);
        result.edges.push({
          from: parentId,
          to: sign,
          kind: "defines",
        });
        result.nodes.push({
          signature: sign,
          type: "binding",
          kind: "variable",
          range: getRange(c.node),
          props: {
            default: c.default?.text,
            alias_of: c.key?.text,
          },
        });
        break;
      case "object_pattern":
        if (c.name) {
          const sign = createSignature(parentId, c.node.text);
          result.edges.push({
            from: parentId,
            to: sign,
            kind: "defines",
          });
          result.nodes.push({
            signature: sign,
            type: "binding",
            kind: "variable",
            range: getRange(c.node),
          });
        }
        if (c.pattern) {
          result.push(
            convert(capture(c.pattern, "pattern"), parentId, "pattern"),
          );
        }
        break;
      case "rest_pattern":
        result.push(
          convert(capture(c.pattern!, "pattern"), parentId, "pattern"),
        );
        break;
    }
  }

  return result;
};
export default patternHandler;
