import { ORError } from './errors';

type UndefinedPropKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];
type UndefinedProps<T> = Pick<T, UndefinedPropKeys<T>>;

// https://github.com/microsoft/TypeScript/issues/32562#issuecomment-515241378
type SelectivePartial<T, K extends keyof T> = Partial<Pick<T, K>> &
  Required<Pick<T, Exclude<keyof T, K>>> extends infer U
  ? { [P in keyof U]: U[P] }
  : never;

export type Validator<Err = unknown, ValidType = unknown> = ((
  value: unknown,
  ...parents: any[]
) => Err | undefined) & { __type: ValidType };

const STRUCTURE = Symbol.for('ok-computer.structure');

export interface IStructure {
  readonly [STRUCTURE]: true;
}

// why is Err and Type the opposite way around from Validator 🙄
export type StructValidator<Err extends IStructure, ValidType = unknown> = ((
  value: unknown,
  ...parents: any[]
) => Err) & { __type: ValidType };

type ObjReturnTypes<T extends Record<keyof T, (...a: any[]) => any>> = {
  [P in keyof T]: ReturnType<T[P]>;
};

export const OBJECT_ROOT = Symbol.for('ok-computer.object-root');

export type ObjectErrorStruct<
  Validators extends Record<any, (...a: any[]) => any>
> = ObjReturnTypes<Validators> & {
  [OBJECT_ROOT]?: string;
} & IStructure;

// TypeScript basically turns off inference if 1 of x generic
// values are passed in; we may have to curry create.
// const create = <Type = any, Err = any>(
//   predicate: (value: unknown, ...parents: any[]) => boolean,
//   err: Err
// ): Validator<Type, Err> => {
//   return {} as any;
// };
const create =
  <T>(predicate: (value: unknown, ...parents: any[]) => boolean) =>
  <Err>(err: Err): Validator<Err, T> => {
    return {} as any;
  };

const typeOf = <T>(str: string) =>
  create<T>((value) => typeof value === str)(`Expected typeof ${str}`);
const number = typeOf<number>('number');
const string = typeOf<string>('string');
const boolean = typeOf<boolean>('boolean');
const undef = typeOf<undefined>('undefined');
const is = <T>(val: any) =>
  create<T>((value) => value === val)(`Expected ${String(val)}`);
const nul = is<null>(null);

type Infer<V extends Validator<any, any>> = V['__type'];

// Or InferRecord?
type _InferObject<T extends Record<any, (val: any, ...parents: any[]) => any>> =
  {
    // https://stackoverflow.com/questions/58860168/is-it-possible-to-make-mapped-type-field-conditionally-optional
    // Need to make `undefined` optional in the interface.
    [P in keyof T]: T[P] extends Validator<any, any> ? Infer<T[P]> : never;
  };
type InferObject<T extends Record<any, (val: any, ...parents: any[]) => any>> =
  SelectivePartial<_InferObject<T>, keyof UndefinedProps<_InferObject<T>>>;

export const object = <
  Validators extends Record<
    keyof Validators,
    (val: any, ...parents: any[]) => any
  >
>(
  validators: Validators,
  { allowUnknown = false }: { allowUnknown?: boolean } = {}
): StructValidator<ObjectErrorStruct<Validators>, InferObject<Validators>> =>
  ({} as any);

type ArrReturnTypes<T extends ((...args: any) => any)[]> = {
  [I in keyof T]: ReturnType<T[I] extends (...args: any) => any ? T[I] : never>;
};

// I've mixed up `or` and `array` here...
export const or = <T extends Validator<any, any>[]>(
  ...validators: T
): Validator<
  ORError<Exclude<ArrReturnTypes<T>[number], undefined>[]>,
  Infer<T[number]>
> => {
  return {} as any;
};

const nullish = or(undef, nul);

const vv = or(undef, string);
const ee = vv('asd');
type VV = Infer<typeof vv>;
const val: VV = {} as any;

const iDontLikeThatAValidatorIsNoLongerJustAFnPurelyBecauseOfTypes: Validator<
  string,
  true
> = (value) => (value === true ? undefined : 'Error');

const personValidator = object({
  name: string,
  age: number,
  // verified: boolean,
  optional: or(nullish, string, number)
});
type Person = Infer<typeof personValidator>;
const person: Person = {
  age: 1,
  name: 'Rich',
  // verified: false,
  optional: ''
};

const annotate =
  <ValidType>() =>
  <V extends Validator<any, any>>(
    validator: V
  ): Validator<ReturnType<V>, ValidType> => {
    return {} as any;
  };
const type = annotate;

const user = object({
  name: string,
  age: number,
  // lame as has to be curried to infer return type
  weight: annotate<string>()(number),
  // I find this pretty grim, I'd rather define an interface, then pass it to object which in turn
  // would ensure it matches (ala Describe); but both options are a good idea like superstruct.
  weight2: type()(number)
});
type User2 = Infer<typeof user>;
const e5 = user({});
e5.weight?.charAt;

/////////// NOTES /////////////

// TODO:
// - [x] `or(string, number)` -> number | string
// - [ ] `and(string, number)` -> string (pick the first?)
// - [x] `object({ id: string, age: number, name: or(undef, string) })` -> { id: string; age: number; name?: undefined | string }

// The lame thing about the Validator<T> & { __type: T } interface is you can no longer just define a fn; womp?

// 1. Infer<typeof validator> can be done, however
//    - I'm not sure it'll be possible to make the `& { __type?: T }` interface optional and still infer whether
//      `T` has undefined in the union, i.e. `undefined | string`.
//      - This would mean you can no longer just write a function; or at least you'd have to cast it.
//    - The lack of partial generic inference make it harder to pass in the valid type and infer errors at the same time,
//      ultimately the fn has to be curried; `create` could logically be curried and `object`, `array`, `or`, `and` etc.
//      will all infer their valid types, so ok there?
// 2. Describe<Person> also doesn't work due to the lack of partial generic inference, but we could do:

// interface Person2 {
//   name: string;
//   age: number;
//   blah: boolean;
// }
// const _person2Validator = object({ name: string, age: number });
// const person2Validator: Validator<
//   { name: number },
//   ReturnType<typeof _person2Validator>
// > = _person2Validator; // invalid
// const person2Validator2: Validator<
//   Person2, // <-- would need to be made required so Describe prob makes most sense here; otherwise optional fields aren't caught 🤔
//   ReturnType<typeof _person2Validator>
// > = _person2Validator; // invalid
// type Describe<Type, Err> = Validator<Type, Err>;

// Separately:
// Could this be wrapped up in a new fn? e.g. `interface<Person>({ name: string })` or `type<Person>({ name: string })`
// Given it could be wrapped in a fn; can that not just happen w/ object anyway, i.e. have current `object` impl renamed to _object
// and do:
// const _obj = object;
// const obj = <T>(input: any) => {
//   const vaidator = object<input>({});
//   return validator as Validator<ReturnType<T, typeof validator>>;
// }
// No I don't think so
// Maybe at least we could have another fn `interface` or `type` which is curried and supports this out the box?
