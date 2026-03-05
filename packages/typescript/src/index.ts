import { normalizeQuery } from "@juun-roh/spine/utils";
import TypeScript from "tree-sitter-typescript";

import query from "./queries/query.scm";

const queryString = normalizeQuery(query);

const language = TypeScript.typescript;

export { capture } from "./capture";
export { convert } from "./convert";
export { language, queryString };
export type * from "./models";
