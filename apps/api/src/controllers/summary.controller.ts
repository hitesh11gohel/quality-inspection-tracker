/**
 * Summary controller — provides aggregated inspection statistics.
 *
 * Routes handled:
 *  GET /api/summary → returns SummaryStats for the frontend dashboard
 *
 * Delegates all DB aggregation to SummaryModel so this controller
 * stays focused on HTTP concerns only.
 */

import type { Request, Response } from 'express';
import { SummaryModel } from '../models/summary.model';
import { sendSuccess } from '../utils/response';

export const SummaryController = {
  /** Return total, open, resolved counts broken down by severity */
  async getStats(_req: Request, res: Response): Promise<void> {
    const stats = await SummaryModel.getStats();

    // Build a human-readable summary message for the frontend notification/header
    const message = stats.total === 0
      ? 'No inspections recorded yet'
      : `${stats.open} open and ${stats.resolved} resolved out of ${stats.total} total inspection${stats.total !== 1 ? 's' : ''}`;

    sendSuccess(res, stats, 200, message);
  },
};
