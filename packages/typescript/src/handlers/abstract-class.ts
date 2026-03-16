import { createChildPath, createConvertResult, getRange } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const abstractClassHandler: ConvertHandler<"abstract_class"> = (
  captures,
  parent,
  { capture, convert },
) => {
  const result = createConvertResult<Node, Edge>();

  for (const c of captures) {
    const { name, node, body, extends: ext, implements: impl, type_params } = c;
    const path = createChildPath(parent, name.text);
    result.edges.push({
      from: parent,
      to: path,
      kind: "defines",
    });
    result.nodes.push({
      path,
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
        convert(capture(body, "abstract_method"), path, "abstract_method"),
      );
      result.push(convert(capture(body, "method"), path, "method"));
      result.push(convert(capture(body, "member"), path, "member"));
    }
  }

  return result;
};

export default abstractClassHandler;
