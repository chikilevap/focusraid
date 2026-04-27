import { useEffect } from "react";
import { wsUrl } from "../lib/api";

type EventMessage =
  | { type: "participant_joined"; payload: { userId: number } }
  | { type: "participant_left"; payload: { userId: number } }
  | { type: "session_ended"; payload: { sessionId: number } };

export const useRaidSocket = (teamId: number | null, onEvent: (event: EventMessage) => void) => {
  useEffect(() => {
    if (!teamId) return;
    const socket = new WebSocket(wsUrl(teamId));

    socket.onmessage = (ev) => {
      const parsed = JSON.parse(ev.data) as EventMessage;
      onEvent(parsed);
    };

    return () => {
      socket.close();
    };
  }, [teamId, onEvent]);
};
