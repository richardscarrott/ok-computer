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
  ValidationError,
  $object,
  $and,
  $length,
  $or,
  $nullish,
  $pattern,
  $match,
  $string,
  $number,
  $integer,
  $min,
  $max,
  $array,
  $is,
  $email
} from './ok-computer';

describe('Built-in errors', () => {
  it('works', () => {
    const validator = object({
      username: and(string, length(3, 30)),
      password: or(nullish, pattern(/^[a-zA-Z0-9]{3,30}$/)),
      repeat_password: match('password'),
      access_token: or(string, number),
      birth_year: and(integer, min(1900), max(2021)),
      email: email,
      addresses: array(
        object({
          line1: and(string, length(1, 255)),
          line2: or(is(undefined), and(string, length(1, 255)))
        })
      )
    });
    const errors1 = validator({
      password: 'erm',
      addresses: [{ line2: false }, null]
    });
    expect(isError(errors1)).toBe(true);
    expect(hasError(errors1)).toBe(true);
    // Maybe just check this in as an 'integration' test?
    // TODO: Move ValidationError tests to baddie.test.ts
    expect(() => assert(errors1)).toThrow(
      new ValidationError(listErrors(errors1))
    );
    const err = new ValidationError(listErrors(errors1));
    expect(err.message).toBe(
      'Invalid: first of 9 errors: username: (Expected string and expected length between 3 and 30)'
    );
    expect(err.errors).toEqual(listErrors(errors1));
    expect(errors1).toMatchInlineSnapshot(`
        Object {
          "access_token": "(Expected string or expected number)",
          "addresses": Array [
            Object {
              "line1": "(Expected string and expected length between 1 and 255)",
              "line2": "(Expected undefined or (Expected string and expected length between 1 and 255))",
              Symbol(structure): true,
            },
            Object {
              "__root": "Expected object",
              "line1": "(Expected string and expected length between 1 and 255)",
              "line2": undefined,
              Symbol(structure): true,
            },
          ],
          "birth_year": "(Expected integer and expected min 1900 and expected max 2021)",
          "email": "Expected email",
          "password": undefined,
          "repeat_password": "Expected to match password",
          "username": "(Expected string and expected length between 3 and 30)",
          Symbol(structure): true,
        }
      `);
    expect(listErrors(errors1)).toMatchInlineSnapshot(`
        Array [
          Object {
            "err": "(Expected string and expected length between 3 and 30)",
            "path": "username",
          },
          Object {
            "err": "Expected to match password",
            "path": "repeat_password",
          },
          Object {
            "err": "(Expected string or expected number)",
            "path": "access_token",
          },
          Object {
            "err": "(Expected integer and expected min 1900 and expected max 2021)",
            "path": "birth_year",
          },
          Object {
            "err": "Expected email",
            "path": "email",
          },
          Object {
            "err": "(Expected string and expected length between 1 and 255)",
            "path": "addresses.0.line1",
          },
          Object {
            "err": "(Expected undefined or (Expected string and expected length between 1 and 255))",
            "path": "addresses.0.line2",
          },
          Object {
            "err": "Expected object",
            "path": "addresses.1.__root",
          },
          Object {
            "err": "(Expected string and expected length between 1 and 255)",
            "path": "addresses.1.line1",
          },
        ]
      `);
    const errors2 = validator({
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
      ]
    });
    expect(isError(errors2)).toBe(false);
    expect(hasError(errors2)).toBe(false);
    expect(() => assert(errors2)).not.toThrow();
    expect(errors2).toMatchInlineSnapshot(`
        Object {
          "access_token": undefined,
          "addresses": Array [
            Object {
              "line1": undefined,
              "line2": undefined,
              Symbol(structure): true,
            },
          ],
          "birth_year": undefined,
          "email": undefined,
          "password": undefined,
          "repeat_password": undefined,
          "username": undefined,
          Symbol(structure): true,
        }
      `);
    expect(listErrors(errors2)).toEqual([]);
  });
});

describe('Custom errors', () => {
  it('works', () => {
    interface CustomError {
      readonly message: string;
    }
    const err = (message: string): CustomError => ({ message });
    const addressValidator = $object({
      line1: $and($string, $length(1, 255))(err('Invalid line 1')),
      line2: $or(
        $is(undefined),
        $and($string, $length(1, 255))
      )(err('Invalid line 2'))
    })(err('Invalid address'));
    const validator = $object({
      username: $and($string, $length(3, 30))(err('Invalid username')),
      password: $or(
        $nullish,
        $pattern(/^[a-zA-Z0-9]{3,30}$/)
      )(err('Invalid password')),
      repeat_password: $match('password')(err('Invalid repeat_password')),
      access_token: $or($string, $number)(err('Invalid access_token')),
      birth_year: $and(
        $integer,
        $min(1900),
        $max(2021)
      )(err('Invalid birth_year')),
      email: $email(err('Invalid email')),
      addresses: $array<ReturnType<typeof addressValidator> | CustomError>(
        addressValidator
      )(err('Invalid addresses'))
    })(err('Invalid object'));
    const errors1 = validator({
      password: 'erm',
      addresses: [{ line2: false }, null]
    });
    expect(isError(errors1)).toBe(true);
    expect(hasError(errors1)).toBe(true);
    // Maybe just check this in as an 'integration' test?
    // TODO: Move ValidationError tests to baddie.test.ts
    expect(() => assert(errors1)).toThrow(
      new ValidationError(listErrors(errors1))
    );
    const validationError = new ValidationError(listErrors(errors1));
    expect(validationError.message).toBe(
      'Invalid: first of 9 errors: username: {"message":"Invalid username"}'
    );
    expect(validationError.errors).toEqual(listErrors(errors1));
    expect(errors1).toMatchInlineSnapshot(`
        Object {
          "access_token": Object {
            "message": "Invalid access_token",
          },
          "addresses": Array [
            Object {
              "line1": Object {
                "message": "Invalid line 1",
              },
              "line2": Object {
                "message": "Invalid line 2",
              },
              Symbol(structure): true,
            },
            Object {
              "__root": Object {
                "message": "Invalid address",
              },
              "line1": Object {
                "message": "Invalid line 1",
              },
              "line2": undefined,
              Symbol(structure): true,
            },
          ],
          "birth_year": Object {
            "message": "Invalid birth_year",
          },
          "email": Object {
            "message": "Invalid email",
          },
          "password": undefined,
          "repeat_password": Object {
            "message": "Invalid repeat_password",
          },
          "username": Object {
            "message": "Invalid username",
          },
          Symbol(structure): true,
        }
      `);
    expect(listErrors(errors1)).toMatchInlineSnapshot(`
        Array [
          Object {
            "err": Object {
              "message": "Invalid username",
            },
            "path": "username",
          },
          Object {
            "err": Object {
              "message": "Invalid repeat_password",
            },
            "path": "repeat_password",
          },
          Object {
            "err": Object {
              "message": "Invalid access_token",
            },
            "path": "access_token",
          },
          Object {
            "err": Object {
              "message": "Invalid birth_year",
            },
            "path": "birth_year",
          },
          Object {
            "err": Object {
              "message": "Invalid email",
            },
            "path": "email",
          },
          Object {
            "err": Object {
              "message": "Invalid line 1",
            },
            "path": "addresses.0.line1",
          },
          Object {
            "err": Object {
              "message": "Invalid line 2",
            },
            "path": "addresses.0.line2",
          },
          Object {
            "err": Object {
              "message": "Invalid address",
            },
            "path": "addresses.1.__root",
          },
          Object {
            "err": Object {
              "message": "Invalid line 1",
            },
            "path": "addresses.1.line1",
          },
        ]
      `);
    const errors2 = validator({
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
      ]
    });
    expect(isError(errors2)).toBe(false);
    expect(hasError(errors2)).toBe(false);
    expect(() => assert(errors2)).not.toThrow();
    expect(errors2).toMatchInlineSnapshot(`
        Object {
          "access_token": undefined,
          "addresses": Array [
            Object {
              "line1": undefined,
              "line2": undefined,
              Symbol(structure): true,
            },
          ],
          "birth_year": undefined,
          "email": undefined,
          "password": undefined,
          "repeat_password": undefined,
          "username": undefined,
          Symbol(structure): true,
        }
      `);
    expect(listErrors(errors2)).toEqual([]);
  });
});
