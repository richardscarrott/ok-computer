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
import {
  isPlainObject,
  ownEnumerableEntries,
  SelectivePartial,
  UndefinedProps
} from './utils.ts';

export type Validator<ValidType = unknown, Err = unknown> = ((
  value: unknown,
  ...parents: any[]
) => Err | undefined) &
  ValidatorTypeMeta<ValidType>;

export type StructValidator<
  ValidType = unknown,
  Err extends IStructure = any
> = ((value: unknown, ...parents: any[]) => Err) & ValidatorTypeMeta<ValidType>;

export type ExtractErr<V extends Validator<any, any>> = Exclude<
  ReturnType<V>,
  undefined
>;

// `__typeMeta` is a compile-time only property used to `Infer` the valid type definition.
// It's optional so that the type accurately describes runtime validators which won't have
// a property called `__typeMeta` and it's nested so we can infer `undefined` correctly.
// https://stackoverflow.com/questions/72402413/is-it-possible-to-make-a-property-required-yet-preserve-undefined
export type ValidatorTypeMeta<ValidType> = {
  readonly __typeMeta?: { readonly validType: ValidType };
};

// Infer<Validator<Error, string>> // string
// Infer<Validator<Error, string | undefined>> // string | undefined
export type Infer<V extends Validator<any, any>> = Exclude<
  V['__typeMeta'],
  undefined
>['validType'];

// Changes the valid type meta e.g.
// const validator: Validator<unknown, Error> = (value) => new Error('Invalid');
// const annotatedValidator = annotate<number>()(validator); // Validator<number, Error>
// type ValidType = Infer<typeof annotatedValidator>; // number
// https://medium.com/@nandin-borjigin/partial-type-argument-inference-in-typescript-and-workarounds-for-it-d7c772788b2e
export const annotate =
  <ValidType>() =>
  <V extends Validator<any, any>>(
    validator: V
  ): Validator<ValidType, ExtractErr<ReturnType<V>>> =>
    validator;

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

export interface AssertErrParams<Err> {
  readonly error: Err;
  readonly errorList: ErrItem<unknown>[];
}

export function assert<V extends Validator>(
  value: unknown,
  validator: V,
  logValue?: true
): asserts value is Infer<V>;
export function assert<V extends Validator>(
  value: unknown,
  validator: V,
  message: string
): asserts value is Infer<V>;
export function assert<V extends Validator>(
  value: unknown,
  validator: V,
  error: Error
): asserts value is Infer<V>;
export function assert<V extends Validator>(
  value: unknown,
  validator: V,
  createError: (params: AssertErrParams<ExtractErr<V>>) => Error | string
): asserts value is Infer<V>;
export function assert(value: any, validator: any, err?: any) {
  const error = validator(value);
  const errorList = listErrors(error);
  if (!errorList.length) {
    return;
  }
  if (typeof err === 'undefined' || err === true) {
    throw new AssertError(errorList, err ? value : undefined);
  }
  const result =
    typeof err === 'function' ? err({ error: error as any, errorList }) : err;
  throw typeof result === 'string' ? new Error(result) : result;
}

const ONE_SIDED = Symbol.for('ok-computer.one-sided');

type OneSided<T> = T & {
  readonly [ONE_SIDED]?: void;
};

export const okay = <V extends Validator>(
  value: unknown,
  validator: V
  // HACK: Err on the side of caution with a "one sided" type guard as in many cases it's
  // unsound to infer the negative case from a validator.
  // https://stackoverflow.com/a/73513991/607471
  // https://github.com/microsoft/TypeScript/issues/15048#issuecomment-534376266
  // https://www.typescriptlang.org/play?#code/PTAEAsBdIBwZwFwjpAhgYwNYHsBuBTAJwDMAbbAdwDp1sBbYARwFd8UBLbAOzmAHYAzAFYAjAAYAHACY+wSAE8Y+ALQBzZqkIATZcx7Y9W0vOVdNhSnF1dOXZQqXL2d-KTgqARoVRd04ALAAUEG0PJCg7HAAyuDYhJBRkITOqqAAvKAAFLiopKwIoD7yAJQFOXn4EXCgKMlcqWkAfKAA3kGgoIT4kMyEXKAO+NjEoOWs6WkZAOS1KVOgAGQLo7msVKT49ZDgoAA8oOIA3EEAvkFBIKAAQqhaIdwooMRcIulZY-gFs-WgAD6gXGYdA8RGK6WabUCHQiI0ykRicQSSRS2VW+GKYMh0Ohl0AoOSgADCcS66EgxgB5ko+C0A2wNWR9Xa2M63V6-Q+VGRdEyxWOUI6J1ArncrSZ2MugBlyUAASV8xPwpPJZkIFgo1NpoAABoDgURNVkACrgSKgWjMUg0jikUigEGFel1VIUdjbUAbLY7fbiYpi6FdHp9FYVTnYACiAA8YNxNpB2LkeXzoWdAsmLmAAOLYbB3QKhR7PKRvVEVL4M1L-HUgwhgpqi-kwrKDYZB8aTabfVTzJYt-DrTaqV3Nb115mgPGE+WK+QUlVUmmQOmajua30df1snuc5Lc3liwXCypY5njokqhVk6ddOioZzVJdlv4AoFVlf1v2swMchcRqNcGNx0gEzHMBQ1nQg91OIIgA
  // NOTE: This isn't necessary for `assert` because, in terms of control flow, it only
  // exposes a positive case.
): value is OneSided<Infer<V>> => {
  if (isError(validator(value))) {
    return false;
  }
  return true;
};

export const withErr =
  <Err, V extends Validator<any, any>>(
    validator: V,
    err: Err
  ): Validator<Infer<V>, Err> =>
  (value: unknown, ...parents: any[]) =>
    isError(validator(value, ...parents)) ? err : undefined;
export const err = withErr;

export const INTROSPECT = Symbol.for('ok-computer.introspect');

export const create =
  <ValidType>(predicate: (value: unknown, ...parents: any[]) => boolean) =>
  <Err>(err: Err): Validator<ValidType, Err> =>
  (value, ...parents) =>
    value === INTROSPECT || !predicate(value, ...parents) ? err : undefined;

const introspectValidator = <Err>(validator: Validator<unknown, Err>) => {
  const error = validator(INTROSPECT);
  if (!isError(error)) {
    throw new Error('Validator introspection failed');
  }
  return error;
};

export const is = <ValidType>(value: ValidType) =>
  create<ValidType>((actual) => actual === value)(`Expected ${String(value)}`);

export const typeOf = <ValidType>(str: string) =>
  create<ValidType>((value) => typeof value === str)(`Expected typeof ${str}`);

export const instanceOf = <T>(ctor: { new (...args: any[]): T }) =>
  create<T>((value) => value instanceof ctor)(
    `Expected instanceof ${ctor.name}`
  );

export const number = typeOf<number>('number');

export const boolean = typeOf<boolean>('boolean');

export const bigint = typeOf<bigint>('bigint');

export const string = typeOf<string>('string');

export const symbol = typeOf<symbol>('symbol');

export const fn = typeOf<Function>('function');

export const undef = typeOf<undefined>('undefined');

export const nul = is(null);

export const integer = create<number>(Number.isInteger)('Expected integer');

export const finite = create<number>(Number.isFinite)('Expected finite number');

type ArrReturnTypes<T extends ((...args: any) => any)[]> = {
  [I in keyof T]: ReturnType<T[I] extends (...args: any) => any ? T[I] : never>;
};

export const or = <V extends Validator<any, any>[]>(
  ...validators: V
): Validator<
  Infer<V[number]>,
  ORError<Exclude<ArrReturnTypes<V>[number], undefined>[]>
> => {
  const error = new ORError(
    validators.map((validator) =>
      introspectValidator<ArrReturnTypes<V>[number]>(validator)
    )
  );
  return create((value, ...parents) =>
    validators.some((validator) => !isError(validator(value, ...parents)))
  )(error);
};

export const xor = <V extends Validator<any, any>[]>(
  ...validators: V
): Validator<
  Infer<V[number]>,
  XORError<Exclude<ArrReturnTypes<V>[number], undefined>[]>
> => {
  const error = new XORError(
    validators.map((validator) =>
      introspectValidator<ArrReturnTypes<V>[number]>(validator)
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
  })(error);
};

export const and = <V extends Validator<any, any>[]>(
  ...validators: V
): Validator<
  Infer<V[0]>,
  ANDError<Exclude<ArrReturnTypes<V>[number], undefined>[]>
> => {
  const error = new ANDError(
    validators.map((validator) =>
      introspectValidator<ArrReturnTypes<V>[number]>(validator)
    )
  );
  return create((value, ...parents) =>
    validators.every((validator) => !isError(validator(value, ...parents)))
  )(error);
};

// I suspect `array(string)` is going to be more commonly used as most of
// the time you care what is in the array... but this is basically a patch
// on the fact `instanceOf(Array)` isn't reliable.
// It could in theory be written as `array(create(() => true))` but that'd
// return `asStructure(['Expected array'])` err which probably isn't ideal.
export const arr = create<unknown[]>(Array.isArray)('Expected array');

export const maxLength = (len: number) =>
  err(
    and(
      or(string, arr),
      create((value) => (value as any[] | string).length <= len)('Invalid')
    ),
    `Expected max length ${len}`
  );

export const minLength = (len: number) =>
  err(
    and(
      or(string, arr),
      create((value) => (value as any[] | string).length >= len)('Invalid')
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
    and(number, create((value) => (value as number) >= num)('Invalid')),
    `Expected min ${num}`
  );

export const max = (num: number) =>
  err(
    and(number, create((value) => (value as number) <= num)('Invalid')),
    `Expected max ${num}`
  );

export const nullish = err(or(undef, nul), 'Expected nullish');

export const includes = (value: any) =>
  err(
    and(
      or(arr, string),
      create((actual) => (actual as string | any[]).includes(value))('Invalid')
    ),
    `Expected to include ${value}`
  );

export const pattern = (regex: RegExp) =>
  err(
    and(string, create((value) => regex.test(value as string))('Invalid')),
    `Expected to match pattern ${regex}`
  );

export const oneOf = <T extends any[]>(...allowed: T) =>
  err(
    or(...allowed.map((val) => is<T[number]>(val))),
    `Expected one of ${allowed.join(', ')}`
  );

export const not = <ValidType, Err>(
  validator: Validator<unknown, Err>
): Validator<ValidType, NegateError<Err>> =>
  create<ValidType>((value, ...parents) =>
    isError(validator(value, ...parents))
  )(new NegateError(introspectValidator(validator)));

export type ArrayErrorStruct<V extends Validator<any, any>> = (
  | ExtractErr<V>
  | string
  | undefined
)[] &
  IStructure;

export const array =
  <V extends Validator<any, any>>(
    validator: V
  ): StructValidator<Infer<V>[], ArrayErrorStruct<V>> =>
  (value, ...parents) => {
    if (value === INTROSPECT) {
      const err: ArrayErrorStruct<V> = asStructure([
        introspectValidator(validator)
      ]);
      return err;
    }
    if (!Array.isArray(value)) {
      // NOTE: We could alternatively add an enumerable root symbol to the
      // structural array (like `object`) which means the return value could be
      // `Err | undefined` rather than `Err | string | undefined`.
      const err: ArrayErrorStruct<V> = asStructure(['Expected array']);
      return err;
    }
    const err: ArrayErrorStruct<V> = asStructure(
      value.map((val) => validator(val, value, ...parents))
    );
    return err;
  };

export type TupleErrorStruct<V extends Validator<any, any>[]> = Exclude<
  ArrReturnTypes<V>[number] | string,
  undefined
>[] &
  IStructure;

// TODO: Figure out how to Infer a tuple type, i.e.
// Infer<typeof tuple(string, number, boolean)> // (string | number | boolean)[] ❌
// Infer<typeof tuple(string, number, boolean)> // [string, number, boolean] ✅
// (I've tried a few ideas from GitHub / StackOverflow but `boolean` is incorrectly expanded to [true, false] 🤔)
// https://stackoverflow.com/questions/69571110/how-to-turn-union-into-a-tuple-in-typescript
// https://github.com/microsoft/TypeScript/issues/13298#issuecomment-885980381
export const tuple = <V extends Validator<any, any>[]>(
  ...validators: V
): StructValidator<Infer<V[number]>[], TupleErrorStruct<V>> => {
  if (validators.length < 1) {
    throw new Error('tuple requires as least 1 validator');
  }
  return (value, ...parents) => {
    if (value === INTROSPECT || !Array.isArray(value)) {
      return asStructure(
        validators.map((validator) =>
          introspectValidator<ArrReturnTypes<V>[number]>(validator)
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
export const all = <V extends Validator<any, any>[]>(
  ...validators: V
): Validator<
  Infer<V[0]>,
  ANDError<Exclude<ArrReturnTypes<V>[number], undefined>[]>
> => {
  return (value, ...parents) => {
    if (value === INTROSPECT) {
      return new ANDError(
        validators.map((validator) =>
          introspectValidator<ArrReturnTypes<V>[number]>(validator)
        )
      );
    }
    const errors = validators
      .map((validator) => validator(value, ...parents))
      .filter((val): val is Exclude<ArrReturnTypes<V>[number], undefined> =>
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

type _InferObject<T extends Record<any, (val: any, ...parents: any[]) => any>> =
  {
    [P in keyof T]: T[P] extends Validator<any, any> ? Infer<T[P]> : never;
  };
type InferObject<T extends Record<any, (val: any, ...parents: any[]) => any>> =
  SelectivePartial<_InferObject<T>, keyof UndefinedProps<_InferObject<T>>>;

export const object =
  <
    Validators extends Record<
      keyof Validators,
      (val: any, ...parents: any[]) => any
    >
  >(
    validators: Validators,
    { allowUnknown = false }: { allowUnknown?: boolean } = {}
  ): StructValidator<InferObject<Validators>, ObjectErrorStruct<Validators>> =>
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

export function merge<ValidType, Err extends IStructure>(
  validator: Validator<ValidType, Err>
): StructValidator<ValidType, Err>;
export function merge<
  ValidType1,
  ValidType2,
  Err1 extends IStructure,
  Err2 extends IStructure
>(
  validator1: Validator<ValidType1, Err1>,
  validator2: Validator<ValidType2, Err2>
): StructValidator<ValidType1 & ValidType2, Err1 & Err2>;
export function merge<
  ValidType1,
  ValidType2,
  ValidType3,
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure
>(
  validator1: Validator<ValidType1, Err1>,
  validator2: Validator<ValidType2, Err2>,
  validator3: Validator<ValidType3, Err3>
): StructValidator<ValidType1 & ValidType2 & ValidType3, Err1 & Err2 & Err3>;
export function merge<
  ValidType1,
  ValidType2,
  ValidType3,
  ValidType4,
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure,
  Err4 extends IStructure
>(
  validator1: Validator<ValidType1, Err1>,
  validator2: Validator<ValidType2, Err2>,
  validator3: Validator<ValidType3, Err3>,
  validator4: Validator<ValidType4, Err4>
): StructValidator<
  ValidType1 & ValidType2 & ValidType3 & ValidType4,
  Err1 & Err2 & Err3 & Err4
>;
export function merge<
  ValidType1,
  ValidType2,
  ValidType3,
  ValidType4,
  ValidType5,
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure,
  Err4 extends IStructure,
  Err5 extends IStructure
>(
  validator1: Validator<ValidType1, Err1>,
  validator2: Validator<ValidType2, Err2>,
  validator3: Validator<ValidType3, Err3>,
  validator4: Validator<ValidType4, Err4>,
  validator5: Validator<ValidType5, Err5>
): StructValidator<
  ValidType1 & ValidType2 & ValidType3 & ValidType4 & ValidType5,
  Err1 & Err2 & Err3 & Err4 & Err5
>;
export function merge<
  ValidType1,
  ValidType2,
  ValidType3,
  ValidType4,
  ValidType5,
  ValidType6,
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure,
  Err4 extends IStructure,
  Err5 extends IStructure,
  Err6 extends IStructure
>(
  validator1: Validator<ValidType1, Err1>,
  validator2: Validator<ValidType2, Err2>,
  validator3: Validator<ValidType3, Err3>,
  validator4: Validator<ValidType4, Err4>,
  validator5: Validator<ValidType5, Err5>,
  validator6: Validator<ValidType6, Err6>
): StructValidator<
  ValidType1 & ValidType2 & ValidType3 & ValidType4 & ValidType5 & ValidType6,
  Err1 & Err2 & Err3 & Err4 & Err5 & Err6
>;
export function merge<
  ValidType1,
  ValidType2,
  ValidType3,
  ValidType4,
  ValidType5,
  ValidType6,
  ValidType7,
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure,
  Err4 extends IStructure,
  Err5 extends IStructure,
  Err6 extends IStructure,
  Err7 extends IStructure
>(
  validator1: Validator<ValidType1, Err1>,
  validator2: Validator<ValidType2, Err2>,
  validator3: Validator<ValidType3, Err3>,
  validator4: Validator<ValidType4, Err4>,
  validator5: Validator<ValidType5, Err5>,
  validator6: Validator<ValidType6, Err6>,
  validator7: Validator<ValidType7, Err7>
): StructValidator<
  ValidType1 &
    ValidType2 &
    ValidType3 &
    ValidType4 &
    ValidType5 &
    ValidType6 &
    ValidType7,
  Err1 & Err2 & Err3 & Err4 & Err5 & Err6 & Err7
>;
export function merge<
  ValidType1,
  ValidType2,
  ValidType3,
  ValidType4,
  ValidType5,
  ValidType6,
  ValidType7,
  ValidType8,
  Err1 extends IStructure,
  Err2 extends IStructure,
  Err3 extends IStructure,
  Err4 extends IStructure,
  Err5 extends IStructure,
  Err6 extends IStructure,
  Err7 extends IStructure,
  Err8 extends IStructure
>(
  validator1: Validator<ValidType1, Err1>,
  validator2: Validator<ValidType2, Err2>,
  validator3: Validator<ValidType3, Err3>,
  validator4: Validator<ValidType4, Err4>,
  validator5: Validator<ValidType5, Err5>,
  validator6: Validator<ValidType6, Err6>,
  validator7: Validator<ValidType7, Err7>,
  validator8: Validator<ValidType8, Err8>
): StructValidator<
  ValidType1 &
    ValidType2 &
    ValidType3 &
    ValidType4 &
    ValidType5 &
    ValidType6 &
    ValidType7 &
    ValidType8,
  Err1 & Err2 & Err3 & Err4 & Err5 & Err6 & Err7 & Err8
>;
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
  <ValidType, Err>(validator: Validator<ValidType, Err>) =>
    create<ValidType>(
      (value, ...parents) =>
        !predicate(value, ...parents) || !isError(validator(value, ...parents))
    )(introspectValidator(validator));

export const match = (key: string) =>
  create((value, parent) => parent != null && parent[key] === value)(
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
  <Err>(
    validator: Validator<unknown, Err>
  ): Validator<unknown, PeerError<Err>> =>
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

// `exists` is an alias for `not(nullish)` with a more accurate valid type.
// Allows `okay` and `assert` to infer the positive case without a specific validator, e.g.
// const fn = (foo?: { id: string }) => {
//   assert(foo, exists);
//   foo.id.startsWith('bar');
// };
// It allows ok computers' `assert` fn to handle the common assert case provided by node et al.
export const exists = not<{}, ExtractErr<typeof nullish>>(nullish);

export const truthy = create<{}>((value) => !!value)('Expected truthy value');

export type Falsy = false | null | undefined | '' | number; // `number` covers `0` and `NaN`
export const falsy = create<Falsy>((value) => !value)('Expected falsy value');
