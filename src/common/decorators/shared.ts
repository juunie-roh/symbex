/** A class constructor, including abstract classes. */
export type AbstractConstructor = abstract new (...args: any[]) => any;

/** A class method signature parameterized by `this`, argument tuple, and return type. */
export type ClassMethod<This, Args extends unknown[], Return> = (
  this: This,
  ...args: Args
) => Return;
