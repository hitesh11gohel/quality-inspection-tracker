/**
 * Inspection model — all database operations for the inspections table.
 *
 * Responsibilities:
 *  - findAll  : paginated, filtered, sorted list with optional free-text search
 *  - findById : single record lookup
 *  - create   : insert a new Open inspection
 *  - resolve  : mark an inspection as Resolved with a resolution note
 *
 * All methods return typed Inspection objects (from @qit/shared) rather than
 * raw DB rows, so controllers never deal with the database shape directly.
 */

import type { Inspection } from "@qit/shared";
import { db } from "../db/database";

/** Raw row shape as stored in the inspections table */
interface DbRow {
  id: number;
  date: string;
  machineLineId: string;
  defectType: string;
  severity: string;
  status: string;
  remarks: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Parameters accepted by findAll for filtering, sorting and pagination */
interface ListFilters {
  search?: string;   // free-text — matches machineLineId, remarks, defectType
  severity?: string;
  status?: string;
  dateFrom?: string; // inclusive lower bound (YYYY-MM-DD)
  dateTo?: string;   // inclusive upper bound (YYYY-MM-DD)
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: string;
}

/** Fields required to create a new inspection record */
interface CreateData {
  date: string;
  machineLineId: string;
  defectType: string;
  severity: string;
  remarks?: string;
  createdBy: number; // id of the authenticated user submitting the record
}

// Whitelist of columns that are safe to interpolate into ORDER BY.
// Validated against user input in InspectionController to prevent SQL injection.
const SORT_COLS: Record<string, string> = {
  date: "date",
  severity: "severity",
  createdAt: "createdAt",
};

/**
 * Converts a raw DB row into the typed Inspection shape.
 * Optional fields (remarks, resolutionNote, etc.) are omitted from the object
 * entirely when null rather than being set to undefined.
 */
function toInspection(row: DbRow): Inspection {
  return {
    id: row.id,
    date: row.date,
    machineLineId: row.machineLineId,
    defectType: row.defectType as Inspection["defectType"],
    severity: row.severity as Inspection["severity"],
    status: row.status as Inspection["status"],
    ...(row.remarks        != null && { remarks: row.remarks }),
    ...(row.resolutionNote != null && { resolutionNote: row.resolutionNote }),
    ...(row.resolvedAt     != null && { resolvedAt: row.resolvedAt }),
    ...(row.createdBy      != null && { createdBy: row.createdBy }),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const InspectionModel = {
  /**
   * Return a paginated list of inspections matching the given filters.
   *
   * The WHERE clause is built dynamically — only filters that are actually
   * provided are added, so an empty body returns all records.
   * A separate COUNT query runs first so the frontend knows the total pages.
   */
  async findAll(filters: ListFilters) {
    const { search, severity, status, dateFrom, dateTo, page, limit, sortBy, sortOrder } = filters;

    const conditions: string[] = [];
    const args: (string | number)[] = [];

    if (search) {
      // Wrap search term in % wildcards for a contains match across three columns
      const term = `%${search}%`;
      conditions.push("(machineLineId LIKE ? OR remarks LIKE ? OR defectType LIKE ?)");
      args.push(term, term, term);
    }
    if (severity) { conditions.push("severity = ?"); args.push(severity); }
    if (status)   { conditions.push("status = ?");   args.push(status); }
    if (dateFrom) { conditions.push("date >= ?");     args.push(dateFrom); }
    if (dateTo)   { conditions.push("date <= ?");     args.push(dateTo); }

    const where  = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const col    = SORT_COLS[sortBy] ?? "createdAt"; // fallback guards against unknown sortBy
    const order  = `ORDER BY ${col} ${sortOrder === "asc" ? "ASC" : "DESC"}`;
    const offset = (page - 1) * limit;

    // Run count query first so frontend can calculate total pages
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM inspections ${where}`,
      args,
    });
    const total = Number(countResult.rows[0].count);

    const listResult = await db.execute({
      sql:  `SELECT * FROM inspections ${where} ${order} LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    });

    return {
      total,
      page,
      limit,
      inspections: (listResult.rows as unknown as DbRow[]).map(toInspection),
    };
  },

  /** Fetch a single inspection by id, or null if it does not exist */
  async findById(id: string | number): Promise<Inspection | null> {
    const result = await db.execute({
      sql:  "SELECT * FROM inspections WHERE id = ?",
      args: [id],
    });
    return result.rows.length > 0
      ? toInspection(result.rows[0] as unknown as DbRow)
      : null;
  },

  /**
   * Insert a new inspection with status defaulting to 'Open'.
   * Fetches and returns the full row after insert so the response
   * includes auto-generated fields (id, createdAt, updatedAt).
   */
  async create(data: CreateData): Promise<Inspection> {
    const now = new Date().toISOString();
    const result = await db.execute({
      sql: `INSERT INTO inspections
              (date, machineLineId, defectType, severity, status, remarks, createdBy, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 'Open', ?, ?, ?, ?)`,
      args: [data.date, data.machineLineId, data.defectType, data.severity,
             data.remarks ?? null, data.createdBy, now, now],
    });

    const fetched = await db.execute({
      sql:  "SELECT * FROM inspections WHERE id = ?",
      args: [Number(result.lastInsertRowid)],
    });
    return toInspection(fetched.rows[0] as unknown as DbRow);
  },

  /**
   * Mark an inspection as Resolved and record the resolution note + timestamp.
   * Returns null if the inspection id does not exist (caller sends 404).
   */
  async resolve(id: string | number, resolutionNote: string): Promise<Inspection | null> {
    const existing = await db.execute({
      sql:  "SELECT id FROM inspections WHERE id = ?",
      args: [id],
    });
    if (existing.rows.length === 0) return null;

    const now = new Date().toISOString();
    await db.execute({
      sql:  `UPDATE inspections
             SET status = 'Resolved', resolutionNote = ?, resolvedAt = ?, updatedAt = ?
             WHERE id = ?`,
      args: [resolutionNote, now, now, id],
    });

    const updated = await db.execute({
      sql:  "SELECT * FROM inspections WHERE id = ?",
      args: [id],
    });
    return toInspection(updated.rows[0] as unknown as DbRow);
  },
};
