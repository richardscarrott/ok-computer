// `ok-computer/parser` is a loosely related module, allowing you to write
// a parser function in a similar style to OK Computer validators.

import { isPlainObject } from './utils.ts';

export type Parser = (value: any) => any;

export const trim = (value: string) => value.trim();
export const trimEnd = (value: string) => value.trimEnd();
export const trimStart = (value: string) => value.trimStart();
export const uppercase = (value: string) => value.toUpperCase();
export const lowercase = (value: string) => value.toLowerCase();
export const padStart = (padding: number) => (value: string) =>
  value.padStart(padding);
export const padEnd = (padding: number) => (value: string) =>
  value.padEnd(padding);
export const split =
  (...args: Parameters<typeof String.prototype.split>) =>
  (value: string) =>
    value.split(...args);
export const nullWhen =
  <T>(nullValue: T) =>
  (value: any): T | null =>
    value === nullValue ? null : value;
export const undefinedWhen =
  <T>(nullValue: T) =>
  (value: any): T | undefined =>
    value === nullValue ? undefined : value;

export type ObjParserResult<
  Parsers extends Record<keyof Parsers, (value: any) => any>,
  Value extends Partial<Record<keyof Parsers, any>>
> = {
  // The property could be the successfully parsed value, the original value (in cases where it failed)
  // or undefined (in cases where no value was passed).
  [P in keyof Parsers]:
    | ReturnType<Parsers[P]>
    | (Value extends {}
        ? Value[P] extends {}
          ? Value[P]
          : undefined
        : undefined);
};

export interface ObjectOptions {
  readonly keepUnknown?: boolean;
}

export const object =
  <Parsers extends Record<keyof Parsers, Parser>>(
    parsers: Parsers,
    { keepUnknown = false }: ObjectOptions = {}
  ) =>
  <Value extends Partial<Record<keyof Parsers, any>> | any>(
    value: Value
  ): Value extends Partial<Record<keyof Parsers, any>>
    ? ObjParserResult<Parsers, Value>
    : Value => {
    if (!isPlainObject(value)) {
      // @ts-ignore
      return value;
    }
    const result = Object.fromEntries(
      Object.entries(parsers).map(([prop, parser]) => {
        const val = (value as { [key: string]: any })?.[prop];
        try {
          return [prop, (parser as Parser)(val)];
        } catch (ex) {
          return [prop, val];
        }
      }, [])
    );

    if (keepUnknown) {
      // @ts-ignore
      return { ...value, ...result };
    }

    // @ts-ignore
    return result;
  };

export const array =
  <Parser extends (value: any) => any>(parser: Parser) =>
  <Value>(
    value: Value
  ): Value extends any[] ? (ReturnType<Parser> | Value[0])[] : Value => {
    if (!Array.isArray(value)) {
      // @ts-ignore
      return value;
    }
    const result = value.map((val) => {
      try {
        return parser(val);
      } catch (ex) {
        return val;
      }
    });
    // @ts-ignore
    return result;
  };
