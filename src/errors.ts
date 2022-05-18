import { isPrimitiveValue, lowerFirst } from './utils';
import { ErrItem } from './ok-computer';

interface IError<T = unknown> {
  // `toPrimitiveError` gives error objects the opportunity to serialize into a primitive value (if possible)
  readonly toPrimitiveError: () => T;
}

export const isIError = (val: any): val is IError =>
  val != null && typeof val.toPrimitiveError === 'function';

const STRUCTURE = Symbol('ok-computer.structure');

export interface IStructure {
  readonly [STRUCTURE]: true;
}

export const isIStructure = (val: any): val is IStructure =>
  val != null && val[STRUCTURE] === true;

export const asStructure = <T>(val: T): T & IStructure => {
  if (val == null) {
    throw new Error('Expected object');
  }
  Object.defineProperty(val, STRUCTURE, {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false
  });
  return val as T & IStructure;
};

interface ILogicalOperator<T> {
  readonly type: string;
  readonly operator: string;
  readonly errors: T[];
}

export class LogicalOperatorError<
  // NOTE: `extends any[]` so it can be treated as a tuple if desired
  // e.g. new LogicalOperatorError<[number, string, boolean]>('OK', [1, 'two', true])
  T extends any[]
> implements ILogicalOperator<T>, IError<ILogicalOperator<T> | string>
{
  type: string;
  operator: string;
  errors: T;
  constructor(operator: string, errors: T) {
    this.type = `${operator}Error`;
    this.operator = operator;
    this.errors = errors;
    if (this.errors.length < 1) {
      throw new Error(`Expected at least 1 error: ${this.operator}`);
    }
    // TODO: Check `errors` are actually errors w/ `isError`?
  }
  toPrimitiveError(): string | ILogicalOperator<T> {
    // If possible, serialize into string
    const primitiveErrors = this.errors.map((err) =>
      isIError(err) ? err.toPrimitiveError() : err
    );
    if (primitiveErrors.every(isPrimitiveValue)) {
      const str = primitiveErrors
        .map((err, i) =>
          err == null
            ? `${err}`
            : i === 0 || typeof err !== 'string'
            ? err.toString()
            : lowerFirst(err)
        )
        .join(` ${this.operator.toLowerCase()} `);
      return primitiveErrors.length > 1 ? `(${str})` : str;
    }
    // Otherwise just serialize to `ILogicalOperator`
    return {
      type: this.type,
      operator: this.operator,
      errors: this.errors
    };
  }
  toJSON() {
    return this.toPrimitiveError();
  }
  toString() {
    const error = this.toPrimitiveError();
    return typeof error === 'string' ? error : `[object ${this.type}]`;
  }
  // Undecided if this is a good idea; could make console.log debugging v. confusing
  // [Symbol.for('nodejs.util.inspect.custom')]() {
  //   return this.toPrimitiveError();
  // }
}

export class ORError<T extends any[]> extends LogicalOperatorError<T> {
  constructor(errors: T) {
    super('OR', errors);
  }
}

export class ANDError<T extends any[]> extends LogicalOperatorError<T> {
  constructor(errors: T) {
    super('AND', errors);
  }
}

export class XORError<T extends any[]> extends LogicalOperatorError<T> {
  constructor(errors: T) {
    super('XOR', errors);
  }
}

interface IPeerError<T> {
  readonly type: string;
  readonly key: string;
  readonly error: T;
}

export class PeerError<T>
  implements IPeerError<T>, IError<IPeerError<T> | string>
{
  type: string;
  key: string;
  error: T;
  constructor(key: string, error: T) {
    this.type = 'PeerError';
    this.key = key;
    this.error = error;
  }
  toPrimitiveError(): string | IPeerError<T> {
    // If possible, serialize into string
    const primitiveError = isIError(this.error)
      ? this.error.toPrimitiveError()
      : this.error;
    // Otherwise just serialize to `IPeerError`
    return typeof primitiveError === 'string'
      ? `Peer "${this.key}" ${lowerFirst(primitiveError)}`
      : { type: this.type, key: this.key, error: this.error };
  }
  toJSON() {
    return this.toPrimitiveError();
  }
  toString() {
    const primitive = this.toPrimitiveError();
    return typeof primitive === 'string' ? primitive : `[object ${this.type}]`;
  }
  // [Symbol.for('nodejs.util.inspect.custom')]() {
  //   return this.toPrimitiveError();
  // }
}

interface INegateError<T> {
  readonly type: string;
  readonly error: T;
}

export class NegateError<T>
  implements INegateError<T>, IError<INegateError<T> | string>
{
  type: string;
  error: T;
  constructor(error: T) {
    this.type = 'NegateError';
    this.error = error;
  }
  toPrimitiveError(): string | INegateError<T> {
    return typeof this.error === 'string'
      ? `not("${this.error}")`
      : { type: this.type, error: this.error };
  }
  toJSON() {
    return this.toPrimitiveError();
  }
  toString() {
    const json = this.toPrimitiveError();
    return typeof json === 'string' ? json : `[object ${this.type}]`;
  }
  // [Symbol.for('nodejs.util.inspect.custom')]() {
  //   return this.toPrimitiveError();
  // }
}

export class AssertError extends Error {
  public errors: ErrItem<any>[];
  constructor(errors: ErrItem<any>[]) {
    super();
    try {
      const firstError = errors[0];
      this.message = `Invalid: first of ${errors.length} errors: ${
        firstError.path
      }: ${
        firstError.err.toString() !== '[object Object]'
          ? firstError.err
          : JSON.stringify(firstError.err)
      }`;
    } catch (ex) {
      this.message = 'Invalid';
    }
    this.errors = errors;
  }
}
