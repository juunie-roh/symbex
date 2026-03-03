/* eslint-disable unused-imports/no-unused-imports */
/* eslint-disable unused-imports/no-unused-vars */

/* =========================
   Import Statements
========================= */
// @ts-expect-error: mock import source
import default_module from "default-import-source";
// @ts-expect-error: mock import source
import with_attribute from "import-attr-source" with { type: "json" };
import mixed_default_module, {
  mixed_named_import_1,
  mixed_named_import_2 as mixed_import_alias_2,
  // @ts-expect-error: mock import source
} from "mixed-import-source_1";
// @ts-expect-error: mock import source
import mixed_default_module_2, * as mixed_namespace from "mixed-import-source_2";
// @ts-expect-error: mock import source
import { default as default_module_alias } from "named-import-default";
import {
  named_import_1,
  named_import_2,
  named_import_3,
  named_import_4 as aliased_named_import_4,
  // @ts-expect-error: mock import source
} from "named-import-source";
// @ts-expect-error: mock import source
import * as namespace_alias from "namespace-import-source";

/* =========================
   Functions
========================= */
function function_declaration() {}
function function_declaration_with_params(params: any) {}
function function_declaration_with_generics<T>(params: T) {}
function function_declaration_with_native_return_type(): any {}
function function_declaration_with_optional_param(a: number, b?: string) {}
function function_declaration_with_default_param(a: number, b = 0) {}
function function_declaration_with_rest_params(...args: number[]) {}
function function_declaration_with_multiple_generics<T, U>(a: T, b: U): [T, U] {
  return [a, b];
}
function function_declaration_with_generic_constraint<T extends object>(
  a: T,
): T {
  return a;
}
function function_declaration_with_overloads(a: number): number;
function function_declaration_with_overloads(a: string): string;
function function_declaration_with_overloads(a: any): any {}
function function_declaration_with_function_calls() {
  function_declaration();
  function_declaration_with_params(function_declaration());
  function_declaration_with_params(() => {});
}
async function async_function_declaration() {}
function* generator_function_declaration() {}

const assigned_function = function () {};
const assigned_function_with_params = function (params: any) {};
const assigned_function_named = function named_fn() {};
const arrow_function = () => {};
const arrow_function_with_params = (a: number, b: string) => {};
const arrow_function_with_return = (a: number): number => a;
const arrow_function_with_body = (a: number): number => {
  return a * 2;
};
const async_arrow_function = async () => {};
const arrow_function_with_generics = <T>(a: T): T => a;

(function () {})();
(function iife() {})();

/* =========================
   Nested Declarations
========================= */
function nested_function() {
  function nested_function2() {
    function nested_function3() {
      function nested_function4() {
        function nested_function5() {}
      }
    }
  }
}

/* =========================
   Exported Declarations
========================= */

export function exported_function() {}

/* =========================
   Call Expressions
========================= */
function_declaration();
function_declaration_with_params(1);
function_declaration_with_optional_param(1, "a");
function_declaration_with_generics<number>(1);
function_declaration_with_multiple_generics<number, string>(1, "a");
z<string>("a");

const call_result = function_declaration_with_native_return_type();
const chained_call = assigned_function_named();
const nested_call = function_declaration_with_params(
  function_declaration_with_native_return_type(),
);
const spread_call = function_declaration_with_rest_params(...[1, 2, 3]);
const optional_call = (null as unknown as typeof function_declaration)?.();

/* =========================
   Primitive Types
========================= */
let a: number = 1;
let b: string = "s";
let c: boolean = true;
let d: null = null;
let e: undefined = undefined;
let f: symbol = Symbol("f");
let g: bigint = 1n;

/* =========================
   Arrays & Tuples
========================= */
let h: number[] = [1, 2];
let i: Array<string> = ["a", "b"];
let j: [number, string?, boolean?] = [1, "x", true];

/* =========================
   Enums
========================= */
enum k {
  A,
  B = 5,
  C,
}
const l: k = k.C;

/* =========================
   Any / Unknown / Never / Void
========================= */
let m: any = 1;
let n: unknown = "x";
function named_function_declaration(): void {}
export function exported_named_function_declaration(): never {
  throw new Error("x");
}

/* =========================
   Type Aliases
========================= */
type q = number | string;
type r = { a: number; b?: string };
type s<T> = T[];

/* =========================
   Interfaces
========================= */
interface t {
  a: number;
  b?: string;
  c(): void;
}

/* =========================
   Intersection & Union
========================= */
type u = { a: number } & { b: string };
type v = number | string | boolean;

/* =========================
   Literal Types
========================= */
let w: "a" | "b" = "a";

/* =========================
   Functions
========================= */
function named_function_declaration_with_params(
  a: number,
  b = 1,
  ...c: number[]
): number {
  named_function_declaration();
  return a + b + c.length;
}

const named_arrow_function = (a: number): number => a * 2;

/* =========================
   Generics
========================= */
function z<T>(a: T): T {
  return a;
}

interface A<T = number> {
  a: T;
}

type B<T extends number> = T;

/* =========================
   Classes
========================= */
class class_declaration {
  static static = 1;
  readonly readonly: number;
  private private: string;
  protected protected: boolean;

  constructor(b: number, c: string, d: boolean) {
    this.readonly = b;
    this.private = c;
    this.protected = d;
  }

  e(): string {
    return this.private;
  }

  private private_method(this: class_declaration): this is number {
    return typeof this === "number";
  }

  private static private_static_method = () => this.static;
}

class D extends class_declaration implements A {
  a = 1;
}

const obj = new class_declaration(1, "a", true);
const obj_call = obj.e();

/* =========================
   Abstract Class
========================= */
abstract class abstract_class_declaration {
  abstract abstract_method(): void;
  private static private_static_method() {}
  abstract abstract_arrow: () => void;
  protected abstract protected_abstract(): void;
}

/* =========================
   Accessors
========================= */
class class_declaration_with_accessors {
  private a = 0;
  get b() {
    return this.a;
  }
  set b(v: number) {
    this.a = v;
  }
}

/* =========================
   Index Signatures
========================= */
interface G {
  [a: string]: number;
}

/* =========================
   Readonly / Utility Types
========================= */
type H = Readonly<r>;
type I = Partial<r>;
type J = Required<r>;
type K = Pick<r, "a">;
type L = Omit<r, "b">;
type M = Record<string, number>;

/* =========================
   Conditional Types
========================= */
type N<T> = T extends string ? number : boolean;

/* =========================
   Infer
========================= */
type O<T> = T extends Array<infer U> ? U : never;

/* =========================
   Mapped Types
========================= */
type P<T> = {
  [K in keyof T]: T[K];
};

/* =========================
   Keyof / typeof
========================= */
const Q = { a: 1, b: "x" };
type R = keyof typeof Q;

/* =========================
   Assertions
========================= */
let S = "x" as string;
let T = <number>(<unknown>"1");

/* =========================
   Non-null Assertion
========================= */
let U!: number;
U = 1;

/* =========================
   Optional Chaining & Nullish Coalescing
========================= */
let V: r | null = null;
// @ts-expect-error
let W = V?.a ?? 0;

/* =========================
   Discriminated Union
========================= */
type X = { a: "x"; b: number } | { a: "y"; c: string };

/* =========================
   Type Guards
========================= */
function Y(a: v): a is number {
  return typeof a === "number";
}

/* =========================
   Namespace
========================= */
namespace Z {
  export const a = 1;
}

/* =========================
   Modules / Imports / Exports
========================= */
export { aliased_named_import_4 }; // re-exports
// @ts-expect-error: mock import source
export * from "import-source";
export { a, b, named_function_declaration_with_params as x };
export default class_declaration;
