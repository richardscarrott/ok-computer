import {
  withStructure,
  isError,
  hasError,
  listErrors,
  create,
  $is,
  $typeOf,
  $instanceOf,
  $string,
  $number,
  $boolean,
  $or,
  $and,
  $array,
  $minLength,
  $maxLength,
  $length,
  $min,
  $max,
  $nullish,
  $includes,
  $match,
  $pattern,
  $oneOf,
  $tuple,
  $object,
  each,
  all,
  $not,
  not
} from './ok-computer';

describe('listErrors', () => {
  describe('valid', () => {
    [
      undefined,
      withStructure({
        foo: undefined,
        bar: undefined,
        baz: withStructure({
          qux: withStructure({})
        })
      }),
      withStructure([])
    ].forEach((val) => {
      it(`${val} returns an empty array`, () => {
        expect(listErrors(val)).toEqual([]);
      });
    });
  });

  describe('root errors', () => {
    [
      // Primitives
      true,
      false,
      null,
      -1,
      0,
      1,
      2,
      Infinity,
      NaN,
      '',
      ' ',
      'a',
      'ab',
      Symbol('foo'),
      // Objects
      {},
      [],
      () => {},
      /foo/,
      new Set(),
      new Map(),
      new Error(),
      new Date('2021-01-09')
    ].forEach((val, i) => {
      it(`${i + 1}. "${
        val === null ? 'null' : val.toString()
      }" returns the error w/ path`, () => {
        expect(listErrors(val)).toEqual([{ path: '', err: val }]);
      });
    });
  });

  describe('structural errors', () => {
    it('returns the error w/ path', () => {
      const err = new Error('Invalid');
      const errors = withStructure({ foo: err });
      expect(listErrors(errors)).toEqual([{ path: 'foo', err }]);
    });

    it('returns multiple errors w/ path', () => {
      const err1 = new Error('Invalid');
      const err2 = 'Invalid';
      const err3 = false;
      const err4 = 0;
      const err5 = {
        is: 'invalid'
      };
      const err6 = null;
      const err7 = -1;
      const errors = withStructure({
        foo: withStructure({
          bar: withStructure({
            qux: err1,
            quux: err2,
            corge: err3,
            grault: withStructure({
              garply: err4
            })
          }),
          quuz: err5
        }),
        waldo: withStructure([err6, err7])
      });
      // Currently performs a depth-first search for errors, not sure if I care about order?
      expect(listErrors(errors)).toEqual([
        { path: 'foo.bar.qux', err: err1 },
        { path: 'foo.bar.quux', err: err2 },
        { path: 'foo.bar.corge', err: err3 },
        { path: 'foo.bar.grault.garply', err: err4 },
        { path: 'foo.quuz', err: err5 },
        { path: 'waldo.0', err: err6 },
        { path: 'waldo.1', err: err7 }
      ]);
    });
  });
});

[
  { name: 'isError', fn: isError },
  { name: 'hasError', fn: hasError }
].forEach(({ name, fn }) => {
  describe(name, () => {
    describe('valid', () => {
      [
        undefined,
        withStructure({
          foo: undefined,
          bar: undefined,
          baz: withStructure({
            qux: withStructure({})
          })
        }),
        withStructure([])
      ].forEach((val, i) => {
        it(`${i + 1}. ${val} returns false`, () => {
          expect(fn(val)).toBe(false);
        });
      });
    });

    describe('invalid', () => {
      [
        // Primitives
        true,
        false,
        null,
        -1,
        0,
        1,
        2,
        Infinity,
        NaN,
        '',
        ' ',
        'a',
        'ab',
        Symbol('foo'),
        // Objects
        {},
        [],
        () => {},
        /foo/,
        new Set(),
        new Map(),
        new Error(),
        new Date('2021-01-09'),
        withStructure({ foo: 'bar' }),
        withStructure({ foo: undefined, bar: withStructure({ baz: 0 }) }),
        withStructure(['foo'])
      ].forEach((val, i) => {
        it(`${i + 1}. "${
          val === null ? 'null' : val.toString()
        }" returns true`, () => {
          expect(fn(val)).toBe(true);
        });
      });
    });
  });
});

describe('create', () => {
  it('accepts a predicate and returns a validator factory', () => {
    const string = create((value) => typeof value === 'string');
    expect(string).toBeInstanceOf(Function);
    const err = new Error('Invalid');
    const validator = string(err);
    expect(validator).toBeInstanceOf(Function);
    expect(validator('A string')).toBe(undefined);
    expect(validator(123)).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });
});

describe('$is', () => {
  it("$is('string')", () => {
    const factory = $is('string');
    const err = new Error('Invalid');
    const validator = factory(err);
    expect(validator('string')).toBe(undefined);
    expect(validator('A string')).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  it('$is(123)', () => {
    const factory = $is(123);
    const err = new Error('Invalid');
    const validator = factory(err);
    expect(validator(123)).toBe(undefined);
    expect(validator(1)).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  it("$is({ foo: 'bar' })", () => {
    const obj = { foo: 'bar' };
    const factory = $is(obj);
    const err = new Error('Invalid');
    const validator = factory(err);
    expect(validator(obj)).toBe(undefined);
    expect(validator({ foo: 'bar' })).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });
});

describe('$typeOf', () => {
  it("$typeOf('string')", () => {
    const factory = $typeOf('string');
    const err = new Error('Invalid');
    const validator = factory(err);
    expect(validator('A string')).toBe(undefined);
    expect(validator(123)).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  it("$typeOf('number')", () => {
    const factory = $typeOf('number');
    const err = new Error('Invalid');
    const validator = factory(err);
    expect(validator('A string')).toBe(err);
    expect(validator(123)).toBe(undefined);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });
});

describe('$instanceOf', () => {
  it(`$instanceOf(Date)`, () => {
    const factory = $instanceOf(Date);
    const err = new Error('Invalid');
    const validator = factory(err);
    expect(validator(new Date('2020-01-01'))).toBe(undefined);
    expect(validator(123)).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  it(`$instanceOf(Ctor)`, () => {
    class Ctor {}
    const factory = $instanceOf(Ctor);
    const err = new Error('Invalid');
    const validator = factory(err);
    expect(validator(new Ctor())).toBe(undefined);
    expect(validator(123)).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });
});

describe('$string', () => {
  it('checks whether value is a string', () => {
    const err = new Error('Invalid');
    const validator = $string(err);
    expect(validator('A string')).toBe(undefined);
    expect(validator(123)).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });
});

describe('$number', () => {
  it('checks whether value is a number', () => {
    const err = new Error('Invalid');
    const validator = $number(err);
    expect(validator(123)).toBe(undefined);
    expect(validator('A string')).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });
});

describe('$boolean', () => {
  it('checks whether value is a boolean', () => {
    const err = new Error('Invalid');
    const validator = $boolean(err);
    expect(validator(true)).toBe(undefined);
    expect(validator(false)).toBe(undefined);
    expect(validator('A String')).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });
});

describe('$or', () => {
  describe('single clause', () => {
    it('passes if value matches at least one validator', () => {
      const err = new Error('Invalid');
      const validator = $or($string)(err);
      expect(validator('A string')).toBe(undefined);
      expect(validator(123)).toBe(err);
      expect(validator(true)).toBe(err);
      expect(validator(undefined)).toBe(err);
      expect(validator(null)).toBe(err);
    });
  });

  describe('multiple clauses', () => {
    it('passes if value matches at least one validator', () => {
      const err = new Error('Invalid');
      const validator = $or($string, $number, $boolean)(err);
      expect(validator('A string')).toBe(undefined);
      expect(validator(123)).toBe(undefined);
      expect(validator(false)).toBe(undefined);
      expect(validator([])).toBe(err);
      expect(validator(undefined)).toBe(err);
      expect(validator(null)).toBe(err);
    });
  });
});

// TODO: Worth testing `or` as completely different code path to `$or`.
// describe('or', () => {});

describe('$and', () => {
  describe('single clause', () => {
    it('passes if all values pass', () => {
      const err = new Error('Invalid');
      const validator = $and($string)(err);
      expect(validator('A string')).toBe(undefined);
      expect(validator('A')).toBe(undefined);
      expect(validator([1, 2, 3, 4])).toBe(err);
      expect(validator(true)).toBe(err);
      expect(validator(undefined)).toBe(err);
      expect(validator(null)).toBe(err);
    });
  });

  describe('multiple clauses', () => {
    it('passes if value matches at least one validator', () => {
      const err = new Error('Invalid');
      const validator = $and($string, $minLength(2))(err);
      expect(validator('A string')).toBe(undefined);
      expect(validator('A ')).toBe(undefined);
      expect(validator('A')).toBe(err);
      expect(validator([1, 2, 3, 4])).toBe(err);
      expect(validator(true)).toBe(err);
      expect(validator(undefined)).toBe(err);
      expect(validator(null)).toBe(err);
    });
  });
});

describe('$array', () => {
  it('$array(string)', () => {
    const validator = $array($string('Expected string'))('Expected array');
    expect(validator(true)).toEqual(withStructure(['Expected array']));
    expect(validator(false)).toEqual(withStructure(['Expected array']));
    expect(validator('A String')).toEqual(withStructure(['Expected array']));
    expect(validator(undefined)).toEqual(withStructure(['Expected array']));
    expect(validator(null)).toEqual(withStructure(['Expected array']));
    expect(validator([true])).toEqual(withStructure(['Expected string']));
    expect(validator([false])).toEqual(withStructure(['Expected string']));
    expect(validator(['A String'])).toEqual(withStructure([undefined]));
    expect(validator(['A String', 'another string'])).toEqual(
      withStructure([undefined, undefined])
    );
    expect(validator([undefined])).toEqual(withStructure(['Expected string']));
    expect(validator([null])).toEqual(withStructure(['Expected string']));
    expect(validator([true, false, 'A String', undefined, null])).toEqual(
      withStructure([
        'Expected string',
        'Expected string',
        undefined,
        'Expected string',
        'Expected string'
      ])
    );
  });
});

describe('$minLength(3)', () => {
  describe('valid', () => {
    ['   ', 'A string', ['An', 'arr', 'ay'], ['An', 'arr', 'ay', 'ok']].forEach(
      (val) => {
        it(`${val}`, () => {
          const err = new Error('Invalid');
          const validator = $minLength(3)(err);
          expect(validator(val)).toBe(undefined);
        });
      }
    );
  });

  describe('invalid', () => {
    [
      'A',
      [],
      ['An', 'ay'],
      '',
      ' ',
      'a',
      'ab',
      true,
      false,
      null,
      -1,
      0,
      1,
      2,
      Infinity,
      NaN,
      // Symbol("foo"),
      {},
      () => {},
      /foo/,
      new Set(),
      new Map(),
      new Error(),
      new Date('2021-01-09')
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $minLength(3)(err);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('$maxLength(3)', () => {
  describe('valid', () => {
    [
      '',
      ' ',
      '  ',
      'a',
      'ab',
      'abc',
      [],
      ['a'],
      ['a', 'b'],
      ['a', 'b', 'c'],
      [0, new Date(), {}]
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $maxLength(3)(err);
        expect(validator(val)).toBe(undefined);
      });
    });
  });

  describe('invalid', () => {
    [
      '    ',
      ['An', 'arr', 'ay', 'Asd'],
      true,
      false,
      null,
      -1,
      0,
      1,
      2,
      Infinity,
      NaN,
      // Symbol("foo"),
      {},
      () => {},
      /foo/,
      new Set(),
      new Map(),
      new Error(),
      new Date('2021-01-09')
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $maxLength(3)(err);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('$length(3)', () => {
  describe('valid', () => {
    ['   ', 'abc', ['a', 'b', 'c'], [0, new Date(), {}]].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $length(3)(err);
        expect(validator(val)).toBe(undefined);
      });
    });
  });

  describe('invalid', () => {
    [
      '',
      ' ',
      '  ',
      '    ',
      [],
      ['An'],
      ['An', 'arr'],
      ['An', 'arr', 'ay', 'Asd'],
      true,
      false,
      null,
      -1,
      0,
      1,
      2,
      Infinity,
      NaN,
      // Symbol("foo"),
      {},
      () => {},
      /foo/,
      new Set(),
      new Map(),
      new Error(),
      new Date('2021-01-09')
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $length(3)(err);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('$length(3, 5)', () => {
  describe('valid', () => {
    [
      '   ',
      '    ',
      '     ',
      'abc',
      'abcd',
      'abcde',
      ['a', 'b', 'c'],
      ['a', 'b', 'c', 'd'],
      ['a', 'b', 'c', 'd', 'e'],
      [0, new Date(), {}],
      [0, new Date(), {}, false],
      [0, new Date(), {}, false, 'a']
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $length(3, 5)(err);
        expect(validator(val)).toBe(undefined);
      });
    });
  });

  describe('invalid', () => {
    [
      '',
      ' ',
      '  ',
      [],
      ['An'],
      ['An', 'arr'],
      ['a', 'b', 'c', 'd', 'e', 'f'],
      true,
      false,
      null,
      -1,
      0,
      1,
      2,
      Infinity,
      NaN,
      // Symbol("foo"),
      {},
      () => {},
      /foo/,
      new Set(),
      new Map(),
      new Error(),
      new Date('2021-01-09')
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $length(3, 5)(err);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('$nullish', () => {
  it('checks whether value is null or undefined', () => {
    const err = new Error('Invalid');
    const validator = $nullish(err);
    expect(validator(undefined)).toBe(undefined);
    expect(validator(null)).toBe(undefined);
    expect(validator(0)).toBe(err);
    expect(validator(false)).toBe(err);
    expect(validator('A string')).toBe(err);
  });
});

describe('$min(3)', () => {
  describe('valid', () => {
    [3, 4, 5, Infinity].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $min(3)(err);
        expect(validator(val)).toBe(undefined);
      });
    });
  });

  describe('invalid', () => {
    [
      -1,
      0,
      1,
      2,
      NaN,
      true,
      false,
      null,
      // Symbol("foo"),
      {},
      [],
      () => {},
      /foo/,
      new Set(),
      new Map(),
      new Error(),
      new Date('2021-01-09')
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $min(3)(err);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('$max(3)', () => {
  describe('valid', () => {
    [-1, 0, 1, 2, 3].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $max(3)(err);
        expect(validator(val)).toBe(undefined);
      });
    });
  });

  describe('invalid', () => {
    [
      4,
      5,
      Infinity,
      NaN,
      true,
      false,
      null,
      // Symbol("foo"),
      {},
      [],
      () => {},
      /foo/,
      new Set(),
      new Map(),
      new Error(),
      new Date('2021-01-09')
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $max(3)(err);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe("$includes('a')", () => {
  describe('valid', () => {
    ['a', 'abc', 'bac', ['a'], ['a', 'b', 'c'], ['b', 'a', 'c']].forEach(
      (val) => {
        it(`${val}`, () => {
          const err = new Error('Invalid');
          const validator = $includes('a')(err);
          expect(validator(val)).toBe(undefined);
        });
      }
    );
  });

  describe('invalid', () => {
    [
      '',
      [],
      'b',
      'Abc',
      0,
      1,
      Infinity,
      NaN,
      true,
      false,
      null,
      // Symbol("foo"),
      {},
      () => {},
      /foo/,
      new Set(),
      new Map(),
      new Error(),
      new Date('2021-01-09')
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $includes('a')(err);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('$pattern(/[A-Z]/)', () => {
  describe('valid', () => {
    ['A', 'Abc', 'aBc'].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $pattern(/[A-Z]/)(err);
        expect(validator(val)).toBe(undefined);
      });
    });
  });

  describe('invalid', () => {
    [
      'a',
      'abc',
      0,
      1,
      Infinity,
      NaN,
      true,
      false,
      null,
      // Symbol("foo"),
      {},
      [],
      () => {},
      /foo/,
      new Set(),
      new Map(),
      new Error(),
      new Date('2021-01-09')
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $pattern(/[A-Z]/)(err);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe("$oneOf(0, 1, '2', false)", () => {
  describe('valid', () => {
    [0, 1, '2', false].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $oneOf(0, 1, '2', false)(err);
        expect(validator(val)).toBe(undefined);
      });
    });
  });

  describe('invalid', () => {
    [
      'a',
      'abc',
      2,
      Infinity,
      NaN,
      true,
      null,
      // Symbol("foo"),
      {},
      [],
      () => {},
      /foo/,
      new Set(),
      new Map(),
      new Error(),
      new Date('2021-01-09')
    ].forEach((val) => {
      it(`${val}`, () => {
        const err = new Error('Invalid');
        const validator = $oneOf(0, 1, '2', false)(err);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

// tuple(string, number, boolean)(err);

describe('$tuple(string, number, boolean)', () => {
  it('checks value is a tuple', () => {
    const string = $string('Expected string');
    const number = $number('Expected number');
    const boolean = $boolean('Expected boolean');
    const validator = $tuple(string, number, boolean)('Expected tuple');
    expect(validator(true)).toBe('Expected tuple');
    expect(validator(false)).toBe('Expected tuple');
    expect(validator('A String')).toBe('Expected tuple');
    expect(validator(undefined)).toBe('Expected tuple');
    expect(validator(null)).toBe('Expected tuple');
    expect(validator([])).toEqual(
      withStructure(['Expected string', 'Expected number', 'Expected boolean'])
    );
    expect(validator(['string'])).toEqual(
      withStructure([undefined, 'Expected number', 'Expected boolean'])
    );
    expect(validator(['string', false, 1])).toEqual(
      withStructure([undefined, 'Expected number', 'Expected boolean'])
    );
    expect(validator(['string', 1, false])).toEqual(
      withStructure([undefined, undefined, undefined])
    );
    expect(validator(['string', 1, false, 'foo'])).toBe('Expected tuple');
  });
});

describe('each', () => {
  it('behaves like `and` but supports more granular error messages', () => {
    const validator = each(
      $string('Must be a string'),
      $pattern(/[A-Z]/)('Must contain a capital letter'),
      $includes('_')('Must contain an underscore'),
      $minLength(8)('Must be at least 8 chars'),
      $maxLength(10)('Must be less than 20 chars')
    );
    expect(validator(1)).toBe('Must be a string');
    expect(validator('a_foo_78')).toBe('Must contain a capital letter');
    expect(validator('A-foo-78')).toBe('Must contain an underscore');
    expect(validator('A_foo_7')).toBe('Must be at least 8 chars');
    expect(validator('A_foo_78901')).toBe('Must be less than 20 chars');
    expect(validator('A_foo_78')).toBe(undefined);
  });
});

describe('all', () => {
  it('behaves like `each` but returns all the errors at once', () => {
    const validator = all(
      $string('Must be a string'),
      $pattern(/[A-Z]/)('Must contain a capital letter'),
      $includes('_')('Must contain an underscore'),
      $minLength(8)('Must be at least 8 chars'),
      $maxLength(10)('Must be less than 20 chars')
    );
    expect(validator('A_foo_78')).toEqual(undefined);
    expect(validator('a_foo_78')).toEqual(
      withStructure(['Must contain a capital letter'])
    );
    expect(validator('a-foo-78')).toEqual(
      withStructure([
        'Must contain a capital letter',
        'Must contain an underscore'
      ])
    );
    expect(validator('a-foo-7')).toEqual(
      withStructure([
        'Must contain a capital letter',
        'Must contain an underscore',
        'Must be at least 8 chars'
      ])
    );
    expect(validator('a-foo-78901')).toEqual(
      withStructure([
        'Must contain a capital letter',
        'Must contain an underscore',
        'Must be less than 20 chars'
      ])
    );
    expect(validator(1)).toEqual(
      withStructure([
        'Must be a string',
        'Must contain a capital letter',
        'Must contain an underscore',
        'Must be at least 8 chars',
        'Must be less than 20 chars'
      ])
    );
  });
});

describe('$not', () => {
  it('inverses a validator', () => {
    const err = new Error('Invalid');
    const validator = $not($string)(err);
    expect(validator('foo')).toBe(err);
    expect(validator(1)).toBe(undefined);
    expect(validator(undefined)).toBe(undefined);
    expect(validator(null)).toBe(undefined);

    const err2 = new Error('Invalid');
    const validator2 = $not($number)(err2);
    expect(validator2(1)).toBe(err2);
    expect(validator2('foo')).toBe(undefined);
    expect(validator2(undefined)).toBe(undefined);
    expect(validator2(null)).toBe(undefined);
  });
});

describe('not', () => {
  it('inverses a validator', () => {
    const string = $string('Expected string');
    const validator = not(string);
    expect(validator('foo')).toBe(
      // Yeh, needs work.
      'Expected not (value, ...parents) => predicate(value, ...parents) ? undefined : err'
    );
    expect(validator(1)).toBe(undefined);
    expect(validator(undefined)).toBe(undefined);
    expect(validator(null)).toBe(undefined);

    const number = $number('Expected number');
    const validator2 = not(number);
    // Yeh, needs work.
    expect(validator2(1)).toBe(
      'Expected not (value, ...parents) => predicate(value, ...parents) ? undefined : err'
    );
    expect(validator2('foo')).toBe(undefined);
    expect(validator2(undefined)).toBe(undefined);
    expect(validator2(null)).toBe(undefined);
  });
});

describe('$object({})', () => {
  it('checks value is an object', () => {
    const validator = $object({})('Expected object');
    expect(validator({})).toEqual(withStructure({}));
    // TODO: Consider accepting a 'strict' / 'exact' option which
    // doesn't allow extraneous keys.
    expect(validator({ foo: 'true' })).toEqual(withStructure({}));
    // TODO: Consider an option to expect plain object
    expect(validator(new Date())).toEqual(withStructure({}));
    expect(validator(undefined)).toEqual(
      withStructure({ __root: 'Expected object' })
    );
    expect(validator(null)).toEqual(
      withStructure({ __root: 'Expected object' })
    );
    expect(validator(null)).toMatchInlineSnapshot(`
      Object {
        "__root": "Expected object",
        Symbol(structure): true,
      }
    `);
    expect(listErrors(validator(null))).toMatchInlineSnapshot(`
      Array [
        Object {
          "err": "Expected object",
          "path": "__root",
        },
      ]
    `);
  });
});

describe('$object({ ...validators })', () => {
  it('checks value is an object matching validators', () => {
    const validator = $object({
      firstName: $and(
        $string,
        $minLength(1),
        $maxLength(255)
      )('First name is required'),
      middleName: $or(
        $nullish,
        $and($string, $minLength(1), $maxLength(255))
      )('Middle name must be a string'),
      lastName: $and(
        $string,
        $minLength(1),
        $maxLength(255)
      )(new Error('Last name is required')),
      address: $object({
        line1: $string('Line 1 is required'),
        line2: $string('Line 2 is required'),
        city: $string('City is required'),
        state: $or($nullish, $string)('State must be a string'),
        zip: $string('Zip is required'),
        country: $string('Country is required')
      })('Expected object'),
      favouriteColors: $and(
        $array($string('Expected string')),
        $maxLength(3)
      )('Favourite color must be an array of strings (max 3)')
    })('Expected object');
    const invalidUser = {
      firstName: 'Richard',
      middleName: null,
      lastName: 123,
      address: {
        line1: 'asd',
        line2: 'asd'
      },
      favoriteColors: ['1', '2', '3', '4']
    };
    const errors = validator(invalidUser);
    expect(hasError(errors)).toBe(true);
    expect(isError(errors)).toBe(true);
    expect(errors).toMatchInlineSnapshot(`
      Object {
        "address": Object {
          "city": "City is required",
          "country": "Country is required",
          "line1": undefined,
          "line2": undefined,
          "state": undefined,
          "zip": "Zip is required",
          Symbol(structure): true,
        },
        "favouriteColors": "Favourite color must be an array of strings (max 3)",
        "firstName": undefined,
        "lastName": [Error: Last name is required],
        "middleName": undefined,
        Symbol(structure): true,
      }
    `);
    expect(listErrors(errors)).toMatchInlineSnapshot(`
      Array [
        Object {
          "err": [Error: Last name is required],
          "path": "lastName",
        },
        Object {
          "err": "City is required",
          "path": "address.city",
        },
        Object {
          "err": "Zip is required",
          "path": "address.zip",
        },
        Object {
          "err": "Country is required",
          "path": "address.country",
        },
        Object {
          "err": "Favourite color must be an array of strings (max 3)",
          "path": "favouriteColors",
        },
      ]
    `);
  });
});

describe("$match('password')", () => {
  it('checks value matches sibling', () => {
    const validator = $match('password')('Expected to match password');
    expect(validator(undefined)).toBe('Expected to match password');
    expect(validator(null)).toBe('Expected to match password');
    expect(validator('password123')).toBe('Expected to match password');
    expect(validator('password123', {})).toBe('Expected to match password');
    expect(validator('password123', { foo: 'password123' })).toBe(
      'Expected to match password'
    );
    expect(validator('password123', { password: 'bar' })).toBe(
      'Expected to match password'
    );
    expect(validator('password123', { password: 'password123' })).toBe(
      undefined
    );
  });
});
