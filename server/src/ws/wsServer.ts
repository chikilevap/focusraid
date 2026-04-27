import { WebSocketServer, WebSocket } from "ws";

type ClientMeta = {
  teamId: number;
};

export type SessionEvent =
  | {
      type: "participant_joined";
      payload: {
        sessionId: number;
        userId: number;
        username: string;
        joinedAt: string;
      };
    }
  | {
      type: "participant_left";
      payload: {
        sessionId: number;
        userId: number;
        leftAt: string;
      };
    }
  | {
      type: "session_ended";
      payload: {
        sessionId: number;
      };
    };

export class FocusRaidWSServer {
  private wss: WebSocketServer;
  private clients = new Map<WebSocket, ClientMeta>();

  constructor(server: import("http").Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket, req) => {
      const url = new URL(req.url || "", "http://localhost");
      const teamId = Number(url.searchParams.get("teamId"));
      if (!teamId) {
        socket.close();
        return;
      }

      this.clients.set(socket, { teamId });
      socket.on("close", () => {
        this.clients.delete(socket);
      });
    });
  }

  broadcastToTeam(teamId: number, event: SessionEvent) {
    const data = JSON.stringify(event);
    for (const [socket, meta] of this.clients.entries()) {
      if (meta.teamId === teamId && socket.readyState === WebSocket.OPEN) {
        socket.send(data);
      }
    }
  }
}
