import { createChildPath, createConvertResult, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const patternHandler: ConvertHandler<"pattern"> = (
  captures,
  parent,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    switch (c.node.type) {
      case "array_pattern":
        if (c.pattern)
          result.push(
            convert(capture(c.pattern, "pattern"), parent, "pattern"),
          );
        break;
      case "identifier":
        const path = createChildPath(parent, c.node.text);
        result.edges.push({
          from: parent,
          to: path,
          kind: "defines",
        });
        result.nodes.push({
          path,
          type: "binding",
          kind: "variable",
          at: getRange(c.node),
          props: {
            default: c.default?.text,
            alias_of: c.key?.text,
          },
        });
        break;
      case "object_pattern":
        if (c.name) {
          const path = createChildPath(parent, c.node.text);
          result.edges.push({
            from: parent,
            to: path,
            kind: "defines",
          });
          result.nodes.push({
            path,
            type: "binding",
            kind: "variable",
            at: getRange(c.node),
          });
        }
        if (c.pattern) {
          result.push(
            convert(capture(c.pattern, "pattern"), parent, "pattern"),
          );
        }
        break;
      case "rest_pattern":
        result.push(convert(capture(c.pattern!, "pattern"), parent, "pattern"));
        break;
    }
  }

  return result;
};
export default patternHandler;
