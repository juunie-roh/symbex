import { QueryMap } from "letant/query";
import type Parser from "tree-sitter";
import JavaScript from "tree-sitter-javascript";

// anonymous
import ifQueryString from "@/queries/anonymous/if.scm";
import iifeAnonymousQueryString from "@/queries/anonymous/iife.scm";
// binding
import cjsBindingQueryString from "@/queries/binding/cjs.scm";
import esmBindingQueryString from "@/queries/binding/esm.scm";
import iifeBindingQueryString from "@/queries/binding/iife.scm";
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
  .set("iife.anonymous", iifeAnonymousQueryString)
  // binding
  .set("cjs.binding", cjsBindingQueryString)
  .set("esm.binding", esmBindingQueryString)
  .set("iife.binding", iifeBindingQueryString)
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
