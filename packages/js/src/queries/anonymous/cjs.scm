;; CJS, require
;; unassigned require
;; require("@source");
(expression_statement
  (call_expression
    function: (identifier) @req (#eq? @req "require")
    arguments: (string (string_fragment) @source))
)