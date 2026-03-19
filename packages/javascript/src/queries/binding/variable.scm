;; variable declarations

;; @kind = "const" | "let"
(lexical_declaration
  [("const") ("let")] @kind
  (variable_declarator
    name: [
      ;; @kind @name = @body
      (identifier) @name
      ;; @kind [ @name, @name ] = @body
      (array_pattern) @pattern
      ;; @kind { @name, @value: @name } = @body
      (object_pattern) @pattern
    ])
) @node

;; @kind = "var"
(variable_declaration
  ("var") @kind
  (variable_declarator
    name: [
      (identifier) @name
      (array_pattern) @pattern
      (object_pattern) @pattern
    ])
) @node