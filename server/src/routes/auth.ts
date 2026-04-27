import { Router } from "express";
import { db } from "../db";
import { validateTelegramInitData } from "../services/telegramAuth";

export const authRouter = Router();

authRouter.post("/", (req, res) => {
  const { initData, telegramId, username } = req.body as {
    initData: string;
    telegramId: string;
    username: string;
  };

  if (!telegramId || !username) {
    return res.status(400).json({ error: "telegramId and username are required" });
  }

  if (initData && !validateTelegramInitData(initData)) {
    return res.status(401).json({ error: "Invalid Telegram initData" });
  }

  const existing = db
    .prepare(`SELECT * FROM Users WHERE telegram_id = ?`)
    .get(telegramId) as { id: number; telegram_id: string; username: string } | undefined;

  if (existing) {
    if (existing.username !== username) {
      db.prepare(`UPDATE Users SET username = ? WHERE id = ?`).run(username, existing.id);
    }
    return res.json({ user: { ...existing, username } });
  }

  const result = db
    .prepare(`INSERT INTO Users (telegram_id, username) VALUES (?, ?)`)
    .run(telegramId, username);
  const user = db
    .prepare(`SELECT * FROM Users WHERE id = ?`)
    .get(Number(result.lastInsertRowid));

  return res.json({ user });
});
