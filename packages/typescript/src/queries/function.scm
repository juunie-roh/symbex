;; function declaration
;; @is_async function @name@type_params@params: @return_type @body
;; @is_async function* @name@type_params@params: @return_type @body
(function_declaration
  "async"? @is_async
  name: (identifier) @name
  type_parameters: (type_parameters (type_parameter)+ @type_param)? @type_params
  parameters: (formal_parameters) @params
  return_type: (type_annotation (_) @return_type)?
  body: (statement_block) @body
)@function

(generator_function_declaration
  "async"? @is_async
  name: (identifier) @name
  type_parameters: (type_parameters (type_parameter)+ @type_param)?
  parameters: (formal_parameters) @params
  return_type: (type_annotation (_) @return_type)?
  body: (statement_block) @body
) @function

;; arrow function / function expression
;; const/let @name = @is_async @params: @return_type => @body
;; const/let @name = @is_async function @params: @return_type @body
(lexical_declaration
  (variable_declarator
    name: (identifier) @name
    value: [
      (arrow_function
        "async"? @is_async
        type_parameters: (type_parameters (type_parameter)+ @type_param)? @type_params
        parameters: [(formal_parameters) (identifier)] @params
        return_type: (type_annotation (_) @return_type)?
        body: (_) @body)
      (function_expression
        "async"? @is_async
        type_parameters: (type_parameters (type_parameter)+ @type_param)? @type_params
        parameters: (formal_parameters) @params
        return_type: (type_annotation (_) @return_type)?
        body: (statement_block) @body)
    ])
) @function

;; var @name = @is_async @params: @return_type => @body
;; var @name = @is_async function @params: @return_type @body
(variable_declaration
  (variable_declarator
    name: (identifier) @name
    value: [
      (arrow_function
        "async"? @is_async
        type_parameters: (type_parameters (type_parameter)+ @type_param)? @type_params
        parameters: [(formal_parameters) (identifier)] @params
        return_type: (type_annotation (_) @return_type)?
        body: (_) @body)
      (function_expression
        "async"? @is_async
        type_parameters: (type_parameters (type_parameter)+ @type_param)? @type_params
        parameters: (formal_parameters) @params
        return_type: (type_annotation (_) @return_type)?
        body: (statement_block) @body)
    ])
) @function