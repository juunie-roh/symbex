import ifHandler from "./handlers/anonymous/if";
import iifeHandler from "./handlers/anonymous/iife";
import cjsBindingHandler from "./handlers/binding/cjs";
import esmBindingHandler from "./handlers/binding/esm";
import iifeBindingHandler from "./handlers/binding/iife";
import memberHandler from "./handlers/binding/member";
import variableHandler from "./handlers/binding/variable";
import classHandler from "./handlers/scope/class";
import functionHandler from "./handlers/scope/function";
import methodHandler from "./handlers/scope/method";
import type { ConvertConfig } from "./types";

export const convertConfig: ConvertConfig = {
  if: ifHandler,
  "iife.anonymous": iifeHandler,
  "cjs.binding": cjsBindingHandler,
  "esm.binding": esmBindingHandler,
  "iife.binding": iifeBindingHandler,
  member: memberHandler,
  variable: variableHandler,
  class: classHandler,
  function: functionHandler,
  method: methodHandler,
} as const;
