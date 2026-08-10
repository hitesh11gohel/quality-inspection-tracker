/**
 * Summary model — aggregated statistics for the dashboard.
 *
 * A single GROUP BY query counts inspections by severity + status in one
 * round-trip. The result is then reduced in JS into the SummaryStats shape
 * expected by the frontend dashboard.
 */

import type { SummaryStats } from '@qit/shared';
import { db } from '../db/database';

export const SummaryModel = {
  /** Returns total, open, resolved counts — broken down by severity level */
  async getStats(): Promise<SummaryStats> {
    const result = await db.execute(
      `SELECT severity, status, COUNT(*) as count
       FROM inspections
       GROUP BY severity, status`
    );

    // Initialise all buckets to zero so the shape is always complete,
    // even when there are no inspections in a given severity/status combination
    const stats: SummaryStats = {
      total: 0,
      open: 0,
      resolved: 0,
      bySeverity: {
        Critical: { open: 0, resolved: 0, total: 0 },
        Major:    { open: 0, resolved: 0, total: 0 },
        Minor:    { open: 0, resolved: 0, total: 0 },
      },
    };

    for (const row of result.rows) {
      const sev    = row.severity as keyof typeof stats.bySeverity;
      const count  = Number(row.count);
      const isOpen = row.status === 'Open';

      // Roll up into top-level totals
      stats.total += count;
      if (isOpen) stats.open += count;
      else stats.resolved += count;

      // Roll up into per-severity breakdown (skip unknown severity values)
      if (stats.bySeverity[sev]) {
        stats.bySeverity[sev].total += count;
        if (isOpen) stats.bySeverity[sev].open += count;
        else stats.bySeverity[sev].resolved += count;
      }
    }

    return stats;
  },
};
