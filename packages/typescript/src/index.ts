import TypeScript from "tree-sitter-typescript";

import { queryString } from "./query";

const language = TypeScript.typescript;

export { capture } from "./capture";
export { convert } from "./convert";
export { language, queryString };
export type * from "./models";
