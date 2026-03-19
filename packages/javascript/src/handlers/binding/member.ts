import { createChildPath, createConvertResult, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const memberHandler: ConvertHandler<"member"> = (captures, parent) => {
  const result = createConvertResult<Node, Edge>();
  for (const c of captures) {
    const { name, node, is_static, decorator } = c;
    const path = createChildPath(parent, name.text);

    result.edges.push({
      from: parent,
      to: path,
      kind: "defines",
    });
    result.nodes.push({
      path,
      type: "binding",
      kind: "member",
      at: getRange(node),
      props: {
        is_static: is_static ? true : false,
        decorator: decorator?.text,
      },
    });
  }

  return result;
};

export default memberHandler;
