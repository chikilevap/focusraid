import { Router } from "express";
import { db } from "../db";
import { FocusRaidWSServer } from "../ws/wsServer";
import { completeSession, createSession, getActiveSessionByTeam, scoreSession } from "../services/sessionService";

export const createSessionRouter = (ws: FocusRaidWSServer) => {
  const sessionRouter = Router();

  sessionRouter.post("/start", (req, res) => {
    const { teamId } = req.body as { teamId: number };
    if (!teamId) {
      return res.status(400).json({ error: "teamId is required" });
    }

    const active = getActiveSessionByTeam(teamId);
    if (active) {
      return res.status(400).json({ error: "Active session already exists", session: active });
    }
    const count = db.prepare(`SELECT COUNT(*) as total FROM TeamMembers WHERE team_id = ?`).get(teamId) as { total: number };
    if (count.total < 3) {
      return res.status(400).json({ error: "Need at least 3 team members to start a raid" });
    }

    const sessionId = createSession(teamId);
    const session = db.prepare(`SELECT * FROM Sessions WHERE id = ?`).get(sessionId);
    return res.json({ session });
  });

  sessionRouter.post("/join", (req, res) => {
    const { sessionId, userId } = req.body as { sessionId: number; userId: number };
    if (!sessionId || !userId) {
      return res.status(400).json({ error: "sessionId and userId are required" });
    }

    const session = db.prepare(`SELECT * FROM Sessions WHERE id = ?`).get(sessionId) as
      | { id: number; team_id: number; status: "active" | "completed" }
      | undefined;
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.status !== "active") {
      return res.status(400).json({ error: "Session is not active" });
    }

    const joinedAt = new Date().toISOString();
    db.prepare(
      `INSERT OR REPLACE INTO SessionParticipants
       (session_id, user_id, joined_at, left_at, completed)
       VALUES (?, ?, ?, NULL, 0)`
    ).run(sessionId, userId, joinedAt);

    const user = db.prepare(`SELECT username FROM Users WHERE id = ?`).get(userId) as { username: string };
    ws.broadcastToTeam(session.team_id, {
      type: "participant_joined",
      payload: { sessionId, userId, username: user?.username || "unknown", joinedAt }
    });

    return res.json({ success: true });
  });

  sessionRouter.post("/leave", (req, res) => {
    const { sessionId, userId } = req.body as { sessionId: number; userId: number };
    if (!sessionId || !userId) {
      return res.status(400).json({ error: "sessionId and userId are required" });
    }

    const session = db.prepare(`SELECT * FROM Sessions WHERE id = ?`).get(sessionId) as
      | { id: number; team_id: number; status: "active" | "completed" }
      | undefined;
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    if (session.status === "completed" && !userId) {
      const score = scoreSession(sessionId);
      const participants = db
        .prepare(
          `SELECT u.id as user_id, u.username, sp.completed, sp.left_at
           FROM SessionParticipants sp
           JOIN Users u ON sp.user_id = u.id
           WHERE sp.session_id = ?`
        )
        .all(sessionId);
      return res.json({ success: true, score, participants });
    }

    const leftAt = new Date().toISOString();
    db.prepare(`UPDATE SessionParticipants SET left_at = ?, completed = 0 WHERE session_id = ? AND user_id = ?`).run(
      leftAt,
      sessionId,
      userId
    );

    ws.broadcastToTeam(session.team_id, {
      type: "participant_left",
      payload: { sessionId, userId, leftAt }
    });

    return res.json({ success: true });
  });

  sessionRouter.post("/complete", (req, res) => {
    const { sessionId, userId } = req.body as { sessionId: number; userId?: number };
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const session = db.prepare(`SELECT * FROM Sessions WHERE id = ?`).get(sessionId) as
      | { id: number; team_id: number; status: "active" | "completed"; end_time: string }
      | undefined;
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const now = new Date();
    if (userId) {
      const isCompleted = now >= new Date(session.end_time);
      db.prepare(
        `UPDATE SessionParticipants
         SET completed = ?, left_at = CASE WHEN ? THEN left_at ELSE ? END
         WHERE session_id = ? AND user_id = ?`
      ).run(isCompleted ? 1 : 0, isCompleted ? 1 : 0, now.toISOString(), sessionId, userId);
      return res.json({ success: true, completed: isCompleted });
    }

    const ended = now >= new Date(session.end_time);
    if (!ended) {
      return res.status(400).json({ error: "Session has not ended yet" });
    }

    const rows = db
      .prepare(`SELECT user_id, left_at FROM SessionParticipants WHERE session_id = ?`)
      .all(sessionId) as Array<{ user_id: number; left_at: string | null }>;
    const update = db.prepare(`UPDATE SessionParticipants SET completed = ? WHERE session_id = ? AND user_id = ?`);
    for (const row of rows) {
      update.run(row.left_at ? 0 : 1, sessionId, row.user_id);
    }

    completeSession(sessionId);
    const score = scoreSession(sessionId);
    const participants = db
      .prepare(
        `SELECT u.id as user_id, u.username, sp.completed, sp.left_at
         FROM SessionParticipants sp
         JOIN Users u ON sp.user_id = u.id
         WHERE sp.session_id = ?`
      )
      .all(sessionId);

    ws.broadcastToTeam(session.team_id, {
      type: "session_ended",
      payload: { sessionId }
    });

    return res.json({ success: true, score, participants });
  });

  sessionRouter.get("/active/:teamId", (req, res) => {
    const teamId = Number(req.params.teamId);
    const session = getActiveSessionByTeam(teamId);
    if (!session) {
      return res.json({ session: null });
    }

    const participants = db
      .prepare(
        `SELECT u.id as user_id, u.username, sp.joined_at, sp.left_at, sp.completed
         FROM SessionParticipants sp
         JOIN Users u ON sp.user_id = u.id
         WHERE sp.session_id = ?`
      )
      .all(session.id);

    return res.json({ session, participants });
  });

  return sessionRouter;
};
