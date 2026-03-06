import TypeScript from "tree-sitter-typescript";

import { queryString } from "./query";

const language = TypeScript.tsx;

const capture = null;
const graphToDot = null;

export { capture };
export { convert } from "./convert.js";
export { graphToDot };
export { language, queryString };
