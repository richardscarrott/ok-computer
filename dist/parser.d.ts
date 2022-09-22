declare type Parser = (value: any) => any;
declare const trim: (value: string) => string;
declare const trimEnd: (value: string) => string;
declare const trimStart: (value: string) => string;
declare const uppercase: (value: string) => string;
declare const lowercase: (value: string) => string;
declare const padStart: (padding: number) => (value: string) => string;
declare const padEnd: (padding: number) => (value: string) => string;
declare const split: (splitter: {
    [Symbol.split](string: string, limit?: number | undefined): string[];
}, limit?: number | undefined) => (value: string) => string[];
declare const nullWhen: <T>(nullValue: T) => (value: any) => T | null;
declare const undefinedWhen: <T>(nullValue: T) => (value: any) => T | undefined;
declare type ObjParserResult<Parsers extends Record<keyof Parsers, (value: any) => any>, Value extends Partial<Record<keyof Parsers, any>>> = {
    [P in keyof Parsers]: ReturnType<Parsers[P]> | (Value extends {} ? Value[P] extends {} ? Value[P] : undefined : undefined);
};
interface ObjectOptions {
    readonly keepUnknown?: boolean;
}
declare const object: <Parsers extends Record<keyof Parsers, Parser>>(parsers: Parsers, { keepUnknown }?: ObjectOptions) => <Value extends unknown>(value: Value) => Value extends Partial<Record<keyof Parsers, any>> ? ObjParserResult<Parsers, Value> : Value;
declare const array: <Parser_1 extends (value: any) => any>(parser: Parser_1) => <Value>(value: Value) => Value extends any[] ? (ReturnType<Parser_1> | Value[0])[] : Value;

export { ObjParserResult, ObjectOptions, Parser, array, lowercase, nullWhen, object, padEnd, padStart, split, trim, trimEnd, trimStart, undefinedWhen, uppercase };
