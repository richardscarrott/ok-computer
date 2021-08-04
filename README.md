# Ok Computer

[![GitHub package.json version](https://img.shields.io/github/package-json/v/richardscarrott/ok-computer.svg)](https://www.npmjs.com/package/ok-computer)
[![GitHub license](https://github.com/richardscarrott/ok-computer/actions/workflows/node.js.yml/badge.svg)](https://github.com/richardscarrott/ok-computer/actions/workflows/node.js.yml)
[![GitHub license](https://img.shields.io/github/license/richardscarrott/ok-computer.svg)](https://github.com/richardscarrott/ok-computer/blob/master/LICENSE)

λ "Functions all the way down" **data validation for JavaScript and TypeScript**.

🥞 Designed for frontend and backend.

🗣 First class support for custom error messages / bring your own i18n.

🔌 Don't like something? Need extra functionality? Write a function.

☕ Zero dependencies (it's < 500 lines of code including types).

😂 [5+ years in the making](https://gist.github.com/richardscarrott/7b4abfda67b54d70514e).

![Alt Text](ok-computer-demo.gif)

[Install](#install)

[Example](#example)

[Concepts](#✨-concepts)

[API Docs](#api)

[Licence](#licence)

## Install

```
npm i ok-computer
```

## Example

[Try in CodeSandbox](https://codesandbox.io/s/ok-computer-7h38q?file=/src/index.ts)

```js
// prettier-ignore
import { object, string, or, nullish, and, length, integer, hasError, assert } from 'ok-computer';

const validator = object({
  firstName: string,
  lastName: or(nullish, string),
  picture: object({
    url: and(string, length(1, 255)),
    width: integer
  })
});

const errors = validator({ lastName: 44, picture: {} });

hasError(errors);
// true

assert(errors);
// throw new ValidationError('Invalid: first of 3 errors: firstName: Expected string')
```

## ✨ Concepts

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

Therefore, most of the built-in validation functions expose two versions, one accepting a custom error and another which is pre-loaded with an error string:

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

Additionally, many of the built-in functions accept arguments to offer greater utility:

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
import { object, string, create } from 'ok-computer';

const user = object({
  password: string,
  repeatPassword: create((value, parent) => value === parent.password)(
    'Expected to match password'
  ),
  nested: object({
    repeatPassword: create(
      (value, parent, grandParent) => value === grandParent.password
    )('Expected to match password')
  })
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

### Types

#### `Validator<Err>`

<details>
<summary>(value: unknown, ...parents: any[]) => Err | undefined</summary>
  
```ts
type Validator<Err> = (value: unknown, ...parents: any[]) => Err | undefined;

const fortyFour: Validator<string> = (value) =>
value !== 44 ? 'Expected 44' : undefined;

````
</details>

#### `ValidatorFactory`

<details>
<summary>&lt;Err&gt(err: Err) => Validator&ltErr&gt</summary>

```ts
type ValidatorFactory = <Err>(err: Err) => Validator<Err>;

const $fortyFour: ValidatorFactory = (err) => (value) =>
  value !== 44 ? err : undefined;
````

</details>

### Functions

#### `listErrors`

<details>
<summary>Lists all errors as an array</summary>

```js
import { listErrors, object, string } from 'ok-computer';

const user = object({
  name: string,
  picture: object({
    url: string,
    width: string
  })
});

const errors = user({});

listErrors(errors);
// [
//   { path: 'name', err: 'Expected string' },
//   { path: 'picture.__root', err: 'Expected object' },
//   { path: 'picture.url', err: 'Expected string' },
//   { path: 'picture.width', err: 'Expected string' }
// ]
```

</details>

#### `isError` / `hasError`

<details>
<summary>Returns true if value is an error, false otherwise</summary>

```js
import { isError, hasError, string } from 'ok-computer';

const error = string(44);

isError(error);
// true

hasError(error);
// true
```

</details>

#### `assert`

<details>
<summary>Throws if value is an error</summary>

```js
import { assert, string } from 'ok-computer';

const error = string(44);

assert(error);
// throw new ValidationError('Invalid: first of 1 errors: Expected string');
```

</details>

#### `create`

<details>
<summary>Accepts a predicate function and returns a ValidatorFactory</summary>

```js
import { create } from 'ok-computer';

const is44 = create((value) => value === 44)('Expected 44');

is44(44);
// undefined

is44(33);
// 'Expected 44'
```

</details>

#### `is`

<details>
<summary>Performs a strict equality check with `===`</summary>

```js
import { is } from 'ok-computer';

const is44 = is(44);

is44(44);
// undefined

is44(33);
// 'Expected 44'
```

```js
import { $is } from 'ok-computer';

const is44 = $is(44)(new Error('Expected 44'));

is44(44);
// undefined

is44(33);
// new Error('Expected 44')
```

</details>

#### `typeOf`

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

#### `string`

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

#### `number`

<details>
<summary>Performs a `typeof 'number'` check</summary>
  
```js
import { number } from 'ok-computer';

number(44);
// undefined

string('cat');
// 'Expected number'

````

```js
import { $number } from 'ok-computer';

const number = $number(new Error('Expected number'));

number(44);
// undefined

number('cat');
// new Error('Expected number')
````

</details>

#### `boolean`

<details>
<summary>Performs a `typeof 'boolean'` check</summary>
  
```js
import { boolean } from 'ok-computer';

boolean(false);
// undefined

boolean('cat');
// 'Expected boolean'

````

```js
import { $boolean } from 'ok-computer';

const boolean = $boolean(new Error('Expected boolean'));

boolean(false);
// undefined

boolean('cat');
// new Error('Expected boolean')
````

</details>

#### `integer`

<details>
<summary>Performs a `Number.isInteger` check</summary>
  
```js
import { integer } from 'ok-computer';

integer(44);
// undefined

integer(44.44);
// 'Expected integer'

````

```js
import { $integer } from 'ok-computer';

const integer = $integer(new Error('Expected integer'));

integer(44);
// undefined

integer(44.44);
// new Error('Expected integer')
````

</details>

#### `instanceOf`

<details>
<summary>Accepts a constructor and checks if `instanceof`</summary>
  
```js
import { instanceOf } from 'ok-computer';

function Foo() {}

const foo = instanceOf(Foo);

foo(new Foo());
// undefined

foo({});
// 'Expected instanceof Foo'

````

```js
import { instanceOf } from 'ok-computer';

function Foo() {}

const foo = $instanceOf(Foo)(new Error('Expected instanceof Foo'));

foo(new Foo());
// undefined

foo({});
// new Error('Expected instanceof Foo')
````

</details>

#### `or`

<details>
<summary>Returns a validator which errors if all validators return an error</summary>
  
```js
import { or, string, number, boolean } from 'ok-computer';

const validator = or(string, number, boolean);

validator('cat');
// undefined

validator(44);
// undefined

validator(true);
// undefined

validator(null);
// '(Expected string or expected number or expected boolean)'

````

```js
import { $or, $string, $number, $boolean } from 'ok-computer';

const validator = $or($string, $number, $boolean)(new Error('Expected string, number or boolean'));

validator('cat');
// undefined

validator(44);
// undefined

validator(true);
// undefined

validator(null);
// '(Expected string, number or boolean)'
````

</details>

#### `and`

<details>
<summary>Returns a validator which errors if one or more validators return an error</summary>
  
```js
import { and, number, min, max } from 'ok-computer';

const validator = and(number, min(1), max(5));

validator(3);
// undefined

validator(6);
// '(Expected min 1 and expected max 5)'

validator('cat');
// '(Expected number and expected min 1 and expected max 5)'

````

```js
import { $and, $number, $min, $max } from 'ok-computer';

const validator = $and($number, $min(1), $max(5))(new Error('Expected number between 1 and 5 inclusive'));

validator(3);
// undefined

validator(6);
// 'Expected number between 1 and 5 inclusive'

validator('cat');
// 'Expected number between 1 and 5 inclusive'
````

</details>

#### `array`

<details>
<summary>Checks the value is an array and each element passes the validator</summary>
  
```js
import { array, string } from 'ok-computer';

const validator = array(string);

validator(['cat', 'catamaran']);
// []

validator([]);
// []

validator('cat');
// ['Expected array']

validator([44]);
// ['Expected string']

validator([44, 'cat', false]);
// ['Expected string', undefined, 'Expected string']

````

```js
import { $array, string } from 'ok-computer';

const validator = $array(string)(new Error('Expected array'));

validator(['cat', 'catamaran']);
// []

validator([]);
// []

validator('cat');
// [new Error('Expected array')]

validator([44]);
// ['Expected string']

validator([44, 'cat', false]);
// ['Expected string', undefined, 'Expected string']
````

</details>

#### `maxLength`

// TODO: Redo this one

<details>
<summary>Checks the value is a string or an array and has a length no greater than the length specified</summary>
  
```js
import { maxLength } from 'ok-computer';

const validator = maxLength(3);

validator('cat');
// undefined

validator(['cat', 'dog']);
// undefined

validator('catamaran');
// 'Expected max length 3'

validator(['cat, 'dog', 44, false]);
// 'Expected max length 3'

validator(44);
// 'Expected max length 3'

````

```js
import { $maxLength } from 'ok-computer';

const validator = $maxLength(3)(new Error('Expected max length 3'));

validator('cat');
// undefined

validator(['cat', 'dog']);
// undefined

validator('catamaran');
// new Error('Expected max length 3')

validator(['cat, 'dog', 44, false]);
// new Error('Expected max length 3')

validator(44);
// new Error('Expected max length 3')
````

</details>

#### `minLength`

<details>
<summary>Checks the value is a string or an array and has a length no less than the length specified</summary>
  
```js
import { minLength } from 'ok-computer';

const minLength3 = minLength(3);

minLength3('cat');
minLength3('catamaran');
minLength3(['cat, 'catamaran', 44]);
minLength3(['cat, 'catamaran', 44, false]);
// undefined

minLength3('ca');
minLength3(['cat', 'catamaran']);
minLength3(true);
// 'Expected min length 3'

````

```js
import { $minLength } from 'ok-computer';

const minLength3 = minLength(3)(new Error('Expected min length 3'));

const minLength3 = minLength(3);

minLength3('cat');
minLength3('catamaran');
minLength3(['cat, 'catamaran', 44]);
minLength3(['cat, 'catamaran', 44, false]);
// undefined

minLength3('ca');
minLength3(['cat', 'catamaran']);
minLength3(true);
// new Error('Expected min length 3')
````

</details>

#### `length`

<details>
<summary>Checks the value is a string or an array and has a length between the min and max length specified</summary>
  
```js
import { length } from 'ok-computer';

const lengthBetween1And3 = length(1, 3);

lengthBetween1And3('c');
lengthBetween1And3('ca');
lengthBetween1And3('cat');
lengthBetween1And3(['cat']);
lengthBetween1And3(['cat', 'catamaran']);
lengthBetween1And3(['cat', 'catamaran', 44]);
// undefined

lengthBetween1And3('');
lengthBetween1And3('catamaran');
lengthBetween1And3([]);
lengthBetween1And3(['cat', 'catamaran', 44, true]);
// 'Expected length between 1 and 3'

const length2 = length(2);

length2('ca');
length2(['cat', 'catamaran']);
// undefined

length2('');
length2('cat');
length2([]);
length2(['cat', 'catamaran', 44]);
// 'Expected length 2'

````

```js
import { $length } from 'ok-computer';

const lengthBetween1And3 = $length(1, 3)(new Error('Expected length between 1 and 3'));

lengthBetween1And3('c');
lengthBetween1And3('ca');
lengthBetween1And3('cat');
lengthBetween1And3(['cat']);
lengthBetween1And3(['cat', 'catamaran']);
lengthBetween1And3(['cat', 'catamaran', 44]);
// undefined

lengthBetween1And3('');
lengthBetween1And3('catamaran');
lengthBetween1And3([]);
lengthBetween1And3(['cat', 'catamaran', 44, true]);
lengthBetween1And3(44);
// new Error('Expected length between 1 and 3')

const length2 = $length(2)(new Error('Expected length 2'));

length2('ca');
length2(['cat', 'catamaran']);
// undefined

length2('');
length2('cat');
length2([]);
length2(['cat', 'catamaran', 44]);
length2(44);
// new Error('Expected length 2')
````

</details>

## Licence

Ok Computer is released under the under terms of the [MIT License](https://github.com/richardscarrott/ok-computer/blob/master/LICENSE).
