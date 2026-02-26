import TypeScript from "tree-sitter-typescript";

const queryString: string = require("./queries/query.scm");

const language = TypeScript.tsx;

const capture = null;

export { capture };
export { convert } from "./convert.js";
export { language, queryString };
