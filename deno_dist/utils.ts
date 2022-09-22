// Like Reflect.ownKeys but returns entries like Object.entries
export const ownEntries = <T>(
  obj: { [key: string | symbol]: T } | ArrayLike<T>
): [string | symbol, T][] =>
  Reflect.ownKeys(obj).map((key) => [key, (obj as any)[key]]);

// Like Object.entries but returns enumerable symbols
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Enumerability_and_ownership_of_properties#detection_table
export const ownEnumerableEntries = <T>(
  obj: { [key: string | symbol]: T } | ArrayLike<T>
): [string | symbol, T][] =>
  ownEntries(obj).filter(([key]) => obj.propertyIsEnumerable(key));

export const lowerFirst = (str: string) =>
  str.charAt(0).toLowerCase() + str.substring(1, str.length);

// https://developer.mozilla.org/en-US/docs/Glossary/Primitive
// https://github.com/jonschlinkert/is-primitive
export const isPrimitiveValue = (
  val: unknown
): val is string | number | bigint | boolean | undefined | symbol | null => {
  if (typeof val === 'object') {
    return val === null;
  }
  return typeof val !== 'function';
};

// https://github.com/sindresorhus/is-plain-obj/blob/6a4cfe72714db0b90fcf6e1f78a9b118b98d44fa/index.js
export const isPlainObject = (value: unknown): value is Object => {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
};

export type UndefinedPropKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

export type UndefinedProps<T> = Pick<T, UndefinedPropKeys<T>>;

// https://github.com/microsoft/TypeScript/issues/32562#issuecomment-515241378
export type SelectivePartial<T, K extends keyof T> = Partial<Pick<T, K>> &
  Required<Pick<T, Exclude<keyof T, K>>> extends infer U
  ? { [P in keyof U]: U[P] }
  : never;
