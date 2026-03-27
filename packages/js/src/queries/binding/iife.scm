;; assigned iife

;; @kind = const/let
(lexical_declaration
  ["const" "let"] @kind
  (variable_declarator
    name: (_) @name
    value: [
      ;; const/let x = (function () { @body })()
      ;; const/let x = (() => { @body })()
      (call_expression
        function: (parenthesized_expression
                    [ 
                      (function_expression body: (statement_block) @body)
                      (arrow_function body: (statement_block) @body)
                    ]))

      ;; const/let x = (function () { @body }).call()
      ;; const/let x = (() => { @body }).call()
      (call_expression
        function: (member_expression
                    object: (parenthesized_expression
                              [ 
                                (function_expression body: (statement_block) @body)
                                (arrow_function body: (statement_block) @body)
                              ])
                    property: (property_identifier) @call (#eq? @call "call")))

    ])
)

;; @kind = var
(variable_declaration
  "var" @kind
  (variable_declarator
    name: (_) @name
    value: [
      ;; var x = (function () { @body })()
      ;; var x = (() => { @body })()
      (call_expression
        function: (parenthesized_expression
                    [ 
                      (function_expression body: (statement_block) @body)
                      (arrow_function body: (statement_block) @body)
                    ]))

      ;; var x = (function () { @body }).call()
      ;; var x = (() => { @body }).call()
      (call_expression
        function: (member_expression
                    object: (parenthesized_expression
                              [ 
                                (function_expression body: (statement_block) @body)
                                (arrow_function body: (statement_block) @body)
                              ])
                    property: (property_identifier) @call (#eq? @call "call")))

    ])
)