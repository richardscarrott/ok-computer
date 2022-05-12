# Ok Computer

[![GitHub package.json version](https://img.shields.io/github/package-json/v/richardscarrott/ok-computer.svg)](https://www.npmjs.com/package/ok-computer)
[![GitHub license](https://github.com/richardscarrott/ok-computer/actions/workflows/node.js.yml/badge.svg)](https://github.com/richardscarrott/ok-computer/actions/workflows/node.js.yml)
[![GitHub license](https://img.shields.io/github/license/richardscarrott/ok-computer.svg)](https://github.com/richardscarrott/ok-computer/blob/master/LICENSE) [![deno land](http://img.shields.io/badge/available%20on-deno.land/x-lightgrey.svg?logo=deno&labelColor=black)](https://deno.land/x/ok_computer)

λ "Functions all the way down" **data validation for JavaScript and TypeScript**.

🥞 Designed for frontend and backend.

🗣 First class support for custom error messages / bring your own i18n.

🔌 Don't like something? Need extra functionality? Write a function.

☕ Zero dependencies (it's < 500 lines of code including types).

📦 Available on [npm](https://www.npmjs.com/package/ok-computer) and [deno.land](https://deno.land/x/ok_computer).

![Alt Text](ok-computer-demo.gif)

[Install](#install) | [Example](#example) | [Concepts](#✨-concepts) | [API Docs](#api)

## Install

### npm

```
npm install ok-computer
```

### Yarn

```
yarn add ok-computer
```

### Deno

```
import * as ok from "https://deno.land/x/ok_computer/ok-computer.ts";
```

### Deno

## Example

[Try on CodeSandbox](https://codesandbox.io/s/ok-computer-forked-yghenq?file=/src/index.ts)

```js
import {
  object,
  string,
  or,
  nullish,
  and,
  length,
  integer,
  hasError,
  assert
} from 'ok-computer';

const validator = object({
  firstName: string,
  lastName: or(nullish, string),
  picture: object({
    url: and(string, length(1, 255)),
    width: integer
  })
});

const errors = validator({ lastName: 44, picture: {} });
// {
//   firstName: 'Expected typeof string',
//   lastName: '(Expected nullish or expected typeof string)',
//   picture: {
//     url: '(Expected typeof string and expected length between 1 and 255)',
//     width: 'Expected integer'
//   }
// };

hasError(errors);
// true

assert(errors);
// throw new AssertError('Invalid: first of 4 errors: firstName: Expected typeof string')
```

## ✨ Concepts

Everything in Ok Computer is a validation function, also known as a "validator".

```ts
type Validator<Err = unknown> = (value: unknown) => Err | undefined;
```

A validator has 3 rules:

1. **Returns `undefined` if the value is _valid_**

2. **Returns an error (_anything_ other than `undefined`) if the value is _invalid_**

3. **Returns an error if the value is `Symbol.for('ok-computer.introspect')`**

```ts
const fortyFour: Validator<string> = (value) =>
  value !== 44 ? 'Expected the number 44' : undefined;

fortyFour(44);
// undefined

fortyFour(43);
// 'Expected the number 44'

fortyFour(Symbol.for('ok-computer.introspect'));
// 'Expected the number 44'
```

All built-in validators work like this, for example this is how `string` is implemented.

```ts
const string: Validator<string> = (value) =>
  typeof value !== 'string' ? 'Expected string' : undefined;

string('cat');
// undefined

string(10);
// 'Expected string'

string(Symbol.for('ok-computer.introspect'));
// 'Expected string'
```

The above validators implicitly handle rule 3 due to the nature of the validation logic. In some cases you need to explicitly handle it.

```ts
// 🚨 Bad
const symbol: Validator<string> = (value) =>
  typeof value !== 'symbol' ? 'Expected symbol' : undefined;

symbol(Symbol.for('cat'));
// undefined ✅

symbol('cat');
// 'Expected symbol' ✅

symbol(Symbol.for('ok-computer.introspect'));
// undefined ❌
```

```ts
// 👌 Better
const symbol: Validator<string> = (value) =>
  typeof value !== 'symbol' || value === Symbol.for('ok-computer.introspect')
    ? 'Expected symbol'
    : undefined;

symbol(Symbol.for('cat'));
// undefined ✅

symbol('cat');
// 'Expected symbol' ✅

symbol(Symbol.for('ok-computer.introspect'));
// 'Expected symbol' ✅
```

```ts
// 👍 Best
import { create } from 'ok-computer';

const symbol = create((value) => typeof value === 'symbol', 'Expected symbol');

symbol(Symbol.for('cat'));
// undefined ✅

symbol('cat');
// 'Expected symbol' ✅

symbol(Symbol.for('ok-computer.introspect'));
// 'Expected symbol' ✅
```

> NOTE: It's recommended to use `create` for all custom validators.

Errors don't have to be string values, as per rule 2 **an error can be _anything_ other than `undefined`**. So yes, this means `''`, `0`, `null` and `false` or even `() => {}` are all considered to be an error.

```ts
import { create } from 'ok-computer';

const string = create(
  (value) => typeof value === 'string',
  new Error('Expected string')
);

string('cat');
// undefined

string(44);
// new Error('Expected string')

const number = create((value) => typeof value === 'number', false);

number(44);
// undefined

number('cat');
// false

const never = create((value) => false, 0);

never('cat');
// 0

never(44);
// 0

const always = create((value) => true, { id: 'foo.bar' });

always('cat');
// undefined

always(44);
// undefined

always(Symbol.for('ok-computer.introspect'));
// { id: 'foo.bar' }
```

So far so good, however nothing particularly useful is going on as you don't need a library to write a function which conditionally returns undefined.

The real utility comes from [higher order validators](https://en.wikipedia.org/wiki/Higher-order_function) which accept arguments (in many cases arguments are themselves validators) and return new validators, allowing you to compose simple validators into more complex logic.

```ts
import { length } from 'ok-computer';

const length3 = length(3);

length3('cat');
// undefined

length3([1, 2, 3]);
// undefined

length3('catamaran');
// 'Expected length 3'

length3([1, 2]);
// 'Expected length 3'
```

```ts
import { length, string, and } from 'ok-computer';

const name = and(string, length(3));

name('cat');
// undefined

name([1, 2, 3]);
// (Expected typeof string and expected length 3)

name('catamaran');
// (Expected typeof string and expected length 3)
```

```ts
import {
  length,
  string,
  and,
  or,
  nullish,
  pattern,
  not,
  oneOf
} from 'ok-computer';

const username = or(
  nullish,
  and(
    string,
    length(4, 30),
    pattern(/^[\w\.]*$/),
    not(oneOf('lewis.hamilton', 'kanye.west'))
  )
);

username('catamaran');
// undefined

username(null);
// undefined

username('cat');
// (Expected nullish or (Expected typeof string and expected length between 4 and 30 and expected to match pattern /^[\\w\\.]*$/ and not("Expected one of lewis.hamilton, kanye.west")))

username('lewis.hamilton');
// (Expected nullish or (Expected typeof string and expected length between 4 and 30 and expected to match pattern /^[\\w\\.]*$/ and not("Expected one of lewis.hamilton, kanye.west")))
```

You can implement your own higher order validators in the same way.

```ts
import { create } from 'ok-computer';

const endsWith = (suffix: string) =>
  create(
    (value) => typeof value === 'string' && value.endsWith(suffix),
    `Expected string to end with "${suffix}"`
  );

const jpeg = endsWith('.jpeg');

jpeg('cat.jpeg');
// undefined

jpeg('cat.png');
// 'Expected string to end with ".jpeg"'
```

Some commonly used higher order validators return structural data which, like `undefined`, can also be considered valid.

```ts
import { object, string } from 'ok-computer';

const user = object({
  name: string
});

user({ name: 'Hamilton' });
// { name: undefined, [Symbol('ok-computer.structure')]: true }

user({ name: 44 });
// { name: 'Expected typeof string', [Symbol('ok-computer.structure')]: true }
```

```ts
import { array, string } from 'ok-computer';

const names = array(string);

names(['Hamilton']);
// Array { 0: undefined, [Symbol('ok-computer.structure')]: true }

names(['Hamilton', 44]);
// Array { 0: undefined, 1: 'Expected typeof string', [Symbol('ok-computer.structure')]: true }
```

This exposes a richer interface to consume more complex validation errors. The tradeoff being you can't simply check if the error is `undefined` to determine if it's valid. Instead you must use a dedicated `isError` function.

```js
import { object, string, isError } from 'ok-computer';

const user = object({
  name: string
});

const error = user({ name: 'Hamilton' });
// { name: undefined, [Symbol('ok-computer.structure')]: true }

isError(error);
// false
```

There are a number of other functions to help consume errors.

```js
import {
  object,
  string,
  isError,
  hasError,
  listErrors,
  assert
} from 'ok-computer';

const user = object({
  firstName: string,
  lastName: string
});

const error = user({ firstName: 44 });
// { firstName: 'Expected typeof string', lastName: 'Expected typeof string', [Symbol('ok-computer.structure')]: true }

isError(error);
// true

hasError(error); // (alias for `isError`)
// true

listErrors(error);
// [{ path: 'firstName', err: 'Expected typeof string' }, { path: 'lastName', err: 'Expected typeof string' }]

assert(error);
// throw new AssertError(`Invalid: first of 2 errors: firstName: Expected typeof string`)
```

Sometimes validation depends on sibling values. By convention all validators receive parent values as subsequent arguments.

```js
import { object, string, create } from 'ok-computer';

const user = object({
  password: string,
  repeatPassword: create(
    (value, parent) => value === parent.password,
    'Expected to match password'
  ),
  nested: object({
    repeatPassword: create(
      (value, parent, grandParent) => value === grandParent.password,
      'Expected to match password'
    )
  })
});
```

Although all out-the-box validators return pre-baked error _strings_, you can override them with the `err` higher order validator.

```ts
import { err, string } from 'ok-computer';

string(10); // 'Expected typeof string'

const str = err(string, 'Really expected a string');
str(10); // 'Really expected a string'
```

```ts
import { err, nullish, string, or } from 'ok-computer';

const firstName = or(nullish, string);
firstName(10); // ORError(['Expected nullish', 'Expected typeof string'])

const forename = err(or(nullish, string), 'Expected nullish or string');
forename(10); // 'Expected nullish or string'

const vorname = err(or(nullish, string), 'Null oder Zeichenfolge erwartet');
vorname(10); // 'Null oder Zeichenfolge erwartet'
```

Many errors returned from higher order validators such as `ORError`, `ANDError`, `XORError`, `PeerError` and `NegateError` serialize into string errors when possible.

```ts
import { nullish, string, or } from 'ok-computer';

const firstName = or(nullish, string);
const err = firstName(44);
// ORError(['Expected nullish', 'Expected typeof string'])

JSON.stringify(err);
// '(Expected nullish or expected typeof string)'
```

```ts
import { nullish, string, or, and, minLength } from 'ok-computer';

const firstName = or(nullish, and(string, minLength(1)));
const err = firstName(44);
// ORError(['Expected nullish', ANDError(['Expected typeof string', 'Expected min length 1'])])

JSON.stringify(err);
// '(Expected nullish or (Expected typeof string and expected min length 1))'
```

```ts
import { nullish, string, or, object } from 'ok-computer';

const firstName = or(nullish, object({ name: string }));
const err = firstName(44);
// ORError([
//   'Expected nullish',
//   {
//     name: 'Expected typeof string',
//     [Symbol('ok-computer.object-root')]: 'Expected object',
//     [Symbol('ok-computer.structure')]: true
//   }
// ])

JSON.stringify(err);
// { type: 'ORError', operator: 'OR', errors: ['Expected nullish', { name: 'Expected typeof string' }] }
```

## API

Coming soon... for now you can:

1.  [Discover the full API using TypeScript](https://codesandbox.io/s/ok-computer-forked-yghenq?file=/src/index.ts) (TIP: `import * as ok from 'ok-computer'`)
2.  [Browse the source](https://github.com/richardscarrott/ok-computer/blob/master/src/ok-computer.ts) (there isn't much code)
