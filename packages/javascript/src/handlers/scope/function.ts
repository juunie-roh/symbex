import { createChildPath, createConvertResult, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const functionHandler: ConvertHandler<"function"> = (
  captures,
  parent,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    const { name, node, params, body, is_async } = c;
    const path = createChildPath(parent, name.text);

    result.edges.push({
      from: parent,
      to: path,
      kind: "defines",
    });

    result.nodes.push({
      path,
      type: "scope",
      kind: "function",
      at: getRange(node),
      props: { is_async: !!is_async },
    });

    if (body) {
      result.push(convert(capture(body), path));
    }

    if (params) {
    }
  }

  return result;
};

export default functionHandler;
