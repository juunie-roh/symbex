import { createChildPath, createConvertResult, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const methodHandler: ConvertHandler<"method"> = (
  captures,
  parent,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();
  for (const c of captures) {
    const { name, node, body, is_async, is_static, params, decorator } = c;
    const path = createChildPath(parent, name.text);

    result.edges.push({
      from: parent,
      to: path,
      kind: "defines",
    });
    result.nodes.push({
      path,
      type: "scope",
      kind: "method",
      at: getRange(node),
      props: {
        name: name.text,
        is_static: is_static ? true : false,
        is_async: is_async ? true : false,
        params: params?.text,
        decorator: decorator?.text,
      },
    });

    if (body) {
      result.push(convert(capture(body), path));
    }
  }
  return result;
};

export default methodHandler;
