import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "focusraid.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS Users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS Teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS TeamMembers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    UNIQUE(user_id, team_id),
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (team_id) REFERENCES Teams(id)
  );

  CREATE TABLE IF NOT EXISTS Sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('active','completed')),
    FOREIGN KEY (team_id) REFERENCES Teams(id)
  );

  CREATE TABLE IF NOT EXISTS SessionParticipants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at TEXT NOT NULL,
    left_at TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    UNIQUE(session_id, user_id),
    FOREIGN KEY (session_id) REFERENCES Sessions(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
  );
`);
