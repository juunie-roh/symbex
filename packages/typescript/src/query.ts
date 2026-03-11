import { QueryMap } from "@juun-roh/spine/query";
import type TSParser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";

import type { QueryTag } from "@/models";
import classQueryString from "@/queries/class.scm";
import functionQueryString from "@/queries/function.scm";
import importQueryString from "@/queries/import.scm";
import memberQueryString from "@/queries/member.scm";
import methodQueryString from "@/queries/method.scm";
import variableQueryString from "@/queries/variable.scm";

const language = TypeScript.typescript as TSParser.Language;

const query = new QueryMap<keyof QueryTag>(language)
  .set("function", functionQueryString)
  .set("import", importQueryString)
  .set("class", classQueryString)
  .set("method", methodQueryString)
  .set("member", memberQueryString)
  .set("variable", variableQueryString);

export { language, query };
