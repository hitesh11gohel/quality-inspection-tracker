/**
 * Typed HTTP response helpers.
 *
 * Centralises the ApiResponse shape so every controller produces consistent
 * JSON without duplicating the { success, data, message, error } structure.
 *
 * ApiResponse<T> is defined in @qit/shared so the frontend can import and
 * rely on the same type contract.
 */

import type { ApiResponse } from '@qit/shared';
import type { Response } from 'express';

/**
 * Send a successful JSON response.
 * @param res     - Express response object
 * @param data    - Payload to include under the `data` key
 * @param status  - HTTP status code (default 200)
 * @param message - Optional human-readable message for frontend notifications
 */
export function sendSuccess<T>(res: Response, data: T, status = 200, message?: string): void {
  const body: ApiResponse<T> = { success: true, ...(message && { message }), data };
  res.status(status).json(body);
}

/**
 * Send an error JSON response.
 * @param res    - Express response object
 * @param error  - Human-readable error description shown to the client
 * @param status - HTTP status code (400 / 401 / 404, etc.)
 */
export function sendError(res: Response, error: string, status: number): void {
  res.status(status).json({ success: false, error });
}
