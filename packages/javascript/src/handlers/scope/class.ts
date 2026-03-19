import { createChildPath, createConvertResult, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const classHandler: ConvertHandler<"class"> = (
  captures,
  parent,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    const { name, node, decorator, extends: ext, body } = c;
    const path = createChildPath(parent, name.text);
    result.edges.push({
      from: parent,
      to: path,
      kind: "defines",
    });
    result.nodes.push({
      path,
      type: "scope",
      kind: "class",
      at: getRange(node),
      props: {
        extends: ext?.text,
        decorator: decorator?.text,
      },
    });

    if (body) {
      result.push(convert(capture(body, "method"), path, "method"));
      result.push(convert(capture(body, "member"), path, "member"));
    }
  }

  return result;
};

export default classHandler;
