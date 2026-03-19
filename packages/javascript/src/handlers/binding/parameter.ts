import { createChildPath, createConvertResult, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const parameterHandler: ConvertHandler<"parameter"> = (
  captures,
  parent,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    if (c.name) {
      const path = createChildPath(parent, c.name.text);
      result.edges.push({ from: parent, to: path, kind: "defines" });
      result.nodes.push({
        path,
        type: "binding",
        kind: "parameter",
        at: getRange(c.name),
        props: { default: c.default?.text, alias_of: c.key?.text },
      });
    }

    if (c.pattern) {
      result.push(convert(capture(c.pattern, "pattern"), parent, "pattern"));
    }
  }

  return result;
};

export default parameterHandler;
