"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all2) => {
  for (var name in all2)
    __defProp(target, name, { get: all2[name], enumerable: true });
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

// src/ok-computer.ts
var ok_computer_exports = {};
__export(ok_computer_exports, {
  INTROSPECT: () => INTROSPECT,
  OBJECT_ROOT: () => OBJECT_ROOT,
  all: () => all,
  and: () => and,
  andPeer: () => andPeer,
  andPeers: () => andPeers,
  annotate: () => annotate,
  arr: () => arr,
  array: () => array,
  assert: () => assert,
  bigint: () => bigint,
  boolean: () => boolean,
  create: () => create,
  email: () => email,
  err: () => err,
  exists: () => exists,
  falsy: () => falsy,
  finite: () => finite,
  fn: () => fn,
  hasError: () => hasError,
  includes: () => includes,
  instanceOf: () => instanceOf,
  integer: () => integer,
  is: () => is,
  isError: () => isError,
  length: () => length,
  listErrors: () => listErrors,
  match: () => match,
  max: () => max,
  maxLength: () => maxLength,
  merge: () => merge,
  min: () => min,
  minLength: () => minLength,
  nandPeer: () => nandPeer,
  nandPeers: () => nandPeers,
  not: () => not,
  nul: () => nul,
  nullish: () => nullish,
  number: () => number,
  object: () => object,
  okay: () => okay,
  oneOf: () => oneOf,
  or: () => or,
  orPeer: () => orPeer,
  orPeers: () => orPeers,
  oxorPeer: () => oxorPeer,
  oxorPeers: () => oxorPeers,
  pattern: () => pattern,
  peer: () => peer,
  string: () => string,
  symbol: () => symbol,
  truthy: () => truthy,
  tuple: () => tuple,
  typeOf: () => typeOf,
  undef: () => undef,
  when: () => when,
  withErr: () => withErr,
  xor: () => xor,
  xorPeer: () => xorPeer,
  xorPeers: () => xorPeers
});
module.exports = __toCommonJS(ok_computer_exports);

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

// src/errors.ts
var isIError = (val) => val != null && typeof val.toPrimitiveError === "function";
var STRUCTURE = Symbol.for("ok-computer.structure");
var isIStructure = (val) => val != null && val[STRUCTURE] === true;
var asStructure = (val) => {
  if (val == null) {
    throw new Error("Expected object");
  }
  Object.defineProperty(val, STRUCTURE, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false
  });
  return val;
};
var LogicalOperatorError = class {
  constructor(operator, errors) {
    this.type = `${operator}Error`;
    this.operator = operator;
    this.errors = errors;
    if (this.errors.length < 1) {
      throw new Error(`Expected at least 1 error: ${this.operator}`);
    }
  }
  toPrimitiveError() {
    const primitiveErrors = this.errors.map(
      (err2) => isIError(err2) ? err2.toPrimitiveError() : err2
    );
    if (primitiveErrors.every(isPrimitiveValue)) {
      const str = primitiveErrors.map(
        (err2, i) => err2 == null ? `${err2}` : i === 0 || typeof err2 !== "string" ? err2.toString() : lowerFirst(err2)
      ).join(` ${this.operator.toLowerCase()} `);
      return primitiveErrors.length > 1 ? `(${str})` : str;
    }
    return {
      type: this.type,
      operator: this.operator,
      errors: this.errors
    };
  }
  toJSON() {
    return this.toPrimitiveError();
  }
  toString() {
    const error = this.toPrimitiveError();
    return typeof error === "string" ? error : `[object ${this.type}]`;
  }
};
var ORError = class extends LogicalOperatorError {
  constructor(errors) {
    super("OR", errors);
  }
};
var ANDError = class extends LogicalOperatorError {
  constructor(errors) {
    super("AND", errors);
  }
};
var XORError = class extends LogicalOperatorError {
  constructor(errors) {
    super("XOR", errors);
  }
};
var PeerError = class {
  constructor(key, error) {
    this.type = "PeerError";
    this.key = key;
    this.error = error;
  }
  toPrimitiveError() {
    const primitiveError = isIError(this.error) ? this.error.toPrimitiveError() : this.error;
    return typeof primitiveError === "string" ? `Peer "${this.key}" ${lowerFirst(primitiveError)}` : { type: this.type, key: this.key, error: this.error };
  }
  toJSON() {
    return this.toPrimitiveError();
  }
  toString() {
    const primitive = this.toPrimitiveError();
    return typeof primitive === "string" ? primitive : `[object ${this.type}]`;
  }
};
var NegateError = class {
  constructor(error) {
    this.type = "NegateError";
    this.error = error;
  }
  toPrimitiveError() {
    return typeof this.error === "string" ? `not("${this.error}")` : { type: this.type, error: this.error };
  }
  toJSON() {
    return this.toPrimitiveError();
  }
  toString() {
    const json = this.toPrimitiveError();
    return typeof json === "string" ? json : `[object ${this.type}]`;
  }
};
var AssertError = class extends Error {
  constructor(errors, value) {
    super();
    try {
      const firstError = errors[0];
      this.message = `Invalid: first of ${errors.length} errors: ${firstError.path}: ${firstError.err.toString() !== "[object Object]" ? firstError.err : JSON.stringify(firstError.err)}`;
    } catch (ex) {
      this.message = "Invalid";
    }
    this.errors = errors;
    this.value = value;
  }
};

// src/ok-computer.ts
var annotate = () => (validator) => validator;
var listErrors = (err2) => {
  const _isError = (value) => typeof value !== "undefined" && !(value instanceof Promise);
  const _listErrors = (err3, path = "") => {
    if (isIStructure(err3)) {
      return ownEnumerableEntries(
        err3
      ).flatMap(
        ([key, value]) => _listErrors(value, path ? `${path}.${String(key)}` : String(key))
      );
    }
    return _isError(err3) ? [{ path, err: isIError(err3) ? err3.toPrimitiveError() : err3 }] : [];
  };
  return _listErrors(err2);
};
var isError = (err2) => !!listErrors(err2).length;
var hasError = isError;
function assert(value, validator, err2 = ({
  errorList
}) => new AssertError(errorList)) {
  const error = validator(value);
  const errorList = listErrors(error);
  if (!errorList.length) {
    return;
  }
  const result = typeof err2 === "function" ? err2({ error, errorList }) : err2;
  throw typeof result === "string" ? new Error(result) : result;
}
var ONE_SIDED = Symbol.for("ok-computer.one-sided");
var okay = (value, validator) => {
  if (isError(validator(value))) {
    return false;
  }
  return true;
};
var withErr = (validator, err2) => (value, ...parents) => isError(validator(value, ...parents)) ? err2 : void 0;
var err = withErr;
var INTROSPECT = Symbol.for("ok-computer.introspect");
var create = (predicate) => (err2) => (value, ...parents) => value === INTROSPECT || !predicate(value, ...parents) ? err2 : void 0;
var introspectValidator = (validator) => {
  const error = validator(INTROSPECT);
  if (!isError(error)) {
    throw new Error("Validator introspection failed");
  }
  return error;
};
var is = (value) => create((actual) => actual === value)(`Expected ${String(value)}`);
var typeOf = (str) => create((value) => typeof value === str)(`Expected typeof ${str}`);
var instanceOf = (ctor) => create((value) => value instanceof ctor)(
  `Expected instanceof ${ctor.name}`
);
var number = typeOf("number");
var boolean = typeOf("boolean");
var bigint = typeOf("bigint");
var string = typeOf("string");
var symbol = typeOf("symbol");
var fn = typeOf("function");
var undef = typeOf("undefined");
var nul = is(null);
var integer = create(Number.isInteger)("Expected integer");
var finite = create(Number.isFinite)("Expected finite number");
var or = (...validators) => {
  const error = new ORError(
    validators.map(
      (validator) => introspectValidator(validator)
    )
  );
  return create(
    (value, ...parents) => validators.some((validator) => !isError(validator(value, ...parents)))
  )(error);
};
var xor = (...validators) => {
  const error = new XORError(
    validators.map(
      (validator) => introspectValidator(validator)
    )
  );
  return create((value, ...parents) => {
    const passes = validators.reduce((acc, validator, i) => {
      if (acc.length < 2) {
        const error2 = validator(value, ...parents);
        if (!isError(error2)) {
          acc.push(true);
        }
      }
      return acc;
    }, []);
    return passes.length === 1;
  })(error);
};
var and = (...validators) => {
  const error = new ANDError(
    validators.map(
      (validator) => introspectValidator(validator)
    )
  );
  return create(
    (value, ...parents) => validators.every((validator) => !isError(validator(value, ...parents)))
  )(error);
};
var arr = create(Array.isArray)("Expected array");
var maxLength = (len) => err(
  and(
    or(string, arr),
    create((value) => value.length <= len)("Invalid")
  ),
  `Expected max length ${len}`
);
var minLength = (len) => err(
  and(
    or(string, arr),
    create((value) => value.length >= len)("Invalid")
  ),
  `Expected min length ${len}`
);
var length = (min2, max2 = min2) => err(
  and(minLength(min2), maxLength(max2)),
  min2 === max2 ? `Expected length ${min2}` : `Expected length between ${min2} and ${max2}`
);
var min = (num) => err(
  and(number, create((value) => value >= num)("Invalid")),
  `Expected min ${num}`
);
var max = (num) => err(
  and(number, create((value) => value <= num)("Invalid")),
  `Expected max ${num}`
);
var nullish = err(or(undef, nul), "Expected nullish");
var includes = (value) => err(
  and(
    or(arr, string),
    create((actual) => actual.includes(value))("Invalid")
  ),
  `Expected to include ${value}`
);
var pattern = (regex) => err(
  and(string, create((value) => regex.test(value))("Invalid")),
  `Expected to match pattern ${regex}`
);
var oneOf = (...allowed) => err(
  or(...allowed.map((val) => is(val))),
  `Expected one of ${allowed.join(", ")}`
);
var not = (validator) => create(
  (value, ...parents) => isError(validator(value, ...parents))
)(new NegateError(introspectValidator(validator)));
var array = (validator) => (value, ...parents) => {
  if (value === INTROSPECT) {
    const err3 = asStructure([
      introspectValidator(validator)
    ]);
    return err3;
  }
  if (!Array.isArray(value)) {
    const err3 = asStructure(["Expected array"]);
    return err3;
  }
  const err2 = asStructure(
    value.map((val) => validator(val, value, ...parents))
  );
  return err2;
};
var tuple = (...validators) => {
  if (validators.length < 1) {
    throw new Error("tuple requires as least 1 validator");
  }
  return (value, ...parents) => {
    if (value === INTROSPECT || !Array.isArray(value)) {
      return asStructure(
        validators.map(
          (validator) => introspectValidator(validator)
        )
      );
    }
    const count = Math.max(validators.length, value.length);
    return asStructure(
      new Array(count).fill(null).map((_, i) => {
        const validator = validators[i];
        const val = value[i];
        const indexExists = i in value;
        return validator ? indexExists ? validator(val, value, ...parents) : introspectValidator(validator) : "Extraneous element";
      })
    );
  };
};
var all = (...validators) => {
  return (value, ...parents) => {
    if (value === INTROSPECT) {
      return new ANDError(
        validators.map(
          (validator) => introspectValidator(validator)
        )
      );
    }
    const errors = validators.map((validator) => validator(value, ...parents)).filter(
      (val) => isError(val)
    );
    return errors.length ? new ANDError(errors) : void 0;
  };
};
var OBJECT_ROOT = Symbol.for("ok-computer.object-root");
var object = (validators, { allowUnknown = false } = {}) => (...parents) => {
  const values = parents[0];
  const introspecting = values === INTROSPECT;
  const ret = asStructure(
    {}
  );
  if (introspecting || !isPlainObject(values)) {
    ret[OBJECT_ROOT] = "Expected object";
  } else if (!allowUnknown) {
    const expectedKeys = Object.keys(validators);
    const actualKeys = Object.keys(values);
    const unknownKeys = actualKeys.filter(
      (key) => !expectedKeys.includes(key)
    );
    if (unknownKeys.length) {
      ret[OBJECT_ROOT] = `Unknown properties ${unknownKeys.map((key) => `"${key}"`).join(", ")}`;
    }
  }
  return ownEnumerableEntries(validators).reduce((errors, [key, validator]) => {
    if (typeof validator !== "function") {
      throw new Error(`Expected validator to be function ${String(key)}`);
    }
    const value = introspecting ? INTROSPECT : (values || {})[key];
    const error = introspecting ? introspectValidator(validator) : validator(value, ...parents);
    errors[key] = error;
    return errors;
  }, ret);
};
function merge(...validators) {
  return (value, ...parents) => {
    const errors = validators.map((validator) => validator(value, ...parents)).filter((val) => isError(val));
    return asStructure(Object.assign({}, ...errors));
  };
}
var when = (predicate) => (validator) => create(
  (value, ...parents) => !predicate(value, ...parents) || !isError(validator(value, ...parents))
)(introspectValidator(validator));
var match = (key) => create((value, parent) => parent != null && parent[key] === value)(
  `Expected to match ${key}`
);
var email = err(
  pattern(
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i
  ),
  "Expected email"
);
var peer = (key) => (validator) => (value, ...parents) => {
  if (value === INTROSPECT) {
    return new PeerError(key, introspectValidator(validator));
  }
  const err2 = validator(parents[0] && parents[0][key], ...parents);
  return isError(err2) ? new PeerError(key, err2) : void 0;
};
var andPeers = (...keys) => or(
  and(nullish, ...keys.map((key) => peer(key)(nullish))),
  and(not(nullish), ...keys.map((key) => peer(key)(not(nullish))))
);
var andPeer = (key) => andPeers(key);
var nandPeers = (...keys) => or(
  and(nullish, ...keys.map((key) => peer(key)(nullish))),
  not(and(not(nullish), ...keys.map((key) => peer(key)(not(nullish)))))
);
var nandPeer = (key) => nandPeers(key);
var orPeers = (...keys) => or(not(nullish), ...keys.map((key) => peer(key)(not(nullish))));
var orPeer = (key) => orPeers(key);
var xorPeers = (...keys) => xor(not(nullish), ...keys.map((key) => peer(key)(not(nullish))));
var xorPeer = (key) => xorPeers(key);
var oxorPeers = (...keys) => or(
  and(nullish, ...keys.map((key) => peer(key)(nullish))),
  xor(not(nullish), ...keys.map((key) => peer(key)(not(nullish))))
);
var oxorPeer = (key) => oxorPeers(key);
var exists = not(nullish);
var truthy = create((value) => !!value)("Expected truthy value");
var falsy = create((value) => !value)("Expected falsy value");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  INTROSPECT,
  OBJECT_ROOT,
  all,
  and,
  andPeer,
  andPeers,
  annotate,
  arr,
  array,
  assert,
  bigint,
  boolean,
  create,
  email,
  err,
  exists,
  falsy,
  finite,
  fn,
  hasError,
  includes,
  instanceOf,
  integer,
  is,
  isError,
  length,
  listErrors,
  match,
  max,
  maxLength,
  merge,
  min,
  minLength,
  nandPeer,
  nandPeers,
  not,
  nul,
  nullish,
  number,
  object,
  okay,
  oneOf,
  or,
  orPeer,
  orPeers,
  oxorPeer,
  oxorPeers,
  pattern,
  peer,
  string,
  symbol,
  truthy,
  tuple,
  typeOf,
  undef,
  when,
  withErr,
  xor,
  xorPeer,
  xorPeers
});
