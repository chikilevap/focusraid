import { Router } from "express";
import { db } from "../db";

export const teamRouter = Router();

teamRouter.post("/create", (req, res) => {
  const { name, userId } = req.body as { name: string; userId: number };
  if (!name || !userId) {
    return res.status(400).json({ error: "name and userId are required" });
  }

  const teamResult = db.prepare(`INSERT INTO Teams (name) VALUES (?)`).run(name);
  const teamId = Number(teamResult.lastInsertRowid);
  db.prepare(`INSERT INTO TeamMembers (user_id, team_id) VALUES (?, ?)`).run(userId, teamId);

  const team = db.prepare(`SELECT * FROM Teams WHERE id = ?`).get(teamId);
  return res.json({ team });
});

teamRouter.post("/join", (req, res) => {
  const { teamId, userId } = req.body as { teamId: number; userId: number };
  if (!teamId || !userId) {
    return res.status(400).json({ error: "teamId and userId are required" });
  }

  const team = db.prepare(`SELECT * FROM Teams WHERE id = ?`).get(teamId);
  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }

  const count = db
    .prepare(`SELECT COUNT(*) as total FROM TeamMembers WHERE team_id = ?`)
    .get(teamId) as { total: number };
  if (count.total >= 5) {
    return res.status(400).json({ error: "Team is full (max 5 members)" });
  }

  db.prepare(`INSERT OR IGNORE INTO TeamMembers (user_id, team_id) VALUES (?, ?)`).run(userId, teamId);
  return res.json({ success: true });
});

teamRouter.get("/:id", (req, res) => {
  const teamId = Number(req.params.id);
  const team = db.prepare(`SELECT * FROM Teams WHERE id = ?`).get(teamId);
  if (!team) {
    return res.status(404).json({ error: "Team not found" });
  }

  const members = db
    .prepare(
      `SELECT u.id, u.telegram_id, u.username, u.created_at
       FROM TeamMembers tm
       JOIN Users u ON tm.user_id = u.id
       WHERE tm.team_id = ?`
    )
    .all(teamId);

  return res.json({ team, members });
});
