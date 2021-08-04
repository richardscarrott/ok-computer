export type Maybe<T> = T | undefined;

export interface Dictionary<T> {
  [index: string]: T;
}

export type Validator<Err = unknown> = (
  value: unknown,
  ...parents: any[]
) => Maybe<Err>;
// `ValidatorWithStructure` is like `Validator` but assumes a `withStructure`
// data type is being returned, and therefore doesn't return undefined.
export type ValidatorWithStructure<Err = unknown> = (
  value: unknown,
  ...parents: any[]
) => Err;

export type ValidatorFactory = <Err = any>(err: Err) => Validator<Err>;
export type ValidatorFactoryNoInfer = (err: any) => Validator<any>;

export interface ErrItem<Err> {
  readonly path: string;
  readonly err: Err;
}

const lowerFirst = (str: string) =>
  str.charAt(0).toLowerCase() + str.substring(1, str.length);

const structure = Symbol('structure');

export const withStructure = <T>(val: T): T => {
  if (val == null) {
    throw new Error('Expected object');
  }
  // @ts-ignore
  val[structure] = true;
  return val;
};

export const listErrors = <Err>(err: any) => {
  // Everything other than `undefined` is considered an error
  const _isError = (value: unknown) =>
    // NOTE: We're reserving `Promise` to add async support in the future.
    typeof value !== 'undefined' && !(value instanceof Promise);

  const _isStructure = (value: any) => value != null && value[structure];

  const _listErrors = (err: any, path: string = ''): ErrItem<Err>[] => {
    if (_isStructure(err)) {
      return Object.entries(err).flatMap(([key, value]) =>
        _listErrors(value, path ? `${path}.${key}` : key)
      );
    }
    return _isError(err) ? [{ path, err }] : [];
  };

  return _listErrors(err);
};

// We expose `isError` and `hasError` as both verbs can make sense depending on context
// i.e. some validators return 1 error, some return many.
export const isError = (err: any) => !!listErrors(err).length;
export const hasError = isError;

export class ValidationError extends Error {
  public errors: ErrItem<any>[];
  constructor(errors: ErrItem<any>[]) {
    super();
    try {
      const firstError = errors[0];
      this.message = [
        `Invalid: first of ${errors.length} errors`,
        firstError.path,
        firstError.err.toString() !== '[object Object]'
          ? firstError.err
          : JSON.stringify(firstError.err)
      ]
        .filter((val) => !!val)
        .join(': ');
    } catch (ex) {
      this.message = 'Invalid';
    }
    this.errors = errors;
  }
}

export const assert = <Err>(err: Err) => {
  const errors = listErrors(err);
  if (errors.length) {
    throw new ValidationError(errors);
  }
};

export const create =
  (
    predicate: (value: unknown, ...parents: any[]) => boolean
  ): ValidatorFactory =>
  (err) =>
  (value, ...parents) =>
    predicate(value, ...parents) ? undefined : err;

export const $is = (value: any) => create((actual) => actual === value);
export const is = (value: any) => $is(value)(`Expected ${value}`);

export const $typeOf = (str: string) => create((value) => typeof value === str);
export const typeOf = (str: string) => $typeOf(str)(`Expected typeof ${str}`);

/**
 * Checks the value is a string
 */
export const $string = $typeOf('string');
/**
 * Checks the value is a string
 */
export const string = $string('Expected string');

/**
 * Checks the value is a number
 */
export const $number = $typeOf('number');
/**
 * Checks the value is a number
 */
export const number = $number('Expected number');

/**
 * Passes if the value is a boolean
 */
export const $boolean = $typeOf('boolean');
/**
 * Passes if the value is a boolean
 */
export const boolean = $boolean('Expected boolean');

/**
 * Passes if the value is an integer
 */
export const $integer = create((value) => Number.isInteger(value));
/**
 * Passes if the value is an integer
 */
export const integer = $integer('Expected integer');

/**
 * Passes if the value is an instance of @cto
 */
export const $instanceOf = (ctor: Function) =>
  create((value) => value instanceof ctor);
/**
 * Passes if the value is an instance of @ctor
 */
export const instanceOf = (ctor: Function) =>
  $instanceOf(ctor)(`Expected instanceof ${ctor.name}`);

/**
 * Passes if the value passes one or more validators
 */
export const $or =
  (...validators: ValidatorFactoryNoInfer[]): ValidatorFactory =>
  (err) =>
  (value, ...parents) =>
    !validators.some((validator) => !isError(validator(err)(value, ...parents)))
      ? err
      : undefined;
/**
 * Passes if the value passes one or more validators
 */
export const or =
  (...validators: Validator<string>[]): Validator<string> =>
  (value, ...parents) => {
    const errors = validators
      .map((validator) => validator(value, ...parents))
      .filter((err): err is string => isError(err));
    const errStr =
      errors.length === validators.length
        ? errors.map((err, i) => (i === 0 ? err : lowerFirst(err))).join(' or ')
        : undefined;
    return errors.length > 1 ? `(${errStr})` : errStr;
  };

/**
 * Passes if the value passes every validator
 */
export const $and =
  (...validators: ValidatorFactoryNoInfer[]): ValidatorFactory =>
  (err) =>
  (value, ...parents) =>
    !validators.every(
      (validator) => !isError(validator(err)(value, ...parents))
    )
      ? err
      : undefined;
/**
 * Passes if the value passes every validator
 */
export const and =
  (...validators: Validator<string>[]): Validator<string> =>
  (value, ...parents) => {
    const errors = validators
      .map((validator) => validator(value, ...parents))
      .filter((err): err is string => isError(err));
    const errStr = errors.length
      ? errors.map((err, i) => (i === 0 ? err : lowerFirst(err))).join(' and ')
      : undefined;
    return errors.length > 1 ? `(${errStr})` : errStr;
  };

/**
 * Passes if the value is an array and every element passes the validator
 */
export const $array =
  <Err>(validator: Validator<Err>) =>
  (err: Err): ValidatorWithStructure<(Err | undefined)[]> =>
  (value, ...parents) => {
    if (!Array.isArray(value)) {
      // We return the root error as an array to maintain
      // a consistent return type.
      return withStructure([err]);
    }
    const errors = value.map((val) => validator(val, ...parents));
    return withStructure(errors);
  };
/**
 * Passes if the value is an array and every element passes the validator
 */
export const array = <Err>(validator: Validator<Err | string>) =>
  $array(validator)('Expected array');

/**
 * Passes if the value is an array
 */
// I suspect `$array(string)` is going to be more commonly used as
// most of the time you care what is in the array... but this is basically
// a patch on the fact `instanceOf(Array)` isn't reliable.
// It could in theory be written as `$array(create(() => true))` but that'd
// return `withStructure([])` err which probably isn't expected.
export const $anyArray = create((value) => Array.isArray(value));
/**
 * Passes if the value is an array
 */
export const anyArray = $anyArray('Expected array');

/**
 * Passes if the value is less than or equal to @len
 */
export const $maxLength = (len: number) =>
  $and(
    $or($string, $anyArray),
    create((value) => (value as any[] | string).length <= len)
  );
/**
 * Passes if the value is less than or equal to @len
 */
export const maxLength = (len: number) =>
  $maxLength(len)(`Expected max length ${len}`);

/**
 * Passes if the value is greater than or equal to @len
 */
export const $minLength = (len: number) =>
  $and(
    $or($string, $anyArray),
    create((value) => (value as any[] | string).length >= len)
  );
/**
 * Passes if the value is greater than or equal to @len
 */
export const minLength = (len: number) =>
  $minLength(len)(`Expected min length ${len}`);

/**
 * Passes if the value is a string or an array with a length
 * less than or equal to @min and greater than or euqal to @max
 *
 * Passing @min alone is the equivalent of passing the same
 * value for @min and @max
 */
export const $length = (min: number, max: number = min) =>
  $and($minLength(min), $maxLength(max));
/**
 * Passes if the value is a string or an array with a length
 * less than or equal to @min and greater than or euqal to @max
 *
 * Passing @min alone is the equivalent of passing the same
 * value for @min and @max
 */
export const length = (min: number, max: number = min) =>
  $length(
    min,
    max
  )(
    min === max
      ? `Expected length ${min}`
      : `Expected length between ${min} and ${max}`
  );

/**
 * Passes if the value is a number and greater than or equal @num
 */
export const $min = (num: number) =>
  $and(
    $number,
    create((value) => (value as number) >= num)
  );
/**
 * Passes if the value is a number and greater than or equal @num
 */
export const min = (num: number) => $min(num)(`Expected min ${num}`);

/**
 * Passes if the value is a number and less than or equal @num
 */
export const $max = (num: number) =>
  $and(
    $number,
    create((value) => (value as number) <= num)
  );
/**
 * Passes if the value is a number and less than or equal @num
 */
export const max = (num: number) => $max(num)(`Expected max ${num}`);

/**
 * Passes if the value is undefined or null
 */
export const $nullish = $or($is(undefined), $is(null));
/**
 * Passes if the value is undefined or null
 */
export const nullish = $nullish('Expected nullish');

/**
 * Passes if the value is a string or an array and includes @value
 */
export const $includes = (value: any) =>
  $and(
    $or($anyArray, $string),
    create((actual) => (actual as string | any[]).includes(value))
  );
/**
 * Passes if the value is a string or an array and includes @value
 */
export const includes = (value: any) =>
  $includes(value)(`Expected to include ${value}`);

/**
 * Passes if the value is a string and matches the regex
 */
export const $pattern = (regex: RegExp) =>
  $and(
    $string,
    create((value) => regex.test(value as string))
  );

/**
 * Passes if the value is a string and matches the regex
 */
export const pattern = (value: any) =>
  $pattern(value)(`Expected to match pattern ${value}`);

/**
 * Passes if the value is in the @allowed array
 */
// or $enum?
export const $oneOf = (...allowed: any[]) =>
  $or(...allowed.map((val) => $is(val)));
/**
 * Passes if the value is in the @allowed array
 */
export const oneOf = (...allowed: any[]) =>
  $oneOf(allowed)(`Expected one of ${allowed}`);

/**
 * Passes if value is an array and each element passes the
 * corresponding validator
 */
export const $tuple =
  <Err>(...validators: Validator<Err>[]) =>
  (err: Err): Validator<(Err | undefined)[] | Err> =>
  (value, ...parents) => {
    if (!Array.isArray(value)) {
      // TODO: this should return `withStructure([err])`
      // for a consistent return value; same as array
      return err;
    }
    if (value.length > validators.length) {
      // TODO: this should return `withStructure([err])`
      // for a consistent return value; same as array
      return err;
    }
    const errors = validators.map((validator, i) =>
      validator(value[i], ...parents)
    );
    return withStructure(errors);
  };
/**
 * Passes if value is an array and each element passes the
 * corresponding validator
 */
export const tuple = (...validators: Validator<string>[]) =>
  $tuple(...validators)('Expected tuple');

/**
 * Passes if value passes each validator
 *
 * This is like @and but returns a stack of errors.
 */
export const each =
  <Err>(...validators: Validator<Err>[]): Validator<Err> =>
  (value: unknown, ...parents) => {
    const errors = all(...validators)(value, ...parents);
    return hasError(errors) && Array.isArray(errors) ? errors[0] : undefined;
  };

/**
 * Passes if value passes each validator
 *
 * This is like @and but returns all errors as an array.
 * Useful if you want to list all the errors at once, e.g. a password
 * validator UI.
 */
export const all =
  <Err>(...validators: Validator<Err>[]): Validator<Err[]> =>
  (value, ...parents) => {
    const errors = validators
      .map((validator) => validator(value, ...parents))
      .filter((val): val is Err => isError(val));
    return errors.length ? withStructure(errors) : undefined;
  };

/**
 * Passes if value does not pass the validator
 */
export const $not =
  (validator: ValidatorFactory) =>
  <Err>(err: Err) =>
  (value: unknown, ...parents: any[]) =>
    !isError(validator(err)(value, ...parents)) ? err : undefined;
// Alternative impl.
// export const $not = (validator: ValidatorFactory) =>
//   create((value, ...parents) =>
//     isError(validator('invalid')(value, ...parents))
//   );

/**
 * Passes if value does not pass the validator
 */
export const not =
  (validator: Validator<string>) =>
  (value: unknown, ...parents: any[]) => {
    const error = validator(value, ...parents);
    // NOTE: The out the box error for `not` isn't great as naturally we can't get hold
    // of the error from the validator because it wasn't an error... we could potentially
    // expose an optional interface on a Validator fn which exposes the error, e.g. `validator.err`
    // ...but tbh I like that they're just regular ol' functions. For now this will do, it'll at the
    // very least still be an error, and if you need a more custom error you can just use `$not`.
    return !isError(error) ? `Expected not ${validator}` : undefined;
  };

type ReturnTypes<T extends Record<keyof T, (...a: any[]) => any>> = {
  [P in keyof T]: ReturnType<T[P]>;
};

/**
 * Passes if the value is an object and all corresponding fields pass their
 * respective validators
 */
export const $object =
  <
    Validators extends Record<
      keyof Validators,
      (val: any, ...parents: any[]) => any
    >
  >(
    validators: Validators
  ) =>
  <Err>(
    err: Err
  ): ValidatorWithStructure<
    ReturnTypes<Validators> & {
      __root?: Err;
    }
  > =>
  (...parents: unknown[]) => {
    const values = parents[0];
    const ret = withStructure({}) as ReturnTypes<Validators> & { __root?: Err };
    if (values == null) {
      // If the value passed isn't an object we want to expose the nice
      // interface, but we need to make sure, in cases where all fields are
      // optional, we still offer up an error.
      // NOTE: We can't use a `Symbol` as isn't not iterable so going with `__root`
      // for now...
      ret.__root = err;
    }
    return Object.entries(validators).reduce<ReturnTypes<Validators>>(
      (errors, [key, validator]) => {
        if (typeof validator !== 'function') {
          throw new Error(`Expected validator to be function ${key}`);
        }
        const value = ((values || {}) as any)[key];
        (errors as Dictionary<any>)[key] = validator(value, ...parents);
        return errors;
      },
      ret
    );
  };
/**
 * Passes if the value is an object and all fields pass their
 * corresponding validators
 */
export const object = <
  Validators extends Record<
    keyof Validators,
    (val: any, ...parents: any[]) => any
  >
>(
  validators: Validators
) => $object(validators)('Expected object');

/**
 * Merges `object` validators into a single validator function
 * which passes if the value is an object and all fields pass their
 * corresponding merged validators
 *
 * @example
 * ```
 * const firstName = object({ firstName: string });
 * const lastName = object({ lastName: string });
 * const fullName = merge(firstNameObject, lastNameObject);
 * fullName({}); // { firstName: 'Expected string', lastName: 'Expected string' }
 * ```
 */
export function merge<Err>(
  validator: Validator<Err>
): ValidatorWithStructure<Err>;
export function merge<Err1, Err2>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>
): ValidatorWithStructure<Err1 & Err2>;
export function merge<Err1, Err2, Err3>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>
): ValidatorWithStructure<Err1 & Err2 & Err3>;
export function merge<Err1, Err2, Err3, Err4>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>,
  validator4: Validator<Err4>
): ValidatorWithStructure<Err1 & Err2 & Err3 & Err4>;
export function merge<Err1, Err2, Err3, Err4, Err5>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>,
  validator4: Validator<Err4>,
  validator5: Validator<Err5>
): ValidatorWithStructure<Err1 & Err2 & Err3 & Err4 & Err5>;
export function merge<Err1, Err2, Err3, Err4, Err5, Err6>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>,
  validator4: Validator<Err4>,
  validator5: Validator<Err5>,
  validator6: Validator<Err6>
): ValidatorWithStructure<Err1 & Err2 & Err3 & Err4 & Err5 & Err6>;
export function merge<Err1, Err2, Err3, Err4, Err5, Err6, Err7>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>,
  validator4: Validator<Err4>,
  validator5: Validator<Err5>,
  validator6: Validator<Err6>,
  validator7: Validator<Err7>
): ValidatorWithStructure<Err1 & Err2 & Err3 & Err4 & Err5 & Err6 & Err7>;
export function merge<Err1, Err2, Err3, Err4, Err5, Err6, Err7, Err8>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>,
  validator4: Validator<Err4>,
  validator5: Validator<Err5>,
  validator6: Validator<Err6>,
  validator7: Validator<Err7>,
  validator8: Validator<Err8>
): ValidatorWithStructure<
  Err1 & Err2 & Err3 & Err4 & Err5 & Err6 & Err7 & Err8
>;
/**
 * Merges {@link object} or {@link @$object} validators into a single
 * validator function which passes if the value is an object and all
 * fields pass their corresponding merged validators
 *
 * @example
 * ```
 * const firstName = object({ firstName: string });
 * const lastName = object({ lastName: string });
 * const fullName = merge(firstNameObject, lastNameObject);
 * fullName({}); // { firstName: 'Expected string', lastName: 'Expected string' }
 * ```
 */
export function merge(...validators: any[]): any {
  return (value: unknown, ...parents: any[]) => {
    const errors = validators
      .map((validator) => validator(value, ...parents))
      .filter((val) => isError(val));
    return Object.assign({}, ...errors);
  };
}

/**
 * Passes if @predicate returns a truthy value and the validator
 * passes
 */
export const when =
  (predicate: (value: unknown, ...parents: any[]) => boolean) =>
  <Err>(validator: Validator<Err>): Validator<Err> =>
  (value, ...parents) =>
    predicate(value, ...parents) ? validator(value, ...parents) : undefined;

/**
 * Passes if the value is equal to the value of parent[@key]
 */
export const $match = (key: string) =>
  create((value, parent) => parent != null && parent[key] === value);
/**
 * Passes if the value is equal to the value of parent[@key]
 */
export const match = (key: string) => $match(key)(`Expected to match ${key}`);

/**
 * Passes if the value looks like an email
 */
export const $email = $pattern(
  /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i
);
/**
 * Passes if the value looks like an email
 */
export const email = $email('Expected email');
