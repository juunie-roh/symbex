;; require, CJS
;; @kind = "const" | "let"
(lexical_declaration
  ["const" "let"] @kind
  ;; const/let @name = require("@source");
  (variable_declarator
    name: (_) @name
    value: (call_expression
        function: (identifier) @req (#eq? @req "require")
        arguments: (string (string_fragment) @source)))
)
;; @kind = var
(variable_declaration
  "var" @kind
  ;; var @name = require("@source");
  (variable_declarator
    name: (_) @name
    value: (call_expression
        function: (identifier) @req (#eq? @req "require")
        arguments: (string (string_fragment) @source)))
)