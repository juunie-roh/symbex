;; assigned iife

;; @kind = const/let
(lexical_declaration
  ["const" "let"] @kind
  (variable_declarator
    name: (_) @name
    value: [
      ;; standard iife, (function (){})()
      (call_expression
        function: (parenthesized_expression
                    [ 
                      ;; const/let x = (function () { @body })()
                      (function_expression body: (statement_block) @body)
                      ;; const/let x = (() => { @body })()
                      (arrow_function body: (statement_block) @body)
                    ]))
      ;; crockford style, (function (){}())                    
      (parenthesized_expression
        (call_expression
          function: [
            ;; const/let x = (function () {}());
            (function_expression body: (statement_block) @body)
            ;; const/let x = (() => {}());
            (arrow_function body: (statement_block) @body)
          ]))
      ;; method-style, (function () {}).call/apply(this)
      (call_expression
        function: (member_expression
                    object: (parenthesized_expression
                              [ 
                                ;; const/let x = (function () { @body }).call/apply(this)
                                (function_expression body: (statement_block) @body)
                                ;; const/let x = (() => { @body }).call/apply(this)
                                (arrow_function body: (statement_block) @body)
                              ])
                    property: (property_identifier) @c) (#any-of? @c "call" "apply"))
    ])
)

;; @kind = var
(variable_declaration
  "var" @kind
  (variable_declarator
    name: (_) @name
    value: [
      ;; standard, (function (){})()
      (call_expression
        function:
          (parenthesized_expression
            [ 
              ;; var x = (function () { @body })()
              (function_expression body: (statement_block) @body)
              ;; var x = (() => { @body })()
              (arrow_function body: (statement_block) @body)
            ]))
      ;; crockford style, (function (){}())
      (parenthesized_expression
        (call_expression
          function: [
            ;; var x = (function () {}());
            (function_expression body: (statement_block) @body)
            ;; var x = (() => {}());
            (arrow_function body: (statement_block) @body)
          ]))
      ;; method-style, (function () {}).call/apply(this)
      (call_expression
        function: (member_expression
                    object: (parenthesized_expression
                      [ 
                        ;; var x = (function () { @body }).call/apply(this)
                        (function_expression body: (statement_block) @body)
                        ;; var x = (() => { @body }).call/apply(this)
                        (arrow_function body: (statement_block) @body)
                      ])
                    property: (property_identifier) @c) (#any-of? @c "call" "apply"))
    ])
)