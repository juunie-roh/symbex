import type { NodeSignature } from "symbex";
import { createConvertResult, createSignature } from "symbex/utils";

import type { ConvertHandler, Edge, Node } from "@/types";

const importHandler: ConvertHandler<"import"> = (captures, parentId) => {
  const result = createConvertResult<Node, Edge>();
  const sources = new Set<string>();

  for (const c of captures) {
    const { source, name, alias, is_type } = c;
    if (!sources.has(source.text)) {
      sources.add(source.text);
    }

    const representative = alias?.text ?? name?.text ?? undefined;
    const isType = is_type ? true : false;

    if (representative) {
      const sign = createSignature(parentId, representative);
      result.edges.push({
        from: parentId,
        to: sign,
        kind: "defines",
      });
      result.nodes.push({
        signature: sign,
        type: "binding",
        kind: isType ? "type" : "variable",
        props: alias
          ? {
              alias_of: name!.text,
              is_type: isType,
              source: source.text,
            }
          : undefined,
      });
    }
  }

  sources.forEach((source) => {
    result.edges.push({
      from: parentId,
      to: source as NodeSignature,
      kind: "imports",
    });

    result.nodes.push({
      signature: source as NodeSignature,
      type: "scope",
      kind: "module",
    });
  });

  return result;
};

export default importHandler;
