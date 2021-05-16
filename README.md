# Ok Computer

- "Functions all the way down" **data validation for JavaScript and TypeScript**.
- Designed for frontend and backend.
- First class support for custom error messages / bring your own i18n.
- Don't like something? Need extra functionality? Write a function.
- Zero dependencies (it's <500 lines of code including types).
- [5+ years in the making](https://gist.github.com/richardscarrott/7b4abfda67b54d70514e) 😂.

## Example

```js
// prettier-ignore
import { object, and, length, or, nullish, pattern, match, string, number, integer, min, max, array, is, email, assert } from 'ok-computer';

const validator = object({
  username: and(string, length(3, 30)),
  password: or(nullish, pattern(/^[a-zA-Z0-9]{3,30}$/)),
  repeat_password: match('password'),
  access_token: or(string, number),
  birth_year: and(integer, min(1900), max(2021)),
  email,
  addresses: array(
    object({
      line1: and(string, length(1, 255)),
      line2: or(is(undefined), and(string, length(1, 255)))
    })
  )
});

const errors = validator({});
// {
//   username: '(Expected string and expected length between 3 and 30)',
//   password: undefined,
//   repeat_password: undefined,
//   access_token: '(Expected string or expected number)',
//   birth_year: '(Expected integer and expected min 1900 and expected max 2021)',
//   email: 'Expected email',
//   addresses: ['Expected array'],
// }

hasError(errors); // or isError(errors)
// true

const errorList = listErrors(errors);
// [
//   {
//     path: 'username',
//     err: '(Expected string and expected length between 3 and 30)'
//   },
//   { path: 'access_token', err: '(Expected string or expected number)' },
//   {
//     path: 'birth_year',
//     err: '(Expected integer and expected min 1900 and expected max 2021)'
//   },
//   { path: 'email', err: 'Expected email' },
//   { path: 'addresses.0', err: 'Expected array' }
// ]

assert(errors);
// throw new ValidationError(`Invalid: first of 5 errors: username: (Expected string and expected length between 3 and 30)`)
```

## Concepts

1. An `Error` can be any value other than `undefined`\*
2. A `Validator` function accepts a value and returns `Error` if invalid or `undefined` if valid
   - `(value: unknown) => Error | undefined`
3. A `ValidatorFactory` function accepts an `Error` and returns a `Validator`
   - `(err: Error) => Validator<Error>`

> \*Some validators return structural data types (e.g. `object` and `array`) which, in addition to `undefined`, are not considered to be an error, e.g. `{ username: undefined, [Symbol(structure)]: true }` is not an error.

## Custom Errors

```ts
// A function prefixed with `$` means they're a `ValidatorFactory`, not a `Validator`.
// prettier-ignore
import { object, $and, $length, $or, $nullish, $pattern, $match, $string, $number, $integer, $min, $max, $array, $is, $assert } from 'ok-computer';

const err = (id: string) => ({ id });

const validator = object({
  username: $and($string, $length(3, 30))(err('username.invalid')),
  password: $or(
    $nullish,
    $pattern(/^[a-zA-Z0-9]{3,30}$/)
  )(err('password.invalid')),
  repeat_password: $match('password')(err('repeat_password.invalid')),
  access_token: $or($string, $number)(err('access_token.invalid'))
});

const errors = validator({});
// {
//   username: { id: 'username.invalid' },
//   password: undefined,
//   repeat_password: undefined,
//   access_token: { id: 'access_token.invalid' },
// }

hasError(errors); // or isError(errors)
// true

const errorList = listErrors(errors);
// [
//   { path: 'username', err: { id: 'username.invalid' } },
//   { path: 'access_token', err: { id: 'access_token.invalid' } }
// ]

assert(errors);
// throw new ValidationError(`Invalid: first of 2 errors: username: {"id":"username.invalid"}`)
```

### API

### TODO
