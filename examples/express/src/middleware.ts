import { RequestHandler, ErrorRequestHandler } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';
import { assert, Validator } from 'ok-computer';

class ApiError extends Error {
  public status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

class ValidationError extends ApiError {
  public error: unknown;
  constructor(message: string, status: number, error: unknown) {
    super(message, status);
    this.error = error;
  }
}

export const query =
  <T>(validator: Validator<T>): RequestHandler<ParamsDictionary, any, any, T> =>
  (req, res, next) => {
    assert(
      req.query,
      validator,
      ({ error }) => new ValidationError('Invalid req.query', 400, error)
    );
    next();
  };

export const params =
  <T>(validator: Validator<T>): RequestHandler<T> =>
  (req, res, next) => {
    assert(
      req.params,
      validator,
      ({ error }) => new ValidationError('Invalid req.params', 400, error)
    );
    next();
  };

export const body =
  <T>(validator: Validator<T>): RequestHandler<ParamsDictionary, any, T> =>
  (req, res, next) => {
    assert(
      req.body,
      validator,
      ({ error }) => new ValidationError('Invalid req.body', 400, error)
    );
    next();
  };

export const errorLogger: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  next(err);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof ApiError) {
    res.status(err.status ?? 500);
  }
  if (err instanceof ValidationError) {
    return res.json({
      message: err.message,
      error: err.error
    });
  }
  res.json({ message: err.message });
};
