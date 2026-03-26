import { captureConfig } from "./capture";
import { convertConfig } from "./convert";
import flatExpression from "./handlers/utility/expression";
import { language, query } from "./query";
import type { Descriptor } from "./types";

export const descriptor: Descriptor = {
  language,
  query,
  captureConfig,
  convertConfig,
  references(node) {
    return node ? node.namedChildren.flatMap((c) => flatExpression(c)) : [];
  },
};

export default descriptor;
