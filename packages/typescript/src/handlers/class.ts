import { createConvertResult, createSignature, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const classHandler: ConvertHandler<"class"> = (
  captures,
  parentId,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    const { name, node, type_params, extends: ext, implements: impl, body } = c;
    const sign = createSignature(parentId, name.text);
    result.edges.push({
      from: parentId,
      to: sign,
      kind: "defines",
    });
    result.nodes.push({
      signature: sign,
      type: "scope",
      kind: "class",
      range: getRange(node),
      props: {
        type_params: type_params?.text,
        extends: ext?.text,
        implements: impl?.text,
      },
    });

    if (body) {
      result.push(convert(capture(body, "method"), sign, "method"));
      result.push(convert(capture(body, "member"), sign, "member"));
    }
  }

  return result;
};

export default classHandler;
