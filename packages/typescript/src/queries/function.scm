;; function declaration
;; function @name<@type_params>(@params): s@return_type @body
(function_declaration
  name: (identifier) @name
  type_parameters: (type_parameters)? @type_params
  parameters: (formal_parameters) @params
  return_type: (type_annotation)? @return_type
  body: (statement_block) @body
) @function

;; arrow function / function expression
;; const @name = <@type_params>(@params): @return_type => @body
;; const @name = <@type_params>(@params): @return_type => @body
;; const @name = @params: @return_type => @body (single identifier param)
;; const @name = function <@type_params>(@params): @return_type @body
(lexical_declaration
  (variable_declarator
    name: (identifier) @name
    value: [
      (arrow_function
        type_parameters: (type_parameters)? @type_params
        parameters: [
          (formal_parameters)? @params
          (identifier)? @params
        ]
        return_type: (type_annotation)? @return_type
        body: [
          (statement_block) @body
          (expression) @body
        ]
      )
      (function_expression
        type_parameters: (type_parameters)? @type_params
        parameters: (formal_parameters) @params
        return_type: (type_annotation)? @return_type
        body: (statement_block) @body
      )
    ]
  )
) @function