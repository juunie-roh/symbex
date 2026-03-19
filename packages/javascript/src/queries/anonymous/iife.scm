;; IIFE Immediately Invoked Function Expression

(expression_statement
  (call_expression
    function: (parenthesized_expression 
                [
                  ;; (function () @body)()
                  (function_expression body: (statement_block) @body)
                  ;; (() => @body)()
                  (arrow_function body: (statement_block) @body)
                ]))
) @node

(expression_statement
  (parenthesized_expression
    (call_expression
      function: (member_expression
                  object: [
                    ;; (function () @body.call(this))
                    (function_expression body: (statement_block) @body)
                    ;; (() => @body.call(this))
                    (arrow_function body: (statement_block) @body)
                  ]
                  property: (property_identifier) @call)
      arguments: (arguments (this))))
  (#eq? @call "call")
) @node