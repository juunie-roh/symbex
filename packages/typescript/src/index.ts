import TypeScript from "tree-sitter-typescript";

// biome-ignore lint/suspicious/noCommonJs: esbuild text loader bundles this as a string at build time
const queryString: string = require("./queries/query.scm");

const language = TypeScript.typescript;

export { capture } from "./capture";
export { convert } from "./convert";
export { language, queryString };
export type * from "./models";
