;; imports
;; import { @name as @alias } from "@source";
;; import * as @name from "@source";
;; import @name from "@source";
(import_statement
  (import_clause
    (named_imports 
      (import_specifier 
        name: (identifier) @name 
        alias: (identifier)? @alias
      )
    )?
    (namespace_import (identifier) @name)?
    (identifier)? @name
  )?
  source: (string (string_fragment) @source)
) @import