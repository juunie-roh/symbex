;; function declaration
;; @is_async function @name@params @body
(function_declaration
  "async"? @is_async
  name: (identifier) @name
  parameters: (formal_parameters) @params
  body: (statement_block) @body
)@node
;; @is_async function* @name@params @body
(generator_function_declaration
  "async"? @is_async
  name: (identifier) @name
  parameters: (formal_parameters) @params
  body: (statement_block) @body
) @node

;; arrow function / function expression
;; const/let @name = @is_async @params: @return_type => @body
;; const/let @name = @is_async function @params: @return_type @body
(lexical_declaration
  (variable_declarator
    name: (identifier) @name
    value: [
      (arrow_function
        "async"? @is_async
        parameters: [(formal_parameters) (identifier)] @params
        body: (_) @body)
      (function_expression
        "async"? @is_async
        parameters: (formal_parameters) @params
        body: (statement_block) @body)
    ])
) @node

;; var @name = @is_async @params => @body
;; var @name = @is_async function @params @body
(variable_declaration
  (variable_declarator
    name: (identifier) @name
    value: [
      (arrow_function
        "async"? @is_async
        parameters: [(formal_parameters) (identifier)] @params
        body: (_) @body)
      (function_expression
        "async"? @is_async
        parameters: (formal_parameters) @params
        body: (statement_block) @body)
    ])
) @node