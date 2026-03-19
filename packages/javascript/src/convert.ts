import iifeHandler from "./handlers/anonymous/iife";
import importHandler from "./handlers/binding/import";
import memberHandler from "./handlers/binding/member";
import parameterHandler from "./handlers/binding/parameter";
import variableHandler from "./handlers/binding/variable";
import classHandler from "./handlers/scope/class";
import functionHandler from "./handlers/scope/function";
import methodHandler from "./handlers/scope/method";
import patternHandler from "./handlers/utility/pattern";
import type { ConvertConfig } from "./types";

export const convertConfig = {
  iife: iifeHandler,
  import: importHandler,
  member: memberHandler,
  parameter: parameterHandler,
  variable: variableHandler,
  class: classHandler,
  function: functionHandler,
  method: methodHandler,
  pattern: patternHandler,
} as const satisfies ConvertConfig;
