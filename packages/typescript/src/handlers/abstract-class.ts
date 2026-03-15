import { createConvertResult, createSignature, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const abstractClassHandler: ConvertHandler<"abstract_class"> = (
  captures,
  parentId,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    const { name, node, body, extends: ext, implements: impl, type_params } = c;
    const sign = createSignature(parentId, name.text);
    result.edges.push({
      from: parentId,
      to: sign,
      kind: "defines",
    });
    result.nodes.push({
      signature: sign,
      type: "scope",
      kind: "abstract_class",
      range: getRange(node),
      props: {
        type_params: type_params?.text,
        extends: ext?.text,
        implements: impl?.text,
      },
    });

    if (body) {
      result.push(
        convert(capture(body, "abstract_method"), sign, "abstract_method"),
      );
      result.push(convert(capture(body, "method"), sign, "method"));
      result.push(convert(capture(body, "member"), sign, "member"));
    }
  }

  return result;
};

export default abstractClassHandler;
