;; methods
;; @modifier @is_static @is_async @name@type_params@params: @return_type @body
(method_definition
  [(accessibility_modifier) (override_modifier)]? @modifier
  "static"? @is_static
  "async"? @is_async
  name: (property_identifier) @name
  type_parameters: (type_parameters)? @type_params
  parameters: (formal_parameters) @params
  return_type: (type_annotation (_) @return_type)?
  body: (statement_block) @body
  (#not-match? @name "^(constructor)$")
) @method

;; arrow function / function expression methods
;; @modifier @is_static @name = @is_async @type_params@params: @return_type => @body
;; @modifier @is_static @name = @is_async function @type_params@params @body
(public_field_definition
  [(accessibility_modifier) (override_modifier)]? @modifier
  "static"? @is_static
  name: (property_identifier) @name
  value: [
    (arrow_function
      "async"? @is_async
      type_parameters: (type_parameters)? @type_params
      parameters: [(formal_parameters) (identifier)] @params
      return_type: (type_annotation (_) @return_type)?
      body: (_) @body)
    (function_expression
      "async"? @is_async
      type_parameters: (type_parameters)? @type_params
      parameters: (formal_parameters) @params
      return_type: (type_annotation (_) @return_type)?
      body: (statement_block) @body)
  ]
) @method