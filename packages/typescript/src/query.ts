import { build, normalize } from "@juun-roh/spine/utils/query";

import classQuery from "./queries/class.scm";
import errorQuery from "./queries/error.scm";
import functionQuery from "./queries/function.scm";
import importQuery from "./queries/import.scm";

const queries: Record<string, string> = {
  class: normalize(classQuery),
  error: normalize(errorQuery),
  function: normalize(functionQuery),
  import: normalize(importQuery),
};

const queryString = build(classQuery, errorQuery, functionQuery, importQuery);

export { queries, queryString };
