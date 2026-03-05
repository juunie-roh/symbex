;; class declaration
;; class @name<@type_params> @heritage @body
;; @heritage = impelents @target, @target, ... || extends @target<@type_args>, @target, ...
(class_declaration
  ;; decorator: (decorator)* @decorator
  name: (type_identifier) @name
  (class_heritage)? @heritage
  type_parameters: (type_parameters)? @type_params
  body: (class_body) @body
) @class

;; abstract class declaration
;; abstract class @name<@type_params> @heritage @body
;; @heritage = impelents @target, @target, ... || extends @target<@type_args>, @target, ...
(abstract_class_declaration
  ;; decorator: (decorator)* @decorator
  name: (type_identifier) @name
  (class_heritage)? @heritage
  type_parameters: (type_parameters)? @type_params
  body: (class_body) @body
) @abstract_class

(class_body
  ;; decorator: (decorator)* @decorator
  ;; methods
  ;; @modifier @is_static @name<@type_params>(@params): @return_type @body
  (method_definition
    [
      (accessibility_modifier)
      (override_modifier)
    ]? @modifier
    ("static")? @is_static
    name: (_) @name
    type_parameters: (type_parameters)? @type_params
    parameters: (formal_parameters) @params
    return_type: (type_annotation)? @return_type
    body: (statement_block) @body
  )? @method

  ;; arrow function / function expression methods
  ;; @modifier @is_static @name = <@type_params>(@params): @return_type => @body
  (public_field_definition
    [
      (accessibility_modifier)
      (override_modifier)
    ]? @modifier
    ("static")? @is_static
    name: (_) @name
    value: [
      (arrow_function
        type_parameters: (type_parameters)? @type_params
        parameters: [(formal_parameters) (identifier)] @params
        return_type: (type_annotation)? @return_type
        body: [(statement_block) (expression)] @body
      )
      (function_expression
        type_parameters: (type_parameters)? @type_params
        parameters: (formal_parameters) @params
        return_type: (type_annotation)? @return_type
        body: (statement_block) @body
      )
    ]
  )? @method

  ;; field
  ;; @modifier @is_static @name: @type = @value;
  (public_field_definition
    [
      (accessibility_modifier)
      (override_modifier)
    ]? @modifier
    ("static")? @is_static
    name: (_) @name
    (type_annotation)? @type
    value: (_)? @value ;; filter out function_expression and arrow_expression types
  )? @field
)?