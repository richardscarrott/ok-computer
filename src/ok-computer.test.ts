import {
  listErrors,
  isError,
  hasError,
  create,
  is,
  typeOf,
  instanceOf,
  number,
  boolean,
  bigint,
  string,
  symbol,
  fn,
  undef,
  nul,
  integer,
  finite,
  anyArray,
  or,
  xor,
  and,
  maxLength,
  minLength,
  length,
  nullish,
  min,
  max,
  includes,
  pattern,
  oneOf,
  not,
  INTROSPECT,
  array,
  tuple,
  all,
  object,
  OBJECT_ROOT,
  err,
  merge,
  when,
  match,
  andPeers,
  assert,
  nandPeers,
  orPeers,
  oxorPeers,
  xorPeers
} from './ok-computer';
import {
  ANDError,
  NegateError,
  ORError,
  XORError,
  asStructure,
  isIStructure
} from './errors';

describe('listErrors', () => {
  describe('valid', () => {
    [
      undefined,
      asStructure({
        foo: undefined,
        bar: undefined,
        baz: asStructure({
          qux: asStructure({})
        })
      }),
      asStructure([])
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
      const errors = asStructure({ foo: err });
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
      const errors = asStructure({
        foo: asStructure({
          bar: asStructure({
            qux: err1,
            quux: err2,
            corge: err3,
            grault: asStructure({
              garply: err4
            })
          }),
          quuz: err5
        }),
        waldo: asStructure([err6, err7])
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
        asStructure({
          foo: undefined,
          bar: undefined,
          baz: asStructure({
            qux: asStructure({})
          })
        }),
        asStructure([])
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
        asStructure({ foo: 'bar' }),
        asStructure({ foo: undefined, bar: asStructure({ baz: 0 }) }),
        asStructure(['foo'])
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
  it('accepts a predicate and returns a validator', () => {
    const error = 'Expected typeof string';
    const validator = create((value) => typeof value === 'string', error);
    expect(validator).toBeInstanceOf(Function);
    expect(validator('A string')).toBe(undefined);
    expect(validator(123)).toBe(error);
    expect(validator(undefined)).toBe(error);
    expect(validator(null)).toBe(error);
    const error2 = { id: 'invalid' };
    const validator2 = create((value) => typeof value === 'number', error2);
    expect(validator2).toBeInstanceOf(Function);
    expect(validator2(123)).toBe(undefined);
    expect(validator2('A string')).toBe(error2);
    expect(validator2(undefined)).toBe(error2);
    expect(validator2(null)).toBe(error2);
  });

  it('supports error introspection', () => {
    const error = 'Invalid';
    const validator = create(() => true, error);
    expect(validator(INTROSPECT)).toBe(error);
  });
});

describe('is', () => {
  test("is('foo')", () => {
    const validator = is('foo');
    const err = 'Expected foo';
    expect(validator('foo')).toBe(undefined);
    expect(validator('A string')).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  test('is(123)', () => {
    const validator = is(123);
    const err = 'Expected 123';
    expect(validator(123)).toBe(undefined);
    expect(validator(1)).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  test("is({ foo: 'bar' })", () => {
    const obj = { foo: 'bar' };
    const validator = is(obj);
    const err = 'Expected [object Object]';
    expect(validator(obj)).toBe(undefined);
    expect(validator({ foo: 'bar' })).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  test('introspection', () => {
    const validator = is(INTROSPECT);
    const err = 'Expected Symbol(ok-computer.introspect)';
    expect(validator(INTROSPECT)).toBe(err);
  });
});

describe('typeOf', () => {
  test("typeOf('string')", () => {
    const validator = typeOf('string');
    const err = 'Expected typeof string';
    expect(validator('A string')).toBe(undefined);
    expect(validator(123)).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  test("typeOf('number')", () => {
    const validator = typeOf('number');
    const err = 'Expected typeof number';
    expect(validator('A string')).toBe(err);
    expect(validator(123)).toBe(undefined);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  test('introspection', () => {
    const validator = typeOf('number');
    const err = 'Expected typeof number';
    expect(validator(INTROSPECT)).toBe(err);
  });
});

describe('instanceOf', () => {
  test(`instanceOf(Date)`, () => {
    const validator = instanceOf(Date);
    const err = 'Expected instanceof Date';
    expect(validator(new Date('2020-01-01'))).toBe(undefined);
    expect(validator({ foo: 'bar' })).toBe(err);
    expect(validator(123)).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  test(`instanceOf(Ctor)`, () => {
    class Ctor {}
    const validator = instanceOf(Ctor);
    const err = 'Expected instanceof Ctor';
    expect(validator(new Ctor())).toBe(undefined);
    expect(validator(123)).toBe(err);
    expect(validator(undefined)).toBe(err);
    expect(validator(null)).toBe(err);
  });

  test('introspection', () => {
    const validator = instanceOf(function Foo() {});
    const err = 'Expected instanceof Foo';
    expect(validator(INTROSPECT)).toBe(err);
  });
});

describe('number', () => {
  it('checks whether value is a number', () => {
    const err = 'Expected typeof number';
    expect(number(123)).toBe(undefined);
    expect(number('A string')).toBe(err);
    expect(number(undefined)).toBe(err);
    expect(number(null)).toBe(err);
  });
});

describe('boolean', () => {
  it('checks whether value is a boolean', () => {
    const err = 'Expected typeof boolean';
    expect(boolean(true)).toBe(undefined);
    expect(boolean(false)).toBe(undefined);
    expect(boolean('A String')).toBe(err);
    expect(boolean(undefined)).toBe(err);
    expect(boolean(null)).toBe(err);
  });
});

describe('bigint', () => {
  it('checks whether value is a bigint', () => {
    const err = 'Expected typeof bigint';
    expect(bigint(0n)).toBe(undefined);
    expect(bigint(BigInt(100))).toBe(undefined);
    expect(bigint('A String')).toBe(err);
    expect(bigint(100)).toBe(err);
    expect(bigint(undefined)).toBe(err);
    expect(bigint(null)).toBe(err);
  });
});

describe('string', () => {
  it('checks whether value is a string', () => {
    const err = 'Expected typeof string';
    expect(string('A string')).toBe(undefined);
    expect(string(123)).toBe(err);
    expect(string(undefined)).toBe(err);
    expect(string(null)).toBe(err);
  });
});

describe('symbol', () => {
  it('checks whether value is a symbol', () => {
    const err = 'Expected typeof symbol';
    expect(symbol(Symbol('foo'))).toBe(undefined);
    expect(symbol('A string')).toBe(err);
    expect(symbol(123)).toBe(err);
    expect(symbol(undefined)).toBe(err);
    expect(symbol(null)).toBe(err);
  });
});

describe('fn', () => {
  it('checks whether value is a function', () => {
    const err = 'Expected typeof function';
    expect(fn(function foo() {})).toBe(undefined);
    expect(fn(() => {})).toBe(undefined);
    expect(fn(class Ctor {})).toBe(undefined);
    expect(fn('A string')).toBe(err);
    expect(fn(123)).toBe(err);
    expect(fn(undefined)).toBe(err);
    expect(fn(null)).toBe(err);
  });
});

describe('undef', () => {
  it('checks whether value is undefined', () => {
    const err = 'Expected typeof undefined';
    expect(undef(undefined)).toBe(undefined);
    expect(undef(null)).toBe(err);
    expect(undef(0)).toBe(err);
    expect(undef(false)).toBe(err);
    expect(undef('A string')).toBe(err);
  });
});

describe('nul', () => {
  it('checks whether value is null', () => {
    const err = 'Expected null';
    expect(nul(null)).toBe(undefined);
    expect(nul(undefined)).toBe(err);
    expect(nul(0)).toBe(err);
    expect(nul(false)).toBe(err);
    expect(nul('A string')).toBe(err);
  });
});

describe('integer', () => {
  it('checks whether value is an integer', () => {
    const err = 'Expected integer';
    expect(integer(100)).toBe(undefined);
    expect(integer(0)).toBe(undefined);
    expect(integer(-100)).toBe(undefined);
    expect(integer(0.5)).toBe(err);
    expect(integer(1.00001)).toBe(err);
    expect(integer(-100.1)).toBe(err);
    expect(integer(false)).toBe(err);
    expect(integer('A string')).toBe(err);
    expect(integer(undefined)).toBe(err);
    expect(integer(null)).toBe(err);
  });
});

describe('finite', () => {
  it('checks whether value is finite', () => {
    const err = 'Expected finite number';
    expect(finite(100)).toBe(undefined);
    expect(finite(0)).toBe(undefined);
    expect(finite(-100)).toBe(undefined);
    expect(finite(0.5)).toBe(undefined);
    expect(finite(Infinity)).toBe(err);
    expect(finite(-Infinity)).toBe(err);
    expect(finite(false)).toBe(err);
    expect(finite('A string')).toBe(err);
    expect(finite(undefined)).toBe(err);
    expect(finite(null)).toBe(err);
  });
});

describe('anyArray', () => {
  it('checks whether value is an array', () => {
    const err = 'Expected array';
    expect(anyArray([])).toBe(undefined);
    expect(anyArray([true, 'A string', 0, false, {}])).toBe(undefined);
    expect(anyArray({})).toBe(err);
    expect(anyArray({ length: 10 })).toBe(err);
    expect(anyArray('A string')).toBe(err);
    expect(anyArray(123)).toBe(err);
    expect(anyArray(undefined)).toBe(err);
    expect(anyArray(null)).toBe(err);
  });
});

describe('or', () => {
  describe('single clause', () => {
    it('passes if value matches at least one validator', () => {
      const err = new ORError(['Expected typeof string']);
      const validator = or(string);
      expect(validator('A string')).toBe(undefined);
      expect(validator(123)).toEqual(err);
      expect(validator(true)).toEqual(err);
      expect(validator(undefined)).toEqual(err);
      expect(validator(null)).toEqual(err);
    });
  });

  describe('multiple clauses', () => {
    it('passes if value matches at least one validator', () => {
      const err = new ORError([
        'Expected typeof string',
        'Expected typeof number',
        'Expected typeof boolean'
      ]);
      const validator = or(string, number, boolean);
      expect(validator('A string')).toBe(undefined);
      expect(validator(123)).toBe(undefined);
      expect(validator(false)).toBe(undefined);
      expect(validator([])).toEqual(err);
      expect(validator(undefined)).toEqual(err);
      expect(validator(null)).toEqual(err);
    });
  });

  describe('introspection', () => {
    it('returns the error', () => {
      const validator = or(
        create(() => true),
        () => 'Expected something else'
      );
      const err = validator(INTROSPECT);
      expect(err).toEqual(new ORError(['Invalid', 'Expected something else']));
    });
  });

  describe('short-circuit evaluation', () => {
    it('does not unnecessarily call validators', () => {
      const validator1 = or(
        create(() => true, 'Invalid'),
        (value) => {
          if (value === INTROSPECT) {
            // Introspection is allowed
            return 'Invalid';
          }
          throw new Error('Should not get here');
        }
      );
      expect(() => validator1('123')).not.toThrow();
    });
  });
});

describe('xor', () => {
  describe('single clause', () => {
    it('passes if value matches exactly one validator', () => {
      const err = new XORError(['Expected typeof string']);
      const validator = xor(string);
      expect(validator('A string')).toBe(undefined);
      expect(validator(123)).toEqual(err);
      expect(validator(true)).toEqual(err);
      expect(validator(undefined)).toEqual(err);
      expect(validator(null)).toEqual(err);
    });
  });

  describe('multiple clauses', () => {
    it('passes if value matches exactly one validator', () => {
      const err = new XORError([
        'Expected to include foo',
        'Expected to include bar',
        'Expected to include baz'
      ]);
      const validator = xor(includes('foo'), includes('bar'), includes('baz'));
      expect(validator('foo')).toBe(undefined);
      expect(validator('bar')).toBe(undefined);
      expect(validator('baz')).toBe(undefined);
      expect(validator('foo blah')).toBe(undefined);
      expect(validator('fou bar blaz')).toBe(undefined);
      expect(validator('blah baz')).toBe(undefined);
      expect(validator('foo bar')).toEqual(err);
      expect(validator('foo baz')).toEqual(err);
      expect(validator('bar baz')).toEqual(err);
      expect(validator('foo bar baz')).toEqual(err);
      expect(validator('barb food')).toEqual(err);
      expect(validator(false)).toEqual(err);
      expect(validator([])).toEqual(err);
      expect(validator(undefined)).toEqual(err);
      expect(validator(null)).toEqual(err);
    });
  });

  describe('introspection', () => {
    it('returns an error', () => {
      const validator = xor(
        create(() => true),
        () => 'Expected something else'
      );
      const err = validator(INTROSPECT);
      expect(err).toEqual(new XORError(['Invalid', 'Expected something else']));
    });
  });

  describe('short-circuit evaluation', () => {
    it('does not unnecessarily call validators', () => {
      const validator1 = xor(
        create(() => true, 'Invalid'),
        create(() => true, 'Invalid'),
        (value) => {
          if (value === INTROSPECT) {
            // Introspection is allowed
            return 'Invalid';
          }
          throw new Error('Should not get here');
        }
      );
      expect(() => validator1('123')).not.toThrow();
    });
  });
});

describe('and', () => {
  describe('single clause', () => {
    it('passes if all values pass', () => {
      const err = new ANDError(['Expected typeof string']);
      const validator = and(string);
      expect(validator('A string')).toBe(undefined);
      expect(validator('A')).toBe(undefined);
      expect(validator([1, 2, 3, 4])).toEqual(err);
      expect(validator(true)).toEqual(err);
      expect(validator(undefined)).toEqual(err);
      expect(validator(null)).toEqual(err);
    });
  });

  describe('multiple clauses', () => {
    it('passes if value matches at least one validator', () => {
      const err = new ANDError([
        'Expected typeof string',
        'Expected min length 2',
        'Expected max length 8'
      ]);
      const validator = and(string, minLength(2), maxLength(8));
      expect(validator('A string')).toBe(undefined);
      expect(validator('A ')).toBe(undefined);
      expect(validator(' A')).toBe(undefined);
      // NOTE: Alternatively we could return just the validators
      // which failed here, e.g.
      // new ANDError([
      //   'Expected min length 2',
      //   'Expected max length 8'
      // ]);
      expect(validator('A')).toEqual(err);
      // And
      // new ANDError([
      //   'Expected max length 8'
      // ]);
      expect(validator('A longer string')).toEqual(err);
      expect(validator([1, 2])).toEqual(err);
      expect(validator([1, 2, 3, 4])).toEqual(err);
      expect(validator(true)).toEqual(err);
      expect(validator(undefined)).toEqual(err);
      expect(validator(null)).toEqual(err);
    });
  });

  describe('introspection', () => {
    it('returns an error', () => {
      const validator = and(
        create(() => true),
        () => 'Expected something else'
      );
      const err = validator(INTROSPECT);
      expect(err).toEqual(new ANDError(['Invalid', 'Expected something else']));
    });
  });

  describe('short-circuit evaluation', () => {
    it('does not unnecessarily call validators', () => {
      const validator1 = and(
        create(() => false, 'Invalid'),
        (value) => {
          if (value === INTROSPECT) {
            // Introspection is allowed
            return 'Invalid';
          }
          throw new Error('Should not get here');
        }
      );
      expect(() => validator1('123')).not.toThrow();
    });
  });
});

describe('maxLength(3)', () => {
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
        const validator = maxLength(3);
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
        const err = 'Expected max length 3';
        const validator = maxLength(3);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('minLength(3)', () => {
  describe('valid', () => {
    ['   ', 'A string', ['An', 'arr', 'ay'], ['An', 'arr', 'ay', 'ok']].forEach(
      (val) => {
        it(`${val}`, () => {
          const validator = minLength(3);
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
        const err = 'Expected min length 3';
        const validator = minLength(3);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('length(3)', () => {
  describe('valid', () => {
    ['   ', 'abc', ['a', 'b', 'c'], [0, new Date(), {}]].forEach((val) => {
      it(`${val}`, () => {
        const validator = length(3);
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
        const err = 'Expected length 3';
        const validator = length(3);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('length(3, 5)', () => {
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
        const validator = length(3, 5);
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
        const err = 'Expected length between 3 and 5';
        const validator = length(3, 5);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('nullish', () => {
  it('checks whether value is null or undefined', () => {
    const err = 'Expected nullish';
    const validator = nullish;
    expect(validator(undefined)).toBe(undefined);
    expect(validator(null)).toBe(undefined);
    expect(validator(0)).toBe(err);
    expect(validator(false)).toBe(err);
    expect(validator('A string')).toBe(err);
  });
});

describe('min(3)', () => {
  describe('valid', () => {
    [3, 4, 5, Infinity].forEach((val) => {
      it(`${val}`, () => {
        const validator = min(3);
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
        const err = 'Expected min 3';
        const validator = min(3);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('max(3)', () => {
  describe('valid', () => {
    [-1, 0, 1, 2, 3].forEach((val) => {
      it(`${val}`, () => {
        const validator = max(3);
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
        const err = 'Expected max 3';
        const validator = max(3);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe("includes('a')", () => {
  describe('valid', () => {
    ['a', 'abc', 'bac', ['a'], ['a', 'b', 'c'], ['b', 'a', 'c']].forEach(
      (val) => {
        it(`${val}`, () => {
          const validator = includes('a');
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
        const err = 'Expected to include a';
        const validator = includes('a');
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('pattern(/[A-Z]/)', () => {
  describe('valid', () => {
    ['A', 'Abc', 'aBc'].forEach((val) => {
      it(`${val}`, () => {
        const validator = pattern(/[A-Z]/);
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
        const err = 'Expected to match pattern /[A-Z]/';
        const validator = pattern(/[A-Z]/);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe("oneOf(0, 1, '2', false)", () => {
  describe('valid', () => {
    [0, 1, '2', false].forEach((val) => {
      it(`${val}`, () => {
        const validator = oneOf(0, 1, '2', false);
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
        const err = 'Expected one of 0, 1, 2, false';
        const validator = oneOf(0, 1, '2', false);
        expect(validator(val)).toBe(err);
      });
    });
  });
});

describe('not', () => {
  it('inverses a validator', () => {
    const err = new NegateError('Expected typeof string');
    const validator = not(string);
    expect(validator('foo')).toEqual(err);
    expect(validator(1)).toBe(undefined);
    expect(validator(undefined)).toBe(undefined);
    expect(validator(null)).toBe(undefined);

    const err2 = new NegateError('Expected typeof number');
    const validator2 = not(number);
    expect(validator2(1)).toEqual(err2);
    expect(validator2('foo')).toBe(undefined);
    expect(validator2(undefined)).toBe(undefined);
    expect(validator2(null)).toBe(undefined);
  });
});

describe('array', () => {
  it('returns an array of errors', () => {
    const validator = array(string);
    expect(validator(true)).toEqual(asStructure(['Expected array']));
    expect(validator(false)).toEqual(asStructure(['Expected array']));
    expect(validator('A String')).toEqual(asStructure(['Expected array']));
    expect(validator(undefined)).toEqual(asStructure(['Expected array']));
    expect(validator(null)).toEqual(asStructure(['Expected array']));
    expect(validator([true])).toEqual(asStructure(['Expected typeof string']));
    expect(validator([false])).toEqual(asStructure(['Expected typeof string']));
    expect(validator(['A String'])).toEqual(asStructure([undefined]));
    expect(validator(['A String', 'another string'])).toEqual(
      asStructure([undefined, undefined])
    );
    expect(validator([undefined])).toEqual(
      asStructure(['Expected typeof string'])
    );
    expect(validator([null])).toEqual(asStructure(['Expected typeof string']));
    expect(validator([true, false, 'A String', undefined, null])).toEqual(
      asStructure([
        'Expected typeof string',
        'Expected typeof string',
        undefined,
        'Expected typeof string',
        'Expected typeof string'
      ])
    );
    expect(validator(INTROSPECT)).toEqual(
      asStructure(['Expected typeof string'])
    );
  });
});

describe('tuple', () => {
  it('returns an array of errors', () => {
    const validator = tuple(string, boolean, number);
    expect(validator(['A string', true, 123])).toEqual(
      asStructure([undefined, undefined, undefined])
    );
    expect(validator(undefined)).toEqual(
      asStructure([
        'Expected typeof string',
        'Expected typeof boolean',
        'Expected typeof number'
      ])
    );
    expect(validator('A string')).toEqual(
      asStructure([
        'Expected typeof string',
        'Expected typeof boolean',
        'Expected typeof number'
      ])
    );
    expect(validator(['A string', true, 123, 'Another string'])).toEqual(
      asStructure([undefined, undefined, undefined, 'Extraneous element'])
    );
    expect(validator([234, true, 123, 'Another string'])).toEqual(
      asStructure([
        'Expected typeof string',
        undefined,
        undefined,
        'Extraneous element'
      ])
    );
    expect(validator([234, 'true', '123', 'Another string'])).toEqual(
      asStructure([
        'Expected typeof string',
        'Expected typeof boolean',
        'Expected typeof number',
        'Extraneous element'
      ])
    );
    expect(validator(['A string', true])).toEqual(
      asStructure([undefined, undefined, 'Expected typeof number'])
    );
    expect(validator([true, true])).toEqual(
      asStructure([
        'Expected typeof string',
        undefined,
        'Expected typeof number'
      ])
    );
    expect(validator([234, 'true'])).toEqual(
      asStructure([
        'Expected typeof string',
        'Expected typeof boolean',
        'Expected typeof number'
      ])
    );
    expect(validator([234, 'true', false])).toEqual(
      asStructure([
        'Expected typeof string',
        'Expected typeof boolean',
        'Expected typeof number'
      ])
    );
    expect(validator([])).toEqual(
      asStructure([
        'Expected typeof string',
        'Expected typeof boolean',
        'Expected typeof number'
      ])
    );
    expect(validator([123])).toEqual(
      asStructure([
        'Expected typeof string',
        'Expected typeof boolean',
        'Expected typeof number'
      ])
    );
    expect(validator(['123'])).toEqual(
      asStructure([
        undefined,
        'Expected typeof boolean',
        'Expected typeof number'
      ])
    );
    expect(validator(INTROSPECT)).toEqual(
      asStructure([
        'Expected typeof string',
        'Expected typeof boolean',
        'Expected typeof number'
      ])
    );
    const validator2 = tuple(string, nullish);
    expect(validator2(['A string', null])).toEqual(
      asStructure([undefined, undefined])
    );
    expect(validator2(['A string', undefined])).toEqual(
      asStructure([undefined, undefined])
    );
    expect(validator2(['A string'])).toEqual(
      asStructure([undefined, 'Expected nullish'])
    );
    expect(validator2([123])).toEqual(
      asStructure(['Expected typeof string', 'Expected nullish'])
    );
  });
});

describe('all', () => {
  it('behaves like `and` but only returns errors for validators have failed', () => {
    const validator = all(
      string,
      pattern(/[A-Z]/),
      includes('_'),
      minLength(8),
      maxLength(10)
    );
    expect(validator('A_foo_78')).toEqual(undefined);
    expect(validator('a_foo_78')).toEqual(
      new ANDError(['Expected to match pattern /[A-Z]/'])
    );
    expect(validator('a-foo-78')).toEqual(
      new ANDError([
        'Expected to match pattern /[A-Z]/',
        'Expected to include _'
      ])
    );
    expect(validator('a-foo-7')).toEqual(
      new ANDError([
        'Expected to match pattern /[A-Z]/',
        'Expected to include _',
        'Expected min length 8'
      ])
    );
    expect(validator('a-foo-78901')).toEqual(
      new ANDError([
        'Expected to match pattern /[A-Z]/',
        'Expected to include _',
        'Expected max length 10'
      ])
    );
    expect(validator(1)).toEqual(
      new ANDError([
        'Expected typeof string',
        'Expected to match pattern /[A-Z]/',
        'Expected to include _',
        'Expected min length 8',
        'Expected max length 10'
      ])
    );
  });

  it("and doesn't short-circuit evaluation", () => {
    const validator1 = all(
      create(() => false, 'First error'),
      create(() => true, 'Second error'),
      create(() => false, 'Third error')
    );
    expect(validator1('123')).toEqual(
      new ANDError(['First error', 'Third error'])
    );
  });

  describe('introspection', () => {
    it('returns an error', () => {
      const validator = all(
        create(() => true),
        () => 'Expected something else'
      );
      const err = validator(INTROSPECT);
      expect(err).toEqual(new ANDError(['Invalid', 'Expected something else']));
    });
  });
});

describe('object', () => {
  it('returns a root error if value is not a plain object', () => {
    const validator = object({});
    expect(validator(undefined)).toEqual(
      asStructure({ [OBJECT_ROOT]: 'Expected object' })
    );
    expect(validator(null)).toEqual(
      asStructure({ [OBJECT_ROOT]: 'Expected object' })
    );
    expect(validator(true)).toEqual(
      asStructure({ [OBJECT_ROOT]: 'Expected object' })
    );
    expect(validator(false)).toEqual(
      asStructure({ [OBJECT_ROOT]: 'Expected object' })
    );
    expect(validator(0)).toEqual(
      asStructure({ [OBJECT_ROOT]: 'Expected object' })
    );
    expect(validator(BigInt(0))).toEqual(
      asStructure({ [OBJECT_ROOT]: 'Expected object' })
    );
    expect(validator(() => {})).toEqual(
      asStructure({ [OBJECT_ROOT]: 'Expected object' })
    );
    expect(validator(new (class Foo {})())).toEqual(
      asStructure({ [OBJECT_ROOT]: 'Expected object' })
    );
    function Bar() {}
    expect(
      validator(
        // @ts-ignore
        new Bar()
      )
    ).toEqual(asStructure({ [OBJECT_ROOT]: 'Expected object' }));
    expect(validator(new Date())).toEqual(
      asStructure({ [OBJECT_ROOT]: 'Expected object' })
    );
    expect(validator({})).toEqual({});
    expect(validator(new Object())).toEqual({});
    expect(validator(Object.create(null))).toEqual({});
  });

  describe('object({ ...validators })', () => {
    it('checks value is an object matching validators', () => {
      const validator = object({
        firstName: and(string, minLength(1), maxLength(255)),
        middleName: or(nullish, and(string, minLength(1), maxLength(255))),
        lastName: and(string, minLength(1), maxLength(255)),
        address: object({
          line1: string,
          line2: string,
          city: string,
          state: or(nullish, string),
          zip: string,
          country: string,
          [Symbol.for('test')]: object({
            [Symbol.for('test2')]: string
          })
        }),
        favouriteColors: and(array(string), maxLength(3))
      });
      const validUser = {
        firstName: 'Lewis',
        lastName: 'Hamilton',
        address: {
          line1: '123 Fake street',
          line2: 'Somehwere?',
          city: 'Nowhere',
          state: 'EW',
          zip: '10001',
          country: 'GB',
          [Symbol.for('test')]: {
            [Symbol.for('test2')]: 'foo'
          }
        },
        favouriteColors: ['Blue', 'Red']
      };
      expect(validator(validUser)).toMatchInlineSnapshot(`
        Object {
          "address": Object {
            "city": undefined,
            "country": undefined,
            "line1": undefined,
            "line2": undefined,
            "state": undefined,
            "zip": undefined,
            Symbol(test): Object {
              Symbol(test2): undefined,
            },
          },
          "favouriteColors": undefined,
          "firstName": undefined,
          "lastName": undefined,
          "middleName": undefined,
        }
      `);
      expect(isError(validator(validUser))).toBe(false);
      expect(hasError(validator(validUser))).toBe(false);
      const invalidUser = {
        firstName: 'Richard',
        middleName: null,
        lastName: 123,
        address: {
          line1: 'asd',
          line2: 'asd'
        },
        favouriteColors: ['1', '2', '3', '4']
      };
      const errors = validator(invalidUser);
      expect(hasError(errors)).toBe(true);
      expect(isError(errors)).toBe(true);

      expect(errors).toMatchInlineSnapshot(`
        Object {
          "address": Object {
            "city": "Expected typeof string",
            "country": "Expected typeof string",
            "line1": undefined,
            "line2": undefined,
            "state": undefined,
            "zip": "Expected typeof string",
            Symbol(test): Object {
              Symbol(ok-computer.object-root): "Expected object",
              Symbol(test2): "Expected typeof string",
            },
          },
          "favouriteColors": Object {
            "errors": Array [
              Array [
                "Expected typeof string",
              ],
              "Expected max length 3",
            ],
            "operator": "AND",
            "type": "ANDError",
          },
          "firstName": undefined,
          "lastName": "(Expected typeof string and expected min length 1 and expected max length 255)",
          "middleName": undefined,
        }
      `);
      expect(listErrors(errors)).toMatchInlineSnapshot(`
        Array [
          Object {
            "err": "(Expected typeof string and expected min length 1 and expected max length 255)",
            "path": "lastName",
          },
          Object {
            "err": "Expected typeof string",
            "path": "address.city",
          },
          Object {
            "err": "Expected typeof string",
            "path": "address.zip",
          },
          Object {
            "err": "Expected typeof string",
            "path": "address.country",
          },
          Object {
            "err": "Expected object",
            "path": "address.Symbol(test).Symbol(ok-computer.object-root)",
          },
          Object {
            "err": "Expected typeof string",
            "path": "address.Symbol(test).Symbol(test2)",
          },
          Object {
            "err": Object {
              "errors": Array [
                Array [
                  "Expected typeof string",
                ],
                "Expected max length 3",
              ],
              "operator": "AND",
              "type": "ANDError",
            },
            "path": "favouriteColors",
          },
        ]
      `);
    });

    it('returns a root error if unknown properties are found', () => {
      const validator = object({
        firstName: and(string, minLength(1), maxLength(255)),
        middleName: or(nullish, and(string, minLength(1), maxLength(255))),
        lastName: and(string, minLength(1), maxLength(255))
      });
      const valid = validator({ firstName: 'Lewis', lastName: 'Hamilton' });
      expect(valid).toMatchInlineSnapshot(`
        Object {
          "firstName": undefined,
          "lastName": undefined,
          "middleName": undefined,
        }
      `);
      expect(isError(valid)).toBe(false);
      const invalid = validator({
        firstName: 'Lewis',
        lastName: 'Hamilton',
        unknownProp1: 'property',
        unknownProp2: ['prop']
      });
      expect(invalid).toMatchInlineSnapshot(`
        Object {
          "firstName": undefined,
          "lastName": undefined,
          "middleName": undefined,
          Symbol(ok-computer.object-root): "Unknown properties \\"unknownProp1\\", \\"unknownProp2\\"",
        }
      `);
      expect(isError(invalid)).toBe(true);
    });

    it('allows call sites to opt-out of unknown property check', () => {
      const validator = object(
        {
          firstName: and(string, minLength(1), maxLength(255)),
          middleName: or(nullish, and(string, minLength(1), maxLength(255))),
          lastName: and(string, minLength(1), maxLength(255))
        },
        { allowUnknown: true }
      );
      const valid = validator({
        firstName: 'Lewis',
        lastName: 'Hamilton',
        unknownProp1: 'property'
      });
      expect(valid).toMatchInlineSnapshot(`
        Object {
          "firstName": undefined,
          "lastName": undefined,
          "middleName": undefined,
        }
      `);
      expect(isError(valid)).toBe(false);
    });
  });

  it('supports introspection', () => {
    const validator = object({
      firstName: string,
      lastName: create(() => true),
      picture: object({
        url: err(or(nullish, string), 'Expected nullish or string')
      })
    });
    expect(validator(INTROSPECT)).toEqual(
      asStructure({
        [OBJECT_ROOT]: 'Expected object',
        firstName: 'Expected typeof string',
        lastName: 'Invalid',
        picture: {
          [OBJECT_ROOT]: 'Expected object',
          url: 'Expected nullish or string'
        }
      })
    );
  });
});

describe('merge', () => {
  it('merges object validators', () => {
    // NOTE: `merge` currently only works when passing `allowUnknown: true`
    // into the input validators 😔
    const validator1 = object({ firstName: string }, { allowUnknown: true });
    const validator2 = object(
      { lastName: or(nullish, string), age: number },
      { allowUnknown: true }
    );
    const validator3 = object({ age: integer }, { allowUnknown: true });
    const validator4 = merge(validator1, validator2, validator3);
    expect(validator4('foo')).toEqual(
      asStructure({
        age: 'Expected integer',
        firstName: 'Expected typeof string',
        lastName: undefined,
        [OBJECT_ROOT]: 'Expected object'
      })
    );
    expect(
      validator4({
        firstName: 'A string',
        age: 10
      })
    ).toEqual(
      asStructure({
        age: undefined,
        firstName: undefined,
        lastName: undefined
      })
    );
    const err = validator4({});
    expect(isIStructure(err)).toBe(true);
  });
});

describe('when', () => {
  it('executes the validator only when the predicate passes', () => {
    const validator1 = when(() => true)(string);
    const validator2 = when(() => false)(string);
    expect(validator1('123')).toBe(undefined);
    expect(validator2('123')).toBe(undefined);
    expect(validator1(123)).toBe('Expected typeof string');
    expect(validator2(123)).toBe(undefined);
  });

  it('supports introspection', () => {
    const validator1 = when(() => true)(string);
    const validator2 = when(() => false)(string);
    expect(validator1(INTROSPECT)).toBe('Expected typeof string');
    expect(validator2(INTROSPECT)).toBe('Expected typeof string');
  });
});

describe('match', () => {
  it('checks value matches sibling', () => {
    const validator = match('password');
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

describe('andPeer', () => {
  const validator = object({
    A: and(or(nullish, string), andPeers('B')),
    B: and(or(nullish, string), andPeers('A'))
  });

  [
    {
      description: 'Both',
      input: {
        A: '1',
        B: '2'
      },
      valid: true
    },
    {
      description: 'Neither',
      input: {},
      valid: true
    },
    {
      description: 'A only',
      input: {
        A: '1'
      },
      valid: false
    },
    {
      description: 'B only',
      input: {
        B: '2'
      },
      valid: false
    },
    {
      description: 'invalid A and invalid B',
      input: {
        A: Infinity,
        B: false
      },
      valid: false
    },
    {
      description: 'invalid A',
      input: {
        A: /123/,
        B: '123'
      },
      valid: false
    },
    {
      description: 'invalid B',
      input: {
        A: '123',
        B: 123
      },
      valid: false
    },
    {
      description: 'invalid A only',
      input: {
        A: []
      },
      valid: false
    },
    {
      description: 'invalid B only',
      input: {
        B: {}
      },
      valid: false
    }
  ].forEach((t) => {
    test(t.description, () => {
      const errors = validator(t.input);
      if (t.valid) {
        expect(() => assert(errors)).not.toThrow();
      } else {
        expect(() => assert(errors)).toThrow();
      }
    });
  });

  const validator2 = object({
    A: and(or(nullish, string), andPeers('B', 'C')),
    B: and(or(nullish, string), andPeers('A', 'C')),
    C: and(or(nullish, string), andPeers('A', 'B'))
  });

  [
    [0, 0, 0, 1], // This would be false in an `and` truth table, but we want all-or-nothing (there's no point in a pure 'and' peer fn; just make them all required)
    [0, 0, 1, 0],
    [0, 1, 0, 0],
    [0, 1, 1, 0],
    [1, 0, 0, 0],
    [1, 0, 1, 0],
    [1, 1, 0, 0],
    [1, 1, 1, 1]
  ].forEach(([A, B, C, Q]) => {
    test(`${A} ${B} ${C} ${Q}`, () => {
      const toVal = (v: unknown) => (v ? 'valid value' : undefined);
      const errors = validator2({ A: toVal(A), B: toVal(B), C: toVal(C) });
      if (Q) {
        expect(() => assert(errors)).not.toThrow();
      } else {
        expect(() => assert(errors)).toThrow();
      }
    });
  });
});

describe('nandPeer', () => {
  const validator = object({
    A: and(or(nullish, string), nandPeers('B')),
    B: and(or(nullish, string), nandPeers('A'))
  });

  [
    {
      description: 'Both',
      input: {
        A: '1',
        B: '2'
      },
      valid: false
    },
    {
      description: 'Neither',
      input: {},
      valid: true
    },
    {
      description: 'A only',
      input: {
        A: '1'
      },
      valid: true
    },
    {
      description: 'B only',
      input: {
        B: '2'
      },
      valid: true
    },
    {
      description: 'invalid A and invalid B',
      input: {
        A: new Date(),
        B: false
      },
      valid: false
    },
    {
      description: 'invalid A',
      input: {
        A: new Date(),
        B: '123'
      },
      valid: false
    },
    {
      description: 'invalid B',
      input: {
        A: '123',
        B: new Date()
      },
      valid: false
    },
    {
      description: 'invalid A only',
      input: {
        A: []
      },
      valid: false
    },
    {
      description: 'invalid B only',
      input: {
        B: {}
      },
      valid: false
    }
  ].forEach((t) => {
    test(t.description, () => {
      const errors = validator(t.input);
      if (t.valid) {
        expect(() => assert(errors)).not.toThrow();
      } else {
        expect(() => assert(errors)).toThrow();
      }
    });
  });

  const validator2 = object({
    A: and(or(nullish, string), nandPeers('B', 'C')),
    B: and(or(nullish, string), nandPeers('A', 'C')),
    C: and(or(nullish, string), nandPeers('A', 'B'))
  });

  // https://www.electronics-tutorials.ws/logic/logic_5.html
  [
    [0, 0, 0, 1],
    [0, 0, 1, 1],
    [0, 1, 0, 1],
    [0, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [1, 1, 1, 0]
  ].forEach(([A, B, C, Q]) => {
    test(`${A} ${B} ${C} ${Q}`, () => {
      const toVal = (v: unknown) => (v ? 'valid value' : undefined);
      const errors = validator2({ A: toVal(A), B: toVal(B), C: toVal(C) });
      if (Q) {
        expect(() => assert(errors)).not.toThrow();
      } else {
        expect(() => assert(errors)).toThrow();
      }
    });
  });
});

describe('orPeer', () => {
  const validator = object({
    A: and(or(nullish, string), orPeers('B')),
    B: and(or(nullish, string), orPeers('A'))
  });

  [
    {
      description: 'Both',
      input: {
        A: '1',
        B: '2'
      },
      valid: true
    },
    {
      description: 'Neither',
      input: {},
      valid: false
    },
    {
      description: 'A only',
      input: {
        A: '1'
      },
      valid: true
    },
    {
      description: 'B only',
      input: {
        B: '2'
      },
      valid: true
    },
    {
      description: 'invalid A and invalid B',
      input: {
        A: new Date(),
        B: false
      },
      valid: false
    },
    {
      description: 'invalid A',
      input: {
        A: new Date(),
        B: '123'
      },
      valid: false
    },
    {
      description: 'invalid B',
      input: {
        A: '123',
        B: new Date()
      },
      valid: false
    },
    {
      description: 'invalid A only',
      input: {
        A: []
      },
      valid: false
    },
    {
      description: 'invalid B only',
      input: {
        B: {}
      },
      valid: false
    }
  ].forEach((t) => {
    test(t.description, () => {
      const errors = validator(t.input);
      if (t.valid) {
        expect(() => assert(errors)).not.toThrow();
      } else {
        expect(() => assert(errors)).toThrow();
      }
    });
  });

  const validator2 = object({
    A: and(or(nullish, string), orPeers('B', 'C')),
    B: and(or(nullish, string), orPeers('A', 'C')),
    C: and(or(nullish, string), orPeers('A', 'B'))
  });

  // https://www.electronics-tutorials.ws/logic/logic_3.html
  [
    [0, 0, 0, 0],
    [0, 0, 1, 1],
    [0, 1, 0, 1],
    [0, 1, 1, 1],
    [1, 0, 0, 1],
    [1, 0, 1, 1],
    [1, 1, 0, 1],
    [1, 1, 1, 1]
  ].forEach(([A, B, C, Q]) => {
    test(`${A} ${B} ${C} ${Q}`, () => {
      const toVal = (v: unknown) => (v ? 'valid value' : undefined);
      const input = { A: toVal(A), B: toVal(B), C: toVal(C) };
      const errors = validator2(input);
      if (Q) {
        expect(() => assert(errors)).not.toThrow();
      } else {
        expect(() => assert(errors)).toThrow();
      }
    });
  });
});

describe('xorPeer', () => {
  const validator = object({
    A: and(or(nullish, string), xorPeers('B')),
    B: and(or(nullish, string), xorPeers('A'))
  });

  [
    {
      description: 'Both',
      input: {
        A: '1',
        B: '2'
      },
      valid: false
    },
    {
      description: 'Neither',
      input: {},
      valid: false
    },
    {
      description: 'A only',
      input: {
        A: '1'
      },
      valid: true
    },
    {
      description: 'B only',
      input: {
        B: '2'
      },
      valid: true
    },
    {
      description: 'invalid A and invalid B',
      input: {
        A: new Date(),
        B: false
      },
      valid: false
    },
    {
      description: 'invalid A',
      input: {
        A: new Date(),
        B: '123'
      },
      valid: false
    },
    {
      description: 'invalid B',
      input: {
        A: '123',
        B: new Date()
      },
      valid: false
    },
    {
      description: 'invalid A only',
      input: {
        A: []
      },
      valid: false
    },
    {
      description: 'invalid B only',
      input: {
        B: {}
      },
      valid: false
    }
  ].forEach((t) => {
    test(t.description, () => {
      const errors = validator(t.input);
      if (t.valid) {
        expect(() => assert(errors)).not.toThrow();
      } else {
        expect(() => assert(errors)).toThrow();
      }
    });
  });

  const validator2 = object({
    A: and(or(nullish, string), xorPeers('B', 'C')),
    B: and(or(nullish, string), xorPeers('A', 'C')),
    C: and(or(nullish, string), xorPeers('A', 'B'))
  });

  // https://www.electronics-tutorials.ws/logic/logic_7.html
  [
    [0, 0, 0, 0],
    [0, 0, 1, 1],
    [0, 1, 0, 1],
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 1, 0],
    [1, 1, 0, 0],
    [1, 1, 1, 0] // This would be true in an `xor` truth table 🤷‍♂️, but don't think it's what we want?
  ].forEach(([A, B, C, Q]) => {
    test(`${A} ${B} ${C} ${Q}`, () => {
      const toVal = (v: unknown) => (v ? 'valid value' : undefined);
      const input = { A: toVal(A), B: toVal(B), C: toVal(C) };
      const errors = validator2(input);
      if (Q) {
        expect(() => assert(errors)).not.toThrow();
      } else {
        expect(() => assert(errors)).toThrow();
      }
    });
  });
});

describe('oxorPeer', () => {
  const validator = object({
    A: and(or(nullish, string), oxorPeers('B')),
    B: and(or(nullish, string), oxorPeers('A'))
  });

  [
    {
      description: 'Both',
      input: {
        A: '1',
        B: '2'
      },
      valid: false
    },
    {
      description: 'Neither',
      input: {},
      valid: true
    },
    {
      description: 'A only',
      input: {
        A: '1'
      },
      valid: true
    },
    {
      description: 'B only',
      input: {
        B: '2'
      },
      valid: true
    },
    {
      description: 'invalid A and invalid B',
      input: {
        A: new Date(),
        B: false
      },
      valid: false
    },
    // TODO: These test cases are missing invalid A and invalid B (w/o the other)
    {
      description: 'invalid A',
      input: {
        A: new Date(),
        B: '123'
      },
      valid: false
    },
    {
      description: 'invalid B',
      input: {
        A: '123',
        B: new Date()
      },
      valid: false
    },
    {
      description: 'invalid A only',
      input: {
        A: []
      },
      valid: false
    },
    {
      description: 'invalid B only',
      input: {
        B: {}
      },
      valid: false
    }
  ].forEach((t) => {
    test(t.description, () => {
      const errors = validator(t.input);
      if (t.valid) {
        expect(() => assert(errors)).not.toThrow();
      } else {
        expect(() => assert(errors)).toThrow();
      }
    });
  });

  const validator2 = object({
    A: and(or(nullish, string), oxorPeers('B', 'C')),
    B: and(or(nullish, string), oxorPeers('A', 'C')),
    C: and(or(nullish, string), oxorPeers('A', 'B'))
  });

  [
    [0, 0, 0, 1],
    [0, 0, 1, 1],
    [0, 1, 0, 1],
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 1, 0],
    [1, 1, 0, 0],
    [1, 1, 1, 0] // This would be true in an `xor` truth table 🤷‍♂️, but don't think it's what we want?
  ].forEach(([A, B, C, Q]) => {
    test(`${A} ${B} ${C} ${Q}`, () => {
      const toVal = (v: unknown) => (v ? 'valid value' : undefined);
      const input = { A: toVal(A), B: toVal(B), C: toVal(C) };
      const errors = validator2(input);
      if (Q) {
        expect(() => assert(errors)).not.toThrow();
      } else {
        expect(() => assert(errors)).toThrow();
      }
    });
  });
});
