;; class declaration
;; @decorator
;; class @name extends @extends @body
(class_declaration
  decorator: (decorator)* @decorator
  name: (identifier) @name
  (class_heritage (expression) @extends)?
  body: (class_body) @body
) @node

;; edge case using lexical declaration:
;; const/let @name = @decorator class extends @extends @body
(lexical_declaration
  (variable_declarator
    name: (identifier) @name
    value: (class 
      (class_heritage (expression) @extends)?
      decorator: (decorator)* @decorator
      body: (class_body) @body
      ))
) @node