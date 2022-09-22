interface IError<T = unknown> {
    readonly toPrimitiveError: () => T;
}
declare const STRUCTURE: unique symbol;
interface IStructure {
    readonly [STRUCTURE]: true;
}
interface ILogicalOperator<T> {
    readonly type: string;
    readonly operator: string;
    readonly errors: T[];
}
declare class LogicalOperatorError<T extends any[]> implements ILogicalOperator<T>, IError<ILogicalOperator<T> | string> {
    type: string;
    operator: string;
    errors: T;
    constructor(operator: string, errors: T);
    toPrimitiveError(): string | ILogicalOperator<T>;
    toJSON(): string | ILogicalOperator<T>;
    toString(): string;
}
declare class ORError<T extends any[]> extends LogicalOperatorError<T> {
    constructor(errors: T);
}
declare class ANDError<T extends any[]> extends LogicalOperatorError<T> {
    constructor(errors: T);
}
declare class XORError<T extends any[]> extends LogicalOperatorError<T> {
    constructor(errors: T);
}
interface IPeerError<T> {
    readonly type: string;
    readonly key: string;
    readonly error: T;
}
declare class PeerError<T> implements IPeerError<T>, IError<IPeerError<T> | string> {
    type: string;
    key: string;
    error: T;
    constructor(key: string, error: T);
    toPrimitiveError(): string | IPeerError<T>;
    toJSON(): string | IPeerError<T>;
    toString(): string;
}
interface INegateError<T> {
    readonly type: string;
    readonly error: T;
}
declare class NegateError<T> implements INegateError<T>, IError<INegateError<T> | string> {
    type: string;
    error: T;
    constructor(error: T);
    toPrimitiveError(): string | INegateError<T>;
    toJSON(): string | INegateError<T>;
    toString(): string;
}

declare type SelectivePartial<T, K extends keyof T> = Partial<Pick<T, K>> & Required<Pick<T, Exclude<keyof T, K>>> extends infer U ? {
    [P in keyof U]: U[P];
} : never;

declare type Validator<ValidType = unknown, Err = unknown> = ((value: unknown, ...parents: any[]) => Err | undefined) & ValidatorTypeMeta<ValidType>;
declare type StructValidator<ValidType = unknown, Err extends IStructure = any> = ((value: unknown, ...parents: any[]) => Err) & ValidatorTypeMeta<ValidType>;
declare type ExtractErr<V extends Validator<any, any>> = Exclude<ReturnType<V>, undefined>;
declare type ValidatorTypeMeta<ValidType> = {
    readonly __typeMeta?: {
        readonly validType: ValidType;
    };
};
declare type Infer<V extends Validator<any, any>> = Exclude<V['__typeMeta'], undefined>['validType'];
declare const annotate: <ValidType>() => <V extends Validator<any, any>>(validator: V) => Validator<ValidType, Exclude<ReturnType<ReturnType<V>>, undefined>>;
interface ErrItem<Err> {
    readonly path: string;
    readonly err: Err;
}
declare const listErrors: <Err>(err: any) => ErrItem<Err>[];
declare const isError: <Err>(err: Err) => err is Exclude<Err, undefined>;
declare const hasError: <Err>(err: Err) => err is Exclude<Err, undefined>;
interface AssertErrParams<Err> {
    readonly error: Err;
    readonly errorList: ErrItem<unknown>[];
}
declare function assert<V extends Validator>(value: unknown, validator: V, err?: Error | string | ((params: AssertErrParams<ExtractErr<V>>) => Error | string)): asserts value is Infer<V>;
declare const ONE_SIDED: unique symbol;
declare type OneSided<T> = T & {
    readonly [ONE_SIDED]?: void;
};
declare const okay: <V extends Validator<unknown, unknown>>(value: unknown, validator: V) => value is OneSided<Infer<V>>;
declare const withErr: <Err, V extends Validator<any, any>>(validator: V, err: Err) => Validator<Infer<V>, Err>;
declare const err: <Err, V extends Validator<any, any>>(validator: V, err: Err) => Validator<Infer<V>, Err>;
declare const INTROSPECT: unique symbol;
declare const create: <ValidType>(predicate: (value: unknown, ...parents: any[]) => boolean) => <Err>(err: Err) => Validator<ValidType, Err>;
declare const is: <ValidType>(value: any) => Validator<ValidType, string>;
declare const typeOf: <ValidType>(str: string) => Validator<ValidType, string>;
declare const instanceOf: <T extends Function>(ctor: T) => Validator<T, string>;
declare const number: Validator<number, string>;
declare const boolean: Validator<boolean, string>;
declare const bigint: Validator<bigint, string>;
declare const string: Validator<string, string>;
declare const symbol: Validator<symbol, string>;
declare const fn: Validator<Function, string>;
declare const undef: Validator<undefined, string>;
declare const nul: Validator<null, string>;
declare const integer: Validator<number, string>;
declare const finite: Validator<number, string>;
declare type ArrReturnTypes<T extends ((...args: any) => any)[]> = {
    [I in keyof T]: ReturnType<T[I] extends (...args: any) => any ? T[I] : never>;
};
declare const or: <V extends Validator<any, any>[]>(...validators: V) => Validator<Infer<V[number]>, ORError<Exclude<ArrReturnTypes<V>[number], undefined>[]>>;
declare const xor: <V extends Validator<any, any>[]>(...validators: V) => Validator<Infer<V[number]>, XORError<Exclude<ArrReturnTypes<V>[number], undefined>[]>>;
declare const and: <V extends Validator<any, any>[]>(...validators: V) => Validator<Infer<V[0]>, ANDError<Exclude<ArrReturnTypes<V>[number], undefined>[]>>;
declare const arr: Validator<unknown[], string>;
declare const maxLength: (len: number) => Validator<string | unknown[], string>;
declare const minLength: (len: number) => Validator<string | unknown[], string>;
declare const length: (min: number, max?: number) => Validator<string | unknown[], string>;
declare const min: (num: number) => Validator<number, string>;
declare const max: (num: number) => Validator<number, string>;
declare const nullish: Validator<null | undefined, string>;
declare const includes: (value: any) => Validator<string | unknown[], string>;
declare const pattern: (regex: RegExp) => Validator<string, string>;
declare const oneOf: <T>(...allowed: any[]) => Validator<T, string>;
declare const not: <ValidType, Err>(validator: Validator<unknown, Err>) => Validator<ValidType, NegateError<Err>>;
declare type ArrayErrorStruct<V extends Validator<any, any>> = (ExtractErr<V> | string | undefined)[] & IStructure;
declare const array: <V extends Validator<any, any>>(validator: V) => StructValidator<Infer<V>[], ArrayErrorStruct<V>>;
declare type TupleErrorStruct<V extends Validator<any, any>[]> = Exclude<ArrReturnTypes<V>[number] | string, undefined>[] & IStructure;
declare const tuple: <V extends Validator<any, any>[]>(...validators: V) => StructValidator<Infer<V[number]>[], TupleErrorStruct<V>>;
declare const all: <V extends Validator<any, any>[]>(...validators: V) => Validator<Infer<V[0]>, ANDError<Exclude<ArrReturnTypes<V>[number], undefined>[]>>;
declare type ObjReturnTypes<T extends Record<keyof T, (...a: any[]) => any>> = {
    [P in keyof T]: ReturnType<T[P]>;
};
declare const OBJECT_ROOT: unique symbol;
declare type ObjectErrorStruct<Validators extends Record<any, (...a: any[]) => any>> = ObjReturnTypes<Validators> & {
    [OBJECT_ROOT]?: string;
} & IStructure;
declare type _InferObject<T extends Record<any, (val: any, ...parents: any[]) => any>> = {
    [P in keyof T]: T[P] extends Validator<any, any> ? Infer<T[P]> : never;
};
declare const object: <Validators extends Record<keyof Validators, (val: any, ...parents: any[]) => any>>(validators: Validators, { allowUnknown }?: {
    allowUnknown?: boolean | undefined;
}) => StructValidator<SelectivePartial<_InferObject<Validators>, (_InferObject<Validators> extends infer T ? { [K in keyof T]-?: undefined extends _InferObject<Validators>[K] ? K : never; } : never)[keyof Validators]>, ObjectErrorStruct<Validators>>;
declare function merge<ValidType, Err extends IStructure>(validator: Validator<ValidType, Err>): StructValidator<ValidType, Err>;
declare function merge<ValidType1, ValidType2, Err1 extends IStructure, Err2 extends IStructure>(validator1: Validator<ValidType1, Err1>, validator2: Validator<ValidType2, Err2>): StructValidator<ValidType1 & ValidType2, Err1 & Err2>;
declare function merge<ValidType1, ValidType2, ValidType3, Err1 extends IStructure, Err2 extends IStructure, Err3 extends IStructure>(validator1: Validator<ValidType1, Err1>, validator2: Validator<ValidType2, Err2>, validator3: Validator<ValidType3, Err3>): StructValidator<ValidType1 & ValidType2 & ValidType3, Err1 & Err2 & Err3>;
declare function merge<ValidType1, ValidType2, ValidType3, ValidType4, Err1 extends IStructure, Err2 extends IStructure, Err3 extends IStructure, Err4 extends IStructure>(validator1: Validator<ValidType1, Err1>, validator2: Validator<ValidType2, Err2>, validator3: Validator<ValidType3, Err3>, validator4: Validator<ValidType4, Err4>): StructValidator<ValidType1 & ValidType2 & ValidType3 & ValidType4, Err1 & Err2 & Err3 & Err4>;
declare function merge<ValidType1, ValidType2, ValidType3, ValidType4, ValidType5, Err1 extends IStructure, Err2 extends IStructure, Err3 extends IStructure, Err4 extends IStructure, Err5 extends IStructure>(validator1: Validator<ValidType1, Err1>, validator2: Validator<ValidType2, Err2>, validator3: Validator<ValidType3, Err3>, validator4: Validator<ValidType4, Err4>, validator5: Validator<ValidType5, Err5>): StructValidator<ValidType1 & ValidType2 & ValidType3 & ValidType4 & ValidType5, Err1 & Err2 & Err3 & Err4 & Err5>;
declare function merge<ValidType1, ValidType2, ValidType3, ValidType4, ValidType5, ValidType6, Err1 extends IStructure, Err2 extends IStructure, Err3 extends IStructure, Err4 extends IStructure, Err5 extends IStructure, Err6 extends IStructure>(validator1: Validator<ValidType1, Err1>, validator2: Validator<ValidType2, Err2>, validator3: Validator<ValidType3, Err3>, validator4: Validator<ValidType4, Err4>, validator5: Validator<ValidType5, Err5>, validator6: Validator<ValidType6, Err6>): StructValidator<ValidType1 & ValidType2 & ValidType3 & ValidType4 & ValidType5 & ValidType6, Err1 & Err2 & Err3 & Err4 & Err5 & Err6>;
declare function merge<ValidType1, ValidType2, ValidType3, ValidType4, ValidType5, ValidType6, ValidType7, Err1 extends IStructure, Err2 extends IStructure, Err3 extends IStructure, Err4 extends IStructure, Err5 extends IStructure, Err6 extends IStructure, Err7 extends IStructure>(validator1: Validator<ValidType1, Err1>, validator2: Validator<ValidType2, Err2>, validator3: Validator<ValidType3, Err3>, validator4: Validator<ValidType4, Err4>, validator5: Validator<ValidType5, Err5>, validator6: Validator<ValidType6, Err6>, validator7: Validator<ValidType7, Err7>): StructValidator<ValidType1 & ValidType2 & ValidType3 & ValidType4 & ValidType5 & ValidType6 & ValidType7, Err1 & Err2 & Err3 & Err4 & Err5 & Err6 & Err7>;
declare function merge<ValidType1, ValidType2, ValidType3, ValidType4, ValidType5, ValidType6, ValidType7, ValidType8, Err1 extends IStructure, Err2 extends IStructure, Err3 extends IStructure, Err4 extends IStructure, Err5 extends IStructure, Err6 extends IStructure, Err7 extends IStructure, Err8 extends IStructure>(validator1: Validator<ValidType1, Err1>, validator2: Validator<ValidType2, Err2>, validator3: Validator<ValidType3, Err3>, validator4: Validator<ValidType4, Err4>, validator5: Validator<ValidType5, Err5>, validator6: Validator<ValidType6, Err6>, validator7: Validator<ValidType7, Err7>, validator8: Validator<ValidType8, Err8>): StructValidator<ValidType1 & ValidType2 & ValidType3 & ValidType4 & ValidType5 & ValidType6 & ValidType7 & ValidType8, Err1 & Err2 & Err3 & Err4 & Err5 & Err6 & Err7 & Err8>;
declare const when: (predicate: (value: unknown, ...parents: any[]) => boolean) => <ValidType, Err>(validator: Validator<ValidType, Err>) => Validator<ValidType, Exclude<Err, undefined>>;
declare const match: (key: string) => Validator<unknown, string>;
declare const email: Validator<string, string>;
declare const peer: (key: string) => <Err>(validator: Validator<unknown, Err>) => Validator<unknown, PeerError<Err>>;
declare const andPeers: (...keys: string[]) => Validator<unknown, ORError<(ANDError<(string | PeerError<string>)[]> | ANDError<(NegateError<string> | PeerError<NegateError<string>>)[]>)[]>>;
declare const andPeer: (key: string) => Validator<unknown, ORError<(ANDError<(string | PeerError<string>)[]> | ANDError<(NegateError<string> | PeerError<NegateError<string>>)[]>)[]>>;
declare const nandPeers: (...keys: string[]) => Validator<unknown, ORError<(ANDError<(string | PeerError<string>)[]> | NegateError<ANDError<(NegateError<string> | PeerError<NegateError<string>>)[]>>)[]>>;
declare const nandPeer: (key: string) => Validator<unknown, ORError<(ANDError<(string | PeerError<string>)[]> | NegateError<ANDError<(NegateError<string> | PeerError<NegateError<string>>)[]>>)[]>>;
declare const orPeers: (...keys: string[]) => Validator<unknown, ORError<(NegateError<string> | PeerError<NegateError<string>>)[]>>;
declare const orPeer: (key: string) => Validator<unknown, ORError<(NegateError<string> | PeerError<NegateError<string>>)[]>>;
declare const xorPeers: (...keys: string[]) => Validator<unknown, XORError<(NegateError<string> | PeerError<NegateError<string>>)[]>>;
declare const xorPeer: (key: string) => Validator<unknown, XORError<(NegateError<string> | PeerError<NegateError<string>>)[]>>;
declare const oxorPeers: (...keys: string[]) => Validator<unknown, ORError<(ANDError<(string | PeerError<string>)[]> | XORError<(NegateError<string> | PeerError<NegateError<string>>)[]>)[]>>;
declare const oxorPeer: (key: string) => Validator<unknown, ORError<(ANDError<(string | PeerError<string>)[]> | XORError<(NegateError<string> | PeerError<NegateError<string>>)[]>)[]>>;
declare const exists: Validator<{}, NegateError<string>>;
declare const truthy: Validator<{}, string>;
declare type Falsy = false | null | undefined | '' | number;
declare const falsy: Validator<Falsy, string>;

export { ArrayErrorStruct, AssertErrParams, ErrItem, ExtractErr, Falsy, INTROSPECT, Infer, OBJECT_ROOT, ObjectErrorStruct, StructValidator, TupleErrorStruct, Validator, ValidatorTypeMeta, all, and, andPeer, andPeers, annotate, arr, array, assert, bigint, boolean, create, email, err, exists, falsy, finite, fn, hasError, includes, instanceOf, integer, is, isError, length, listErrors, match, max, maxLength, merge, min, minLength, nandPeer, nandPeers, not, nul, nullish, number, object, okay, oneOf, or, orPeer, orPeers, oxorPeer, oxorPeers, pattern, peer, string, symbol, truthy, tuple, typeOf, undef, when, withErr, xor, xorPeer, xorPeers };
