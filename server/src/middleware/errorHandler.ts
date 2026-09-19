import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode: number = 500, code: string = 'SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred.';
  let code = err.code || 'INTERNAL_ERROR';

  if (err instanceof ZodError) {
    statusCode = 400;
    message = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
    code = 'INVALID_ID';
  } else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `Duplicate key error: A record with that ${field} already exists.`;
    code = 'DUPLICATE_KEY';
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = `Upload error: ${err.message}`;
    code = 'UPLOAD_ERROR';
  }

  if (env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
