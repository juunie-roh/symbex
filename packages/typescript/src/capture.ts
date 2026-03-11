import { createCapture } from "@juun-roh/spine/utils";

import { QueryTag } from "./models";
import { query } from "./query";

const capture = createCapture<QueryTag>(query, {
  function: { include: "export_statement" },
  class: { include: "export_statement" },
  variable: { include: "export_statement" },
});

export { capture };
