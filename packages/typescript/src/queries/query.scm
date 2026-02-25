(call_expression) @call

;; function declaration
;; function @name<@generics>(@params): @returnType { @body }
(function_declaration
    name: (identifier) @name
    type_parameters: (type_parameters)? @generics
    parameters: (formal_parameters) @params
    return_type: [
      (asserts_annotation)
      (type_annotation)
      (type_predicate_annotation)
    ]? @returnType
    body: (statement_block) @body
) @function

;; arrow function / function expression
;; const @name = <@generics>(@params): @returnType => @body
;; const @name = @params: @returnType => @body (single identifier param)
;; const @name = function <@generics>(@params): @returnType { @body }
(lexical_declaration
  (variable_declarator
    name: (identifier) @name
    value: [
      (
        arrow_function
          type_parameters: (type_parameters)? @generics
          parameters: [
            (formal_parameters)
            (identifier)
          ] @params
          return_type: [
            (asserts_annotation)
            (type_annotation)
            (type_predicate_annotation)
          ]? @returnType
          body: (_) @body
      )
      (
        function_expression
          type_parameters: (type_parameters)? @generics
          parameters: (formal_parameters) @params
          return_type: [
            (asserts_annotation)
            (type_annotation)
            (type_predicate_annotation)
          ]? @returnType
          body: (statement_block) @body
      )
    ]
  )
) @function

;; imports
;; import { @name } from @source;
;; import @name from @source;
;; import { @name as @alias } from @source;
;; import * as @name from @source;
(import_statement
  (import_clause
    (identifier)? @name
    (named_imports
      (import_specifier
        name: (identifier) @name
        alias: (identifier)? @alias
      )
    )?
    (namespace_import
      (identifier) @name
    )?
  )
  source: (string) @source
) @import

;; class declaration
;; @decorator class @name<@generics> @heritage {@body}
(class_declaration
  decorator: (decorator)? @decorator
  name: (type_identifier) @name
  (class_heritage)? @heritage
  type_parameters: (type_parameters)? @generics
  body: (class_body) @body
) @class

;; abstract class declaration
;; @decorator abstract class @name<@generics> @heritage {@body}
(abstract_class_declaration
  decorator: (decorator)? @decorator
  name: (type_identifier) @name
  (class_heritage)? @heritage
  type_parameters: (type_parameters)? @generics
  body: (class_body) @body
) @abstract_class