import {
  isPlainObject
} from "./chunk-AEOWSTVM.mjs";

// src/parser.ts
var trim = (value) => value.trim();
var trimEnd = (value) => value.trimEnd();
var trimStart = (value) => value.trimStart();
var uppercase = (value) => value.toUpperCase();
var lowercase = (value) => value.toLowerCase();
var padStart = (padding) => (value) => value.padStart(padding);
var padEnd = (padding) => (value) => value.padEnd(padding);
var split = (...args) => (value) => value.split(...args);
var nullWhen = (nullValue) => (value) => value === nullValue ? null : value;
var undefinedWhen = (nullValue) => (value) => value === nullValue ? void 0 : value;
var object = (parsers, { keepUnknown = false } = {}) => (value) => {
  if (!isPlainObject(value)) {
    return value;
  }
  const result = Object.fromEntries(
    Object.entries(parsers).map(([prop, parser]) => {
      const val = value == null ? void 0 : value[prop];
      try {
        return [prop, parser(val)];
      } catch (ex) {
        return [prop, val];
      }
    }, [])
  );
  if (keepUnknown) {
    return { ...value, ...result };
  }
  return result;
};
var array = (parser) => (value) => {
  if (!Array.isArray(value)) {
    return value;
  }
  const result = value.map((val) => {
    try {
      return parser(val);
    } catch (ex) {
      return val;
    }
  });
  return result;
};
export {
  array,
  lowercase,
  nullWhen,
  object,
  padEnd,
  padStart,
  split,
  trim,
  trimEnd,
  trimStart,
  undefinedWhen,
  uppercase
};
