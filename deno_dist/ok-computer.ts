import {
  AssertError,
  ANDError,
  ORError,
  XORError,
  PeerError,
  NegateError,
  isIError,
  isIStructure,
  asStructure,
  IStructure
} from './errors.ts';
import { isPlainObject, ownEnumerableEntries } from './utils.ts';

export type Validator<Err = unknown> = (
  value: unknown,
  ...parents: any[]
) => Err | undefined;

export type StructValidator<Err extends IStructure> = (
  value: unknown,
  ...parents: any[]
) => Err;

export interface ErrItem<Err> {
  readonly path: string;
  readonly err: Err;
}

export const listErrors = <Err>(err: any) => {
  // Everything other than `undefined` is considered an error
  const _isError = (value: unknown) =>
    // NOTE: We're reserving `Promise` to add async support in the future.
    typeof value !== 'undefined' && !(value instanceof Promise);

  const _listErrors = (err: any, path: string = ''): ErrItem<Err>[] => {
    if (isIStructure(err)) {
      return ownEnumerableEntries(
        err as { [key: string | symbol]: any }
      ).flatMap(([key, value]) =>
        _listErrors(value, path ? `${path}.${String(key)}` : String(key))
      );
    }
    return _isError(err)
      ? [{ path, err: isIError(err) ? err.toPrimitiveError() : err }]
      : [];
  };

  return _listErrors(err);
};

// We expose `isError` and `hasError` as both verbs can make sense depending on context
// i.e. some validators return 1 error, some return many.
export const isError = <Err>(err: Err): err is Exclude<Err, undefined> =>
  !!listErrors(err).length;
export const hasError = isError;

export const assert = <Err>(err: Err) => {
  const errors = listErrors(err);
  if (errors.length) {
    throw new AssertError(errors);
  }
};

export const withErr =
  <Err>(validator: Validator<any>, err: Err): Validator<Err> =>
  (value: unknown, ...parents: any[]) =>
    isError(validator(value, ...parents)) ? err : undefined;
export const err = withErr;

export const INTROSPECT = Symbol.for('ok-computer.introspect');

type Predicate = (value: unknown, ...parents: any[]) => boolean;

interface Create {
  <Err>(predicate: Predicate, err: Err): Validator<Err>;
  (predicate: Predicate): Validator<string>;
}
export const create: Create =
  (predicate: Predicate, err: any = 'Invalid') =>
  (value: unknown, ...parents: any[]) =>
    value === INTROSPECT || !predicate(value, ...parents) ? err : undefined;

const introspectValidator = <Err>(validator: Validator<Err>) => {
  const error = validator(INTROSPECT);
  if (!isError(error)) {
    throw new Error('Validator introspection failed');
  }
  return error;
};

export const is = (value: any) =>
  create((actual) => actual === value, `Expected ${String(value)}`);

export const typeOf = (str: string) =>
  create((value) => typeof value === str, `Expected typeof ${str}`);

export const instanceOf = (ctor: Function) =>
  create((value) => value instanceof ctor, `Expected instanceof ${ctor.name}`);

export const number = typeOf('number');

export const boolean = typeOf('boolean');

export const bigint = typeOf('bigint');

export const string = typeOf('string');

export const symbol = typeOf('symbol');

export const fn = typeOf('function');

export const undef = typeOf('undefined');

export const nul = is(null);

export const integer = create(Number.isInteger, 'Expected integer');

export const finite = create(Number.isFinite, 'Expected finite number');

type ArrReturnTypes<T extends ((...args: any) => any)[]> = {
  [I in keyof T]: ReturnType<T[I] extends (...args: any) => any ? T[I] : never>;
};

export const or = <T extends Validator<any>[]>(
  ...validators: T
): Validator<ORError<Exclude<ArrReturnTypes<T>[number], undefined>[]>> => {
  const error = new ORError(
    validators.map((validator) =>
      introspectValidator<ArrReturnTypes<T>[number]>(validator)
    )
  );
  return create(
    (value, ...parents) =>
      validators.some((validator) => !isError(validator(value, ...parents))),
    error
  );
};

export const xor = <T extends Validator<any>[]>(
  ...validators: T
): Validator<ORError<Exclude<ArrReturnTypes<T>[number], undefined>[]>> => {
  const error = new XORError(
    validators.map((validator) =>
      introspectValidator<ArrReturnTypes<T>[number]>(validator)
    )
  );
  return create((value, ...parents) => {
    const passes = validators.reduce<boolean[]>((acc, validator, i) => {
      if (acc.length < 2) {
        const error = validator(value, ...parents);
        if (!isError(error)) {
          acc.push(true);
        }
      }
      return acc;
    }, []);
    return passes.length === 1;
  }, error);
};

export const and = <T extends Validator<any>[]>(
  ...validators: T
): Validator<ANDError<Exclude<ArrReturnTypes<T>[number], undefined>[]>> => {
  const error = new ANDError(
    validators.map((validator) =>
      introspectValidator<ArrReturnTypes<T>[number]>(validator)
    )
  );
  return create(
    (value, ...parents) =>
      validators.every((validator) => !isError(validator(value, ...parents))),
    error
  );
};

// I suspect `array(string)` is going to be more commonly used as most of
// the time you care what is in the array... but this is basically a patch
// on the fact `instanceOf(Array)` isn't reliable.
// It could in theory be written as `array(create(() => true))` but that'd
// return `asStructure(['Expected array'])` err which probably isn't ideal.
export const arr = create(Array.isArray, 'Expected array');

export const maxLength = (len: number) =>
  err(
    and(
      or(string, arr),
      create((value) => (value as any[] | string).length <= len)
    ),
    `Expected max length ${len}`
  );

export const minLength = (len: number) =>
  err(
    and(
      or(string, arr),
      create((value) => (value as any[] | string).length >= len)
    ),
    `Expected min length ${len}`
  );

export const length = (min: number, max: number = min) =>
  err(
    and(minLength(min), maxLength(max)),
    min === max
      ? `Expected length ${min}`
      : `Expected length between ${min} and ${max}`
  );

export const min = (num: number) =>
  err(
    and(
      number,
      create((value) => (value as number) >= num)
    ),
    `Expected min ${num}`
  );

export const max = (num: number) =>
  err(
    and(
      number,
      create((value) => (value as number) <= num)
    ),
    `Expected max ${num}`
  );

export const nullish = err(
  or(typeOf('undefined'), is(null)),
  'Expected nullish'
);

export const includes = (value: any) =>
  err(
    and(
      or(arr, string),
      create((actual) => (actual as string | any[]).includes(value))
    ),
    `Expected to include ${value}`
  );

export const pattern = (regex: RegExp) =>
  err(
    and(
      string,
      create((value) => regex.test(value as string))
    ),
    `Expected to match pattern ${regex}`
  );

export const oneOf = (...allowed: any[]) =>
  err(or(...allowed.map(is)), `Expected one of ${allowed.join(', ')}`);

export const not = <Err>(
  validator: Validator<Err>
): Validator<NegateError<Err>> =>
  create(
    (value, ...parents) => isError(validator(value, ...parents)),
    new NegateError(introspectValidator(validator))
  );

export const array =
  <Err>(
    validator: Validator<Err>
  ): StructValidator<(Err | string | undefined)[] & IStructure> =>
  (value, ...parents) => {
    if (value === INTROSPECT) {
      return asStructure([introspectValidator(validator)]);
    }
    if (!Array.isArray(value)) {
      // NOTE: We could alternatively add an enumerable root symbol to the
      // structural array (like `object`) which means the return value could be
      // `Err | undefined` rather than `Err | string | undefined`.
      return asStructure(['Expected array']);
    }
    return asStructure(value.map((val) => validator(val, value, ...parents)));
  };

export const tuple = <T extends Validator<any>[]>(
  ...validators: T
): StructValidator<
  Exclude<ArrReturnTypes<T>[number] | string, undefined>[] & IStructure
> => {
  if (validators.length < 1) {
    throw new Error('tuple requires as least 1 validator');
  }
  return (value, ...parents) => {
    if (value === INTROSPECT || !Array.isArray(value)) {
      return asStructure(
        validators.map((validator) =>
          introspectValidator<ArrReturnTypes<T>[number]>(validator)
        )
      );
    }
    const count = Math.max(validators.length, value.length);
    return asStructure(
      new Array(count).fill(null).map((_, i) => {
        const validator = validators[i];
        const val = value[i];
        const indexExists = i in value;
        return validator
          ? indexExists
            ? validator(val, value, ...parents)
            : introspectValidator(validator)
          : 'Extraneous element';
      })
    );
  };
};

// Like `and` but error only includes failing clauses and doesn't short circuit evaluation (good for password
// validation UIs or stacked error messages)
export const all = <T extends Validator<any>[]>(
  ...validators: T
): Validator<ANDError<Exclude<ArrReturnTypes<T>[number], undefined>[]>> => {
  return (value, ...parents) => {
    if (value === INTROSPECT) {
      return new ANDError(
        validators.map((validator) =>
          introspectValidator<ArrReturnTypes<T>[number]>(validator)
        )
      );
    }
    const errors = validators
      .map((validator) => validator(value, ...parents))
      .filter((val): val is Exclude<ArrReturnTypes<T>[number], undefined> =>
        isError(val)
      );
    return errors.length ? new ANDError(errors) : undefined;
  };
};

type ObjReturnTypes<T extends Record<keyof T, (...a: any[]) => any>> = {
  [P in keyof T]: ReturnType<T[P]>;
};

export const OBJECT_ROOT = Symbol.for('ok-computer.object-root');

export type ObjectErrorStruct<
  Validators extends Record<any, (...a: any[]) => any>
> = ObjReturnTypes<Validators> & {
  [OBJECT_ROOT]?: string;
} & IStructure;

export const object =
  <
    Validators extends Record<
      keyof Validators,
      (val: any, ...parents: any[]) => any
    >
  >(
    validators: Validators,
    { allowUnknown = false }: { allowUnknown?: boolean } = {}
  ): StructValidator<ObjectErrorStruct<Validators>> =>
  (...parents: unknown[]) => {
    const values = parents[0];
    const introspecting = values === INTROSPECT;
    const ret = asStructure(
      {} as ObjReturnTypes<Validators> & {
        [OBJECT_ROOT]?: string;
      }
    );
    if (introspecting || !isPlainObject(values)) {
      ret[OBJECT_ROOT] = 'Expected object';
    } else if (!allowUnknown) {
      const expectedKeys = Object.keys(validators);
      const actualKeys = Object.keys(values);
      const unknownKeys = actualKeys.filter(
        (key) => !expectedKeys.includes(key)
      );
      if (unknownKeys.length) {
        ret[OBJECT_ROOT] = `Unknown properties ${unknownKeys
          .map((key) => `"${key}"`)
          .join(', ')}`;
      }
    }
    return ownEnumerableEntries(validators).reduce<
      ObjReturnTypes<Validators> & IStructure
    >((errors, [key, validator]) => {
      if (typeof validator !== 'function') {
        throw new Error(`Expected validator to be function ${String(key)}`);
      }
      const value = introspecting ? INTROSPECT : ((values || {}) as any)[key];
      const error = introspecting
        ? // thi doesn't use INTROSPECT so why is it here?
          introspectValidator(validator as Validator)
        : validator(value, ...parents);
      (errors as any)[key] = error;
      return errors;
    }, ret);
  };

export function merge<Err extends IStructure>(
  validator: Validator<Err>
): StructValidator<Err>;
export function merge<Err1 extends IStructure, Err2 extends IStructure>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>
): StructValidator<Err1 & Err2>;
export function merge<
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure
>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>
): StructValidator<Err1 & Err2 & Err3>;
export function merge<
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure,
  Err4 extends IStructure
>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>,
  validator4: Validator<Err4>
): StructValidator<Err1 & Err2 & Err3 & Err4>;
export function merge<
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure,
  Err4 extends IStructure,
  Err5 extends IStructure
>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>,
  validator4: Validator<Err4>,
  validator5: Validator<Err5>
): StructValidator<Err1 & Err2 & Err3 & Err4 & Err5>;
export function merge<
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure,
  Err4 extends IStructure,
  Err5 extends IStructure,
  Err6 extends IStructure
>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>,
  validator4: Validator<Err4>,
  validator5: Validator<Err5>,
  validator6: Validator<Err6>
): StructValidator<Err1 & Err2 & Err3 & Err4 & Err5 & Err6>;
export function merge<
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure,
  Err4 extends IStructure,
  Err5 extends IStructure,
  Err6 extends IStructure,
  Err7 extends IStructure
>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>,
  validator4: Validator<Err4>,
  validator5: Validator<Err5>,
  validator6: Validator<Err6>,
  validator7: Validator<Err7>
): StructValidator<Err1 & Err2 & Err3 & Err4 & Err5 & Err6 & Err7>;
export function merge<
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure,
  Err4 extends IStructure,
  Err5 extends IStructure,
  Err6 extends IStructure,
  Err7 extends IStructure,
  Err8 extends IStructure
>(
  validator1: Validator<Err1>,
  validator2: Validator<Err2>,
  validator3: Validator<Err3>,
  validator4: Validator<Err4>,
  validator5: Validator<Err5>,
  validator6: Validator<Err6>,
  validator7: Validator<Err7>,
  validator8: Validator<Err8>
): StructValidator<Err1 & Err2 & Err3 & Err4 & Err5 & Err6 & Err7 & Err8>;
export function merge(...validators: any[]): any {
  return (value: unknown, ...parents: any[]) => {
    const errors = validators
      .map((validator) => validator(value, ...parents))
      .filter((val) => isError(val));
    return asStructure(Object.assign({}, ...errors));
  };
}

export const when =
  (predicate: (value: unknown, ...parents: any[]) => boolean) =>
  <Err>(validator: Validator<Err>): Validator<Err | string> =>
    create(
      (value, ...parents) =>
        !predicate(value, ...parents) || !isError(validator(value, ...parents)),
      introspectValidator(validator)
    );

export const match = (key: string) =>
  create(
    (value, parent) => parent != null && parent[key] === value,
    `Expected to match ${key}`
  );

export const email = err(
  pattern(
    /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i
  ),
  'Expected email'
);

export const peer =
  (key: string) =>
  <Err>(validator: Validator<Err>): Validator<PeerError<Err | string>> =>
  (value, ...parents) => {
    if (value === INTROSPECT) {
      return new PeerError(key, introspectValidator(validator));
    }
    const err = validator(parents[0] && parents[0][key], ...parents);
    return isError(err) ? new PeerError(key, err as Err) : undefined;
  };

export const andPeers = (...keys: string[]) =>
  or(
    and(nullish, ...keys.map((key) => peer(key)(nullish))),
    and(not(nullish), ...keys.map((key) => peer(key)(not(nullish))))
  );
export const andPeer = (key: string) => andPeers(key);

export const nandPeers = (...keys: string[]) =>
  or(
    and(nullish, ...keys.map((key) => peer(key)(nullish))),
    not(and(not(nullish), ...keys.map((key) => peer(key)(not(nullish)))))
  );
export const nandPeer = (key: string) => nandPeers(key);

export const orPeers = (...keys: string[]) =>
  or(not(nullish), ...keys.map((key) => peer(key)(not(nullish))));
export const orPeer = (key: string) => orPeers(key);

export const xorPeers = (...keys: string[]) =>
  xor(not(nullish), ...keys.map((key) => peer(key)(not(nullish))));
export const xorPeer = (key: string) => xorPeers(key);

export const oxorPeers = (...keys: string[]) =>
  or(
    and(nullish, ...keys.map((key) => peer(key)(nullish))),
    xor(not(nullish), ...keys.map((key) => peer(key)(not(nullish))))
  );
export const oxorPeer = (key: string) => oxorPeers(key);
