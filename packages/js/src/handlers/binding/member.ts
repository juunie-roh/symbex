import { createChildPath, createConvertResult, getRange } from "letant/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

import { getDecorators } from "../utility/decorator";

const memberHandler: ConvertHandler<"member"> = (captures, parent) => {
  const result = createConvertResult<Node, Edge>();
  for (const c of captures) {
    const { name, node, is_static, decorator } = c;
    const path = createChildPath(parent, name.text);
    const decorators = decorator
      ? getDecorators(decorator)
          .map((d) => d.text)
          .join(", ")
      : undefined;

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
        decorator: decorators,
      },
    });
  }

  return result;
};

export default memberHandler;
