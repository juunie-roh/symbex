import { createConvertResult, createSignature, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const memberHandler: ConvertHandler<"member"> = (captures, parentId) => {
  const result = createConvertResult<Node, Edge>();
  for (const c of captures) {
    const { name, node, modifier, is_static, type } = c;
    const sign = createSignature(parentId, name.text);

    result.edges.push({
      from: parentId,
      to: sign,
      kind: "defines",
    });
    result.nodes.push({
      signature: sign,
      type: "binding",
      kind: "member",
      range: getRange(node),
      props: {
        modifier: modifier?.text,
        is_static: is_static ? true : false,
        type: type?.text,
      },
    });
  }

  return result;
};

export default memberHandler;
