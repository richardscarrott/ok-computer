import {
  object,
  string,
  number,
  and,
  max,
  min,
  length,
  nullish,
  or,
  pattern,
  match,
  integer,
  is,
  array,
  email,
  isError,
  hasError,
  listErrors,
  assert,
  orPeer,
  oneOf,
  err
} from './ok-computer';
import { AssertError } from './errors';

it('works', () => {
  const validator = object({
    username: and(string, length(3, 30)),
    password: or(nullish, pattern(/^[a-zA-Z0-9]{3,30}$/)),
    repeat_password: match('password'),
    access_token: and(or(string, number)),
    birth_year: and(
      or(nullish, and(integer, min(1900), max(2021))),
      orPeer('age')
    ),
    age: and(or(nullish, number), orPeer('birth_year')),
    email: email,
    addresses: array(
      object({
        line1: and(string, length(1, 255)),
        line2: or(is(undefined), and(string, length(1, 255)))
      })
    ),
    country: err(oneOf('US', 'GB'), 'Expected either US or GB')
  });
  const input1 = {
    password: 'erm',
    addresses: [{ line2: false }, null]
  };
  const errors1 = validator(input1);
  expect(isError(errors1)).toBe(true);
  expect(hasError(errors1)).toBe(true);
  expect(() => assert(input1, validator)).toThrowError(
    new AssertError(listErrors(errors1))
  );
  const error = new AssertError(listErrors(errors1));
  expect(error.message).toBe(
    'Invalid: first of 11 errors: username: (Expected typeof string and expected length between 3 and 30)'
  );
  expect(error.errors).toEqual(listErrors(errors1));
  expect(errors1).toMatchInlineSnapshot(`
    {
      "access_token": "(Expected typeof string or expected typeof number)",
      "addresses": [
        {
          "line1": "(Expected typeof string and expected length between 1 and 255)",
          "line2": "(Expected undefined or (Expected typeof string and expected length between 1 and 255))",
        },
        {
          "line1": "(Expected typeof string and expected length between 1 and 255)",
          "line2": undefined,
          Symbol(ok-computer.object-root): "Expected object",
        },
      ],
      "age": "((Expected nullish or expected typeof number) and (not("Expected nullish") or peer "birth_year" not("Expected nullish")))",
      "birth_year": "((Expected nullish or (Expected integer and expected min 1900 and expected max 2021)) and (not("Expected nullish") or peer "age" not("Expected nullish")))",
      "country": "Expected either US or GB",
      "email": "Expected email",
      "password": undefined,
      "repeat_password": "Expected to match password",
      "username": "(Expected typeof string and expected length between 3 and 30)",
    }
  `);
  expect(listErrors(errors1)).toMatchInlineSnapshot(`
    [
      {
        "err": "(Expected typeof string and expected length between 3 and 30)",
        "path": "username",
      },
      {
        "err": "Expected to match password",
        "path": "repeat_password",
      },
      {
        "err": "(Expected typeof string or expected typeof number)",
        "path": "access_token",
      },
      {
        "err": "((Expected nullish or (Expected integer and expected min 1900 and expected max 2021)) and (not("Expected nullish") or peer "age" not("Expected nullish")))",
        "path": "birth_year",
      },
      {
        "err": "((Expected nullish or expected typeof number) and (not("Expected nullish") or peer "birth_year" not("Expected nullish")))",
        "path": "age",
      },
      {
        "err": "Expected email",
        "path": "email",
      },
      {
        "err": "(Expected typeof string and expected length between 1 and 255)",
        "path": "addresses.0.line1",
      },
      {
        "err": "(Expected undefined or (Expected typeof string and expected length between 1 and 255))",
        "path": "addresses.0.line2",
      },
      {
        "err": "(Expected typeof string and expected length between 1 and 255)",
        "path": "addresses.1.line1",
      },
      {
        "err": "Expected object",
        "path": "addresses.1.Symbol(ok-computer.object-root)",
      },
      {
        "err": "Expected either US or GB",
        "path": "country",
      },
    ]
  `);
  const input2 = {
    username: 'lh44',
    password: 'password123',
    repeat_password: 'password123',
    access_token: 123,
    birth_year: 1994,
    email: 'lh44@mercedes.com',
    addresses: [
      {
        line1: '123 Fake street'
      }
    ],
    country: 'GB'
  };
  const errors2 = validator(input2);
  expect(isError(errors2)).toBe(false);
  expect(hasError(errors2)).toBe(false);
  expect(() => assert(input2, validator)).not.toThrow();
  expect(errors2).toMatchInlineSnapshot(`
    {
      "access_token": undefined,
      "addresses": [
        {
          "line1": undefined,
          "line2": undefined,
        },
      ],
      "age": undefined,
      "birth_year": undefined,
      "country": undefined,
      "email": undefined,
      "password": undefined,
      "repeat_password": undefined,
      "username": undefined,
    }
  `);
  expect(listErrors(errors2)).toEqual([]);
});
