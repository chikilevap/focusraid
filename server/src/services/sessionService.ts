import { db } from "../db";

const RAID_DURATION_MINUTES = 25;

export const createSession = (teamId: number) => {
  const now = new Date();
  const end = new Date(now.getTime() + RAID_DURATION_MINUTES * 60_000);

  const stmt = db.prepare(`
    INSERT INTO Sessions (team_id, start_time, end_time, status)
    VALUES (?, ?, ?, 'active')
  `);
  const result = stmt.run(teamId, now.toISOString(), end.toISOString());
  return Number(result.lastInsertRowid);
};

export const getActiveSessionByTeam = (teamId: number) => {
  return db
    .prepare(
      `SELECT * FROM Sessions WHERE team_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`
    )
    .get(teamId) as
    | {
        id: number;
        team_id: number;
        start_time: string;
        end_time: string;
        status: "active";
      }
    | undefined;
};

export const completeSession = (sessionId: number) => {
  db.prepare(`UPDATE Sessions SET status = 'completed' WHERE id = ?`).run(sessionId);
};

export const scoreSession = (sessionId: number) => {
  const participants = db
    .prepare(`SELECT completed FROM SessionParticipants WHERE session_id = ?`)
    .all(sessionId) as Array<{ completed: number }>;

  let score = 0;
  for (const p of participants) {
    score += p.completed ? 10 : -5;
  }
  return score;
};
