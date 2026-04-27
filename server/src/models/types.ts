export type User = {
  id: number;
  telegram_id: string;
  username: string;
  created_at: string;
};

export type Team = {
  id: number;
  name: string;
  created_at: string;
};

export type Session = {
  id: number;
  team_id: number;
  start_time: string;
  end_time: string;
  status: "active" | "completed";
};

export type SessionParticipant = {
  id: number;
  session_id: number;
  user_id: number;
  joined_at: string;
  left_at: string | null;
  completed: number;
};
