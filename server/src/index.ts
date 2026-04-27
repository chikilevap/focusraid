import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { createServer } from "http";
import { authRouter } from "./routes/auth";
import { teamRouter } from "./routes/team";
import { createSessionRouter } from "./routes/session";
import { FocusRaidWSServer } from "./ws/wsServer";
import "./db";

const app = express();
app.get("/health", (req, res) => {
  res.json({ ok: true });
});
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/team", teamRouter);

const httpServer = createServer(app);
const wsServer = new FocusRaidWSServer(httpServer);
app.use("/session", createSessionRouter(wsServer));

httpServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`FocusRaid server listening on http://localhost:${port}`);
});
