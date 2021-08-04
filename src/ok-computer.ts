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
      this.message = `Invalid: first of ${errors.length} errors: ${
        firstError.path
      }: ${
        firstError.err.toString() !== '[object Object]'
          ? firstError.err
          : JSON.stringify(firstError.err)
      }`;
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

export const $string = $typeOf('string');
export const string = $string('Expected string');

export const $number = $typeOf('number');
export const number = $number('Expected number');

export const $boolean = $typeOf('boolean');
export const boolean = $boolean('Expected boolean');

export const $integer = create((value) => Number.isInteger(value));
export const integer = $integer('Expected integer');

export const $instanceOf = (ctor: Function) =>
  create((value) => value instanceof ctor);
export const instanceOf = (ctor: Function) =>
  $instanceOf(ctor)(`Expected instanceof ${ctor.name}`);

export const $or =
  (...validators: ValidatorFactoryNoInfer[]): ValidatorFactory =>
  (err) =>
  (value, ...parents) =>
    !validators.some((validator) => !isError(validator(err)(value, ...parents)))
      ? err
      : undefined;
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

export const $and =
  (...validators: ValidatorFactoryNoInfer[]): ValidatorFactory =>
  (err) =>
  (value, ...parents) =>
    !validators.every(
      (validator) => !isError(validator(err)(value, ...parents))
    )
      ? err
      : undefined;
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
export const array = <Err>(validator: Validator<Err | string>) =>
  $array(validator)('Expected array');

// I suspect `$array(string)` is going to be more commonly used as
// most of the time you care what is in the array... but this is basically
// a patch on the fact `instanceOf(Array)` isn't reliable.
// It could in theory be written as `$array(create(() => true))` but that'd
// return `withStructure([])` err which probably isn't expected.
export const $anyArray = create((value) => Array.isArray(value));
export const anyArray = $anyArray('Expected array');

export const $maxLength = (len: number) =>
  $and(
    $or($string, $anyArray),
    create((value) => (value as any[] | string).length <= len)
  );
export const maxLength = (len: number) =>
  $maxLength(len)(`Expected max length ${len}`);

export const $minLength = (len: number) =>
  $and(
    $or($string, $anyArray),
    create((value) => (value as any[] | string).length >= len)
  );
export const minLength = (len: number) =>
  $minLength(len)(`Expected min length ${len}`);

export const $length = (min: number, max: number = min) =>
  $and($minLength(min), $maxLength(max));
export const length = (min: number, max: number = min) =>
  $length(
    min,
    max
  )(
    min === max
      ? `Expected length ${min}`
      : `Expected length between ${min} and ${max}`
  );

export const $min = (num: number) =>
  $and(
    $number,
    create((value) => (value as number) >= num)
  );
export const min = (num: number) => $min(num)(`Expected min ${num}`);

export const $max = (num: number) =>
  $and(
    $number,
    create((value) => (value as number) <= num)
  );
export const max = (num: number) => $max(num)(`Expected max ${num}`);

export const $nullish = $or($is(undefined), $is(null));
export const nullish = $nullish('Expected nullish');

export const $includes = (value: any) =>
  $and(
    $or($anyArray, $string),
    create((actual) => (actual as string | any[]).includes(value))
  );
export const includes = (value: any) =>
  $includes(value)(`Expected to include ${value}`);

export const $pattern = (regex: RegExp) =>
  $and(
    $string,
    create((value) => regex.test(value as string))
  );
export const pattern = (value: any) =>
  $pattern(value)(`Expected to match pattern ${value}`);

// or $enum?
export const $oneOf = (...allowed: any[]) =>
  $or(...allowed.map((val) => $is(val)));
export const oneOf = (...allowed: any[]) =>
  $oneOf(...allowed)(`Expected one of ${allowed}`);

export const $tuple =
  <Err>(...validators: Validator<Err>[]) =>
  (err: Err): Validator<(Err | undefined)[] | Err> =>
  (value, ...parents) => {
    if (!Array.isArray(value)) {
      return err;
    }
    if (value.length > validators.length) {
      return err;
    }
    const errors = validators.map((validator, i) =>
      validator(value[i], ...parents)
    );
    return withStructure(errors);
  };
export const tuple = (...validators: Validator<string>[]) =>
  $tuple(...validators)('Expected tuple');

// Like `and` but doesn't depend on string errors (good for more specific / granular error messaging)
export const each =
  <Err>(...validators: Validator<Err>[]): Validator<Err> =>
  (value: unknown, ...parents) => {
    const errors = all(...validators)(value, ...parents);
    return hasError(errors) && Array.isArray(errors) ? errors[0] : undefined;
  };

// Like `each` but returns *all* errors (good for password validation UIs)
export const all =
  <Err>(...validators: Validator<Err>[]): Validator<Err[]> =>
  (value, ...parents) => {
    const errors = validators
      .map((validator) => validator(value, ...parents))
      .filter((val): val is Err => isError(val));
    return errors.length ? withStructure(errors) : undefined;
  };

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
export const object = <
  Validators extends Record<
    keyof Validators,
    (val: any, ...parents: any[]) => any
  >
>(
  validators: Validators
) => $object(validators)('Expected object');

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
export function merge(...validators: any[]): any {
  return (value: unknown, ...parents: any[]) => {
    const errors = validators
      .map((validator) => validator(value, ...parents))
      .filter((val) => isError(val));
    return Object.assign({}, ...errors);
  };
}

export const when =
  (predicate: (value: unknown, ...parents: any[]) => boolean) =>
  <Err>(validator: Validator<Err>): Validator<Err> =>
  (value, ...parents) =>
    predicate(value, ...parents) ? validator(value, ...parents) : undefined;

export const $match = (key: string) =>
  create((value, parent) => parent != null && parent[key] === value);
export const match = (key: string) => $match(key)(`Expected to match ${key}`);

export const $email = $pattern(
  /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i
);
export const email = $email('Expected email');
