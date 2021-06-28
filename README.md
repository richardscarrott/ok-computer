## Ok Computer

λ "Functions all the way down" **data validation for JavaScript and TypeScript**.

🥞 Designed for frontend and backend.

🗣 First class support for custom error messages / bring your own i18n.

🔌 Don't like something? Need extra functionality? Write a function.

☕ Zero dependencies (it's < 500 lines of code including types).

😂 [5+ years in the making](https://gist.github.com/richardscarrott/7b4abfda67b54d70514e).

![Alt Text](ok-computer-demo.gif)

## Install

```
npm i ok-computer
```

## TLDR;

```js
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

<!-- ### Custom Validation -->

## ✨Concepts

Good news! There's no special API to write your validation logic, you just write a function which accepts a `value` and returns an error if invalid:

```js
const fortyFour = (value) =>
  value !== 44 ? 'Expected the number 44' : undefined;

fortyFour(44);
// undefined

fortyFour(43);
// 'Expected the number 44'
```

This is how all built-in validation functions work, for example this is how `string` is implemented:

```js
const string = (value) =>
  typeof value !== 'string' ? 'Expected string' : undefined;

string('cat');
// undefined

string(44);
// 'Expected string'
```

This signature can be a little distracting however and it can feel more natural to return a `boolean`. `create` allows you to do this:

```js
import { create } from 'ok-computer';

const string = create((value) => typeof value === 'string')('Expected string');

string('cat');
// undefined

string(44);
// 'Expected string'
```

You may be thinking `create` seems like an unnecessary abstraction, however decoupling your validation logic from the error itself turns out to be a good pattern; particularly for i18n:

```js
import { create } from 'ok-computer';

const $string = create((value) => typeof value === 'string');
const string = $string('Erwartete Zeichenfolge');

string('cat');
// undefined

string(44);
// Erwartete Zeichenfolge
```

> NOTE: By convention a function prefixed with `$` hasn't yet received its error.

Errors don't have to be string values, **an error can be _anything_ other than `undefined`**. So yes, this means `''`, `0`, `null` and `false` or even `() => {}` are all considered to be an error:

```js
import { create } from 'ok-computer';

const $string = create((value) => typeof value === 'string');
const string = $string(new Error('Expected string'));

string('cat');
// undefined

string(44);
// new Error('Expected string')
```

Therefore, most of the built-in validation functions expose two versions, one which accepts a custom error and another which is already pre-loaded with an error string:

```js
import { string, $string, number, $number } from 'ok-computer';

string(44);
// 'Expected string'

number('cat');
// 'Expected number'

const str = $string({ id: 'str.invalid' });
const num = $number({ id: 'num.invalid' });

str(44);
// { id: 'str.invalid' }

num('cat');
// { id: 'num.invalid' }
```

Additionally, many of the built-in functions accept arguments to offer even greater utility:

```js
import { length, $length } from 'ok-conputer';

const between2And3 = length(2, 3);

between2And3('cat');
// undefined

between2And3('catamaran');
// Expected length between 2 and 3

const $tween2And3 = $length(2, 3);
const tween2And3 = $tween2And3('Invalid');

tween2And3('cat');
// undefined

tween2And3('catamaran');
// Invalid
```

You can implement your own validation functions in the same way:

```js
import { create } from 'ok-computer';

const $endsWith = (suffix) =>
  create((value) => typeof value === 'string' && value.endsWith(suffix));
const endsWith = (suffix) =>
  $endsWith(`Expected string to end with "${suffix}"`);

const jpeg = endsWith('.jpeg');

jpeg('cat.jpeg');
// undefined

jpeg('cat.png');
// 'Expected string to end with ".jpeg"'
```

These can then be customised and composed with one another into more sophisticated validation logic:

```js
import { create, or, and, length } from 'ok-computer';

const endsWith = (suffix: string) =>
  create((value) => typeof value === 'string' && value.endsWith(suffix))(
    `Expected string to end with "${suffix}"`
  );

const jpeg = or(endsWith('.jpeg'), endsWith('.jpg'));

const image = and(jpeg, length(10, 15));

image('catamaran.jpg');
// undefined

image('catamaran.png');
// (Expected string to end with ".jpeg" or expected string to end with ".jpg")

image('cat.jpeg');
// Expected length between 10 and 15

image('cat.png');
// ((Expected string to end with ".jpeg" or expected string to end with ".jpg") and expected length between 10 and 15)
```

Some built-in validation functions return more exotic data structures which, like `undefined`, are also not considered to be an error:

```js
import { object, string } from 'ok-computer';

const user = object({
  name: string
});

user({ name: 'Hamilton' });
// {}

user({ name: 44 });
// { name: 'Expected string' }
```

> NOTE: `{}` returned by `object` is a special data type and a plain `{}` is still considered an error.

This exposes a richer interface to consume more complex validation errors. The tradeoff being you can't just check if the value is `undefined` to determine if there's an error and instead must use a dedicated `isError` function:

```js
import { object, string, isError } from 'ok-computer';

const user = object({
  name: string
});

const error = user({ name: 'Hamilton' });
// {}

isError(error);
// false
```

> NOTE: `hasError` is additionally exported, which is merely an alias for `isError`.

Sometimes validation depends on other values. By convention all validation functions receive their parent values as subsequent arguments:

```js
import { object, create } from 'ok-computer';

const user = object({
  password: string,
  repeatPassword: create((value, parent) => value === parent.password)(
    'Expected to match password'
  ),
  nested: {
    repeatPassword: create(
      (value, parent, grandParent) => value === grandParent.password
    )('Expected to match password')
  }
});
```

Lastly, there are a number of functions to help consume errors:

```js
import { object, string, isError, listErrors, assert } from 'ok-computer';

const user = object({
  firstName: string,
  lastName: string
});

const error = user({ firstName: 44 });
// { firstName: 'Expected string', lastName: 'Expected string' }

isError(error);
// true

listErrors(error);
// [{ path: 'firstName', err: 'Expected string' }, { path: 'lastName', err: 'Expected string' }]

assert(error);
// throw new ValidationError(`Invalid: first of 2 errors: firstName: Expected string`)
```

## API

### `is`

<details>
<summary>Performs a strict equality check with `===`</summary>
  
```js
import { is } from 'ok-computer';

const is44 = is(44);

is44(44);
// undefined

is44(33);
// 'Expected 44'

````

```js
import { $is } from 'ok-computer';

const is44 = $is(44)(new Error('Expected 44'));

is44(44);
// undefined

is44(33);
// new Error('Expected 44')
````

</details>

### `typeOf`

<details>
<summary>Performs a `typeof` check</summary>
  
```js
import { typeOf } from 'ok-computer';

const string = typeOf('string');

string('cat');
// undefined

string(44);
// 'Expected typeof string'

````

```js
import { $typeOf } from 'ok-computer';

const string = $typeOf('string')(new Error('Expected typeof string'));

string('cat');
// undefined

string(44);
// new Error('Expected typeof string')
````

</details>

### `string`

<details>
<summary>Performs a `typeof 'string'` check</summary>
  
```js
import { string } from 'ok-computer';

string('cat');
// undefined

string(44);
// 'Expected string'

````

```js
import { $string } from 'ok-computer';

const string = $string(new Error('Expected string'));

string('cat');
// undefined

string(44);
// new Error('Expected string')
````

</details>

### TODO: Document remaining API
