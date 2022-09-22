"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/parser.ts
var parser_exports = {};
__export(parser_exports, {
  array: () => array,
  lowercase: () => lowercase,
  nullWhen: () => nullWhen,
  object: () => object,
  padEnd: () => padEnd,
  padStart: () => padStart,
  split: () => split,
  trim: () => trim,
  trimEnd: () => trimEnd,
  trimStart: () => trimStart,
  undefinedWhen: () => undefinedWhen,
  uppercase: () => uppercase
});
module.exports = __toCommonJS(parser_exports);

// src/utils.ts
var isPlainObject = (value) => {
  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
};

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
