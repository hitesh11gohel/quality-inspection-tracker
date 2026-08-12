/**
 * Database seeder.
 *
 * On every server startup this function runs two independent checks:
 *
 *  1. Users table empty   → create the demo supervisor account.
 *  2. Inspections table empty → insert 25 sample inspection records so that
 *     reviewers and first-time logins immediately see realistic data with
 *     enough records to exercise pagination and filtering.
 *
 * Each check is independent so re-seeding inspections works even if the user
 * was already created in a previous boot.
 *
 * Demo credentials → username: supervisor  password: password123
 */

import bcrypt from "bcryptjs";
import { db } from "./database";

// ── Sample data ───────────────────────────────────────────────────────────────

type SampleRecord = {
  date: string;
  machineLineId: string;
  defectType: string;
  severity: string;
  status: string;
  remarks: string | null;
  resolutionNote: string | null;
  resolvedAt: string | null;
  createdAt: string;
};

const SAMPLES: SampleRecord[] = [
  {
    date: "2026-08-10",
    machineLineId: "Rapier Loom RL-2041 (Bay 4)",
    defectType: "Weave Defect",
    severity: "Critical",
    status: "Open",
    remarks:
      "Warp threads missing across 40 cm central panel — production halted.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-08-10T07:42:00.000Z",
  },
  {
    date: "2026-08-08",
    machineLineId: "Dyeing Jigger Unit DJU-105B",
    defectType: "Shade Variation",
    severity: "Major",
    status: "Open",
    remarks: "Dye lot mismatch visible on roll ends — affects approx 3 m.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-08-08T09:15:00.000Z",
  },
  {
    date: "2026-07-28",
    machineLineId: "Finishing Stenter FS-312A",
    defectType: "Hole/Tear",
    severity: "Critical",
    status: "Resolved",
    remarks: "3 cm tear near selvedge — roll pulled from line immediately.",
    resolutionNote:
      "Tear isolated; roll trimmed and re-wound. Passed full QC after re-inspection. Root cause (reed wire) replaced.",
    resolvedAt: "2026-07-29T09:15:00.000Z",
    createdAt: "2026-07-28T11:20:00.000Z",
  },
  {
    date: "2026-08-05",
    machineLineId: "Warping Creel Section WCS-404",
    defectType: "Count Deviation",
    severity: "Minor",
    status: "Open",
    remarks: "Weft count measuring ±5 % off spec on last 2 rolls.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-08-05T08:00:00.000Z",
  },
  {
    date: "2026-07-20",
    machineLineId: "Dobby Loom DL-07C (Floor 2)",
    defectType: "Weave Defect",
    severity: "Major",
    status: "Resolved",
    remarks: "Float weave error across 4 m section — pattern distorted.",
    resolutionNote:
      "Float errors traced to dropped dobby peg. Peg replaced, section re-woven, and cleared by QC.",
    resolvedAt: "2026-07-22T14:30:00.000Z",
    createdAt: "2026-07-20T10:05:00.000Z",
  },
  {
    date: "2026-08-01",
    machineLineId: "Inspection Bay IB-306 (Grey)",
    defectType: "Other",
    severity: "Minor",
    status: "Open",
    remarks:
      "Slight oil stain near selvedge — recoverable with standard washing.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-08-01T13:45:00.000Z",
  },
  {
    date: "2026-07-25",
    machineLineId: "Continuous Dyeing Range CDR-Alpha",
    defectType: "Shade Variation",
    severity: "Critical",
    status: "Open",
    remarks:
      "Full roll shade difference exceeds 10 ΔE — entire batch on hold for QC review.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-07-25T08:30:00.000Z",
  },
  {
    date: "2026-07-15",
    machineLineId: "Spinning Frame SF-412 (Ring)",
    defectType: "Hole/Tear",
    severity: "Major",
    status: "Resolved",
    remarks:
      "Pin holes detected along fabric edge — approx 15 occurrences per metre.",
    resolutionNote:
      "Edge pins inspected and 4 bent pins replaced. Affected selvedge trimmed. Re-run passed quality check.",
    resolvedAt: "2026-07-17T11:00:00.000Z",
    createdAt: "2026-07-15T09:55:00.000Z",
  },
  {
    date: "2026-08-09",
    machineLineId: "Rapier Loom RL-2087 (Bay 7)",
    defectType: "Count Deviation",
    severity: "Critical",
    status: "Open",
    remarks:
      "Count deviation exceeds 8 % — stop-production alert issued. Awaiting loom engineer.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-08-09T07:10:00.000Z",
  },
  {
    date: "2026-07-30",
    machineLineId: "Warping Beam Section WBS-203",
    defectType: "Weave Defect",
    severity: "Minor",
    status: "Open",
    remarks: null,
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-07-30T14:20:00.000Z",
  },
  {
    date: "2026-08-07",
    machineLineId: "Production Line PL-Gamma (Shift B)",
    defectType: "Shade Variation",
    severity: "Major",
    status: "Open",
    remarks:
      "Shade drift evident mid-roll — approx 2 m band across full width.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-08-07T10:30:00.000Z",
  },
  {
    date: "2026-06-25",
    machineLineId: "Assembly & Folding Station AFS-08",
    defectType: "Hole/Tear",
    severity: "Minor",
    status: "Resolved",
    remarks: "Small pin holes — count below critical threshold.",
    resolutionNote:
      "Pin holes within acceptable tolerance. Batch released after secondary visual inspection and supervisor sign-off.",
    resolvedAt: "2026-06-26T10:00:00.000Z",
    createdAt: "2026-06-25T15:00:00.000Z",
  },
  {
    date: "2026-06-18",
    machineLineId: "Quality Gate & Bursting QGB-05",
    defectType: "Count Deviation",
    severity: "Major",
    status: "Resolved",
    remarks:
      "Warp count deviation measured at 6 % — flagged during in-process inspection.",
    resolutionNote:
      "Loom tension recalibrated. Count re-tested on three samples; all within spec. Production resumed.",
    resolvedAt: "2026-06-20T08:45:00.000Z",
    createdAt: "2026-06-18T11:10:00.000Z",
  },
  {
    date: "2026-08-11",
    machineLineId: "Rapier Loom RL-2041 (Bay 4)",
    defectType: "Other",
    severity: "Critical",
    status: "Open",
    remarks:
      "Mechanical fault caused lubricant contamination across 1.5 m section — quarantined.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-08-11T06:55:00.000Z",
  },
  {
    date: "2026-07-05",
    machineLineId: "Dyeing Jigger Unit DJU-105B",
    defectType: "Weave Defect",
    severity: "Minor",
    status: "Open",
    remarks:
      "Intermittent weave skip in 0.5 m section — pattern visible under raking light.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-07-05T09:00:00.000Z",
  },
  {
    date: "2026-07-12",
    machineLineId: "Finishing Stenter FS-312A",
    defectType: "Shade Variation",
    severity: "Major",
    status: "Open",
    remarks: "Beam change caused a visible shade band approximately 4 cm wide.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-07-12T10:20:00.000Z",
  },
  {
    date: "2026-06-10",
    machineLineId: "Warping Creel Section WCS-404",
    defectType: "Hole/Tear",
    severity: "Critical",
    status: "Resolved",
    remarks: "1.5 cm hole found mid-fabric — roll quarantined immediately.",
    resolutionNote:
      "Roll scrapped. Root cause identified as damaged reed; reed replaced and loom verified. New roll passes QC.",
    resolvedAt: "2026-06-12T16:00:00.000Z",
    createdAt: "2026-06-10T08:30:00.000Z",
  },
  {
    date: "2026-07-18",
    machineLineId: "Dobby Loom DL-07C (Floor 2)",
    defectType: "Count Deviation",
    severity: "Minor",
    status: "Open",
    remarks: null,
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-07-18T13:00:00.000Z",
  },
  {
    date: "2026-08-03",
    machineLineId: "Production Line PL-Gamma (Shift B)",
    defectType: "Weave Defect",
    severity: "Critical",
    status: "Open",
    remarks:
      "Multiple broken warp threads — pattern distortion visible across full width.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-08-03T07:50:00.000Z",
  },
  {
    date: "2026-06-05",
    machineLineId: "Assembly & Folding Station AFS-08",
    defectType: "Shade Variation",
    severity: "Minor",
    status: "Resolved",
    remarks: "Minor shade band near roll end — within marginal tolerance.",
    resolutionNote:
      "Shade band measured at 2.1 ΔE — within customer-agreed 3.0 ΔE tolerance. Released after supervisor sign-off.",
    resolvedAt: "2026-06-07T09:00:00.000Z",
    createdAt: "2026-06-05T14:40:00.000Z",
  },
  {
    date: "2026-07-22",
    machineLineId: "Inspection Bay IB-306 (Grey)",
    defectType: "Hole/Tear",
    severity: "Major",
    status: "Open",
    remarks:
      "Cut marks from roller nip on 3 consecutive rolls — possible roller damage.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-07-22T11:35:00.000Z",
  },
  {
    date: "2026-07-08",
    machineLineId: "Continuous Dyeing Range CDR-Alpha",
    defectType: "Count Deviation",
    severity: "Minor",
    status: "Open",
    remarks:
      "Weft count slightly elevated — flagged for monitoring on next roll.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-07-08T08:45:00.000Z",
  },
  {
    date: "2026-05-28",
    machineLineId: "Spinning Frame SF-412 (Ring)",
    defectType: "Weave Defect",
    severity: "Major",
    status: "Resolved",
    remarks: "Weft yarn break caused a drop-pattern defect across 1 m.",
    resolutionNote:
      "Yarn break repaired and knotted ends re-inserted. Pattern verified correct after restart. Cleared by QC.",
    resolvedAt: "2026-05-30T14:00:00.000Z",
    createdAt: "2026-05-28T09:20:00.000Z",
  },
  {
    date: "2026-08-06",
    machineLineId: "Rapier Loom RL-2087 (Bay 7)",
    defectType: "Shade Variation",
    severity: "Critical",
    status: "Open",
    remarks:
      "Entire batch shade off specification — batch held, QC review pending.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-08-06T08:05:00.000Z",
  },
  {
    date: "2026-07-15",
    machineLineId: "Warping Beam Section WBS-203",
    defectType: "Other",
    severity: "Major",
    status: "Open",
    remarks:
      "Foreign fibre contamination detected — source under investigation.",
    resolutionNote: null,
    resolvedAt: null,
    createdAt: "2026-07-15T12:00:00.000Z",
  },
];

// ── Seeder ────────────────────────────────────────────────────────────────────

export async function seedDemoUser(): Promise<void> {
  // 1. Seed the supervisor user if no users exist yet
  const userCount = Number(
    (await db.execute("SELECT COUNT(*) as count FROM users")).rows[0].count
  );

  if (userCount === 0) {
    const passwordHash = bcrypt.hashSync("password123", 10);
    await db.execute({
      sql: "INSERT INTO users (username, passwordHash, role) VALUES (?, ?, ?)",
      args: ["supervisor", passwordHash, "supervisor"],
    });
    console.log(
      "Demo user seeded → username: supervisor  password: password123"
    );
  }

  // 2. Seed 25 sample inspections if the table is empty
  const inspCount = Number(
    (await db.execute("SELECT COUNT(*) as count FROM inspections")).rows[0]
      .count
  );

  if (inspCount > 0) return;

  const userRow = await db.execute(
    "SELECT id FROM users WHERE username = 'supervisor' LIMIT 1"
  );
  const supervisorId = userRow.rows[0]?.id;
  if (!supervisorId) return;

  for (const r of SAMPLES) {
    const updatedAt = r.resolvedAt ?? r.createdAt;
    await db.execute({
      sql: `INSERT INTO inspections
              (date, machineLineId, defectType, severity, status, remarks,
               resolutionNote, resolvedAt, createdBy, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        r.date,
        r.machineLineId,
        r.defectType,
        r.severity,
        r.status,
        r.remarks,
        r.resolutionNote,
        r.resolvedAt,
        supervisorId,
        r.createdAt,
        updatedAt,
      ],
    });
  }

  console.log(`25 sample inspections seeded.`);
}
