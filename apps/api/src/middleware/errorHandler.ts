/**
 * Global error handler middleware.
 *
 * Express identifies error-handling middleware by its 4-argument signature
 * (err, req, res, next). It is registered LAST in index.ts so it catches any
 * unhandled error thrown in a route or controller.
 *
 * The express-async-errors package ensures that async errors are also forwarded
 * here instead of crashing the process or hanging the request.
 */

import type { NextFunction, Request, Response } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the full stack trace server-side for debugging
  console.error(err.stack);

  // Never expose internal error details to the client in production
  res.status(500).json({ success: false, error: 'Internal server error' });
}
