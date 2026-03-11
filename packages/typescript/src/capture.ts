import { createCapture } from "@juun-roh/spine/utils";

import { query } from "./query";
import { QueryTag } from "./types";

const capture = createCapture<QueryTag>(query, {
  function: { include: "export_statement" },
  class: { include: "export_statement" },
  variable: { include: "export_statement" },
});

export { capture };
