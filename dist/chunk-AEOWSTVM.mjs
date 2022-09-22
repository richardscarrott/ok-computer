// src/utils.ts
var ownEntries = (obj) => Reflect.ownKeys(obj).map((key) => [key, obj[key]]);
var ownEnumerableEntries = (obj) => ownEntries(obj).filter(([key]) => obj.propertyIsEnumerable(key));
var lowerFirst = (str) => str.charAt(0).toLowerCase() + str.substring(1, str.length);
var isPrimitiveValue = (val) => {
  if (typeof val === "object") {
    return val === null;
  }
  return typeof val !== "function";
};
var isPlainObject = (value) => {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
};

export {
  ownEnumerableEntries,
  lowerFirst,
  isPrimitiveValue,
  isPlainObject
};
