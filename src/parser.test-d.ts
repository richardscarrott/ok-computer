import { expectType } from 'tsd-lite';
import { nullWhen, object, trim } from './parser';

const parser = object({
  firstName: trim
});

expectType<undefined>(parser(undefined));

expectType<123>(parser(123));

expectType<'foo'>(parser('foo'));

expectType<Date>(parser(new Date(0)));

expectType<{
  firstName: string | undefined;
}>(parser({}));

expectType<{
  firstName: string | number;
}>(parser({ firstName: 999 }));

interface Value {
  readonly firstName?: string;
}
expectType<{ firstName: string | undefined }>(
  parser({ firstName: '123' } as Value)
);

const locationParser = object({
  lng: (value: string) => Number(value),
  lat: (value: string) => Number(value)
});

expectType<{
  lng: number | undefined;
  lat: number | undefined;
}>(locationParser({}));

const userParser = object({
  firstName: trim,
  lastName: nullWhen(''),
  location: locationParser
});

expectType<{
  firstName: string | undefined;
  lastName: string | null | undefined;
  // Ideally we'd get this.
  // location: { lng: number | undefined; lat: number | undefined } | undefined;
  // But we actually get `location: unknown` as we're unable to get the accurate
  // `ReturnType` of the nested parser because the generic arg `Values` can't
  // be passed in.
  // NOTE: It is possible on `typeof fn<Values[P]>`, just not in Type land
  // https://github.com/microsoft/TypeScript/pull/47607#issuecomment-1058144708
  // Tbh, typing the return type of this parser isn't that important
  // as the most common case is to subsequently push it through a validator which
  // produces the valid type:
  // ```
  //   const parsedValues = parser(values);
  //   assert(parsedValues, validator);
  //   parsedValues // Infer<typeof validator>;
  // ```
  location: unknown;
}>(userParser({}));
