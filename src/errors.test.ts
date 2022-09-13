import { LogicalOperatorError, PeerError } from './errors';

describe('LogicalOperatorError', () => {
  it('throws if given less than 1 error', () => {
    expect(() => new LogicalOperatorError('OR', [])).toThrow(
      new Error('Expected at least 1 error: OR')
    );
  });

  it('serializes primitive errors as string', () => {
    const err = new LogicalOperatorError('OR', ['Expected string']);
    expect(err.toPrimitiveError()).toBe('Expected string');
    expect(err.toJSON()).toBe('Expected string');
    expect(err.toString()).toBe('Expected string');
    // expect(err[Symbol.for('nodejs.util.inspect.custom')]()).toBe(
    //   'Expected string'
    // );
    const err2 = new LogicalOperatorError('OR', [
      'Expected string',
      123,
      BigInt(Number.MAX_SAFE_INTEGER) + BigInt(1),
      true,
      false,
      undefined,
      Symbol('symbol'),
      null
    ]);
    const expected =
      '(Expected string or 123 or 9007199254740992 or true or false or undefined or Symbol(symbol) or null)';
    expect(err2.toPrimitiveError()).toBe(expected);
    expect(err2.toJSON()).toBe(expected);
    expect(err2.toString()).toBe(expected);
    // expect(err2[Symbol.for('nodejs.util.inspect.custom')]()).toBe(expected);
  });

  it('serializes IErrors as string', () => {
    const err = new LogicalOperatorError('OR', [
      new LogicalOperatorError('OR', ['Expected null', 'Expected undefined']),
      new LogicalOperatorError('AND', [
        'Expected string',
        'Expected length 10'
      ]),
      { toPrimitiveError: (): string => 'Expected foo' },
      new PeerError('password', 'Expected nullish')
    ]);
    const expected =
      '((Expected null or expected undefined) or (Expected string and expected length 10) or expected foo or peer "password" expected nullish)';
    expect(err.toJSON()).toBe(expected);
    expect(err.toString()).toBe(expected);
    // expect(err[Symbol.for('nodejs.util.inspect.custom')]()).toBe(expected);
  });

  it('serializes primitive errors and IErrors as string', () => {
    const err = new LogicalOperatorError('OR', [
      'Expected nullish',
      new LogicalOperatorError('AND', [
        'Expected string',
        'Expected length 10'
      ]),
      123
    ]);
    const expected =
      '(Expected nullish or (Expected string and expected length 10) or 123)';
    expect(err.toJSON()).toBe(expected);
    expect(err.toString()).toBe(expected);
    // expect(err[Symbol.for('nodejs.util.inspect.custom')]()).toBe(expected);
  });

  it('does not serialize other errors as string', () => {
    const err = new LogicalOperatorError('AND', [
      'This could be serialized',
      true, // as could this,
      new LogicalOperatorError('AND', ['foo', 'bar']), // and this
      {
        id: 'but.this.cannot',
        defaultMessage: 'First name is required'
      },
      {
        id: 'and.neither.can.this',
        defaultMessage: 'First name must be between 1 and 256 chars'
      },
      new Date(0) // or this
    ]);
    // So nothing is serialized
    const expected = {
      type: 'ANDError',
      operator: 'AND',
      errors: [
        'This could be serialized',
        true,
        new LogicalOperatorError('AND', ['foo', 'bar']),
        {
          id: 'but.this.cannot',
          defaultMessage: 'First name is required'
        },
        {
          id: 'and.neither.can.this',
          defaultMessage: 'First name must be between 1 and 256 chars'
        },
        new Date(0)
      ]
    };
    expect(err.toPrimitiveError()).toEqual(expected);
    expect(err.toJSON()).toEqual(expected);
    expect(err.toString()).toBe('[object ANDError]');
    // expect(err[Symbol.for('nodejs.util.inspect.custom')]()).toEqual(expected);
  });
});
