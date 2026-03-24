import { QueryMap } from "symbex/query";
import type Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";

// anonymous
import ifQueryString from "@/queries/anonymous/if.scm";
import iifeQueryString from "@/queries/anonymous/iife.scm";
// binding
import importQueryString from "@/queries/binding/import.scm";
import memberQueryString from "@/queries/binding/member.scm";
import variableQueryString from "@/queries/binding/variable.scm";
// bypass
import exportBypassString from "@/queries/bypass/export.scm";
// scope
import classQueryString from "@/queries/scope/class.scm";
import functionQueryString from "@/queries/scope/function.scm";
import methodQueryString from "@/queries/scope/method.scm";

// utility
import { BypassQueryKey, QueryConfig } from "./types";

export const language = JavaScript as Parser.Language;

export const query = new QueryMap<keyof QueryConfig>(language)
  // anonymous
  .set("if", ifQueryString)
  .set("iife", iifeQueryString)
  // binding
  .set("import", importQueryString)
  .set("member", memberQueryString)
  .set("variable", variableQueryString)
  // scope
  .set("class", classQueryString)
  .set("function", functionQueryString)
  .set("method", methodQueryString);

export const bypass = new QueryMap<BypassQueryKey>(language).set(
  "export",
  exportBypassString,
);
