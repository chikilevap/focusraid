import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "./lib/api";
import { getTelegramProfile, initTelegram } from "./lib/telegram";
import { Participant, Session, SessionResults, Team, User } from "./lib/types";
import { HomePage } from "./pages/HomePage";
import { TeamPage } from "./pages/TeamPage";
import { ActiveSessionPage } from "./pages/ActiveSessionPage";
import { ResultsPage } from "./pages/ResultsPage";
import { useRaidSocket } from "./hooks/useRaidSocket";

type Screen = "home" | "team" | "active" | "results";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [me, setMe] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [error, setError] = useState("");

  const loadTeam = useCallback(
    async (teamId: number) => {
      if (!me) return;
      const data = await api<{ team: Team; members: User[] }>(`/team/${teamId}`);
      setTeam(data.team);
      setMembers(data.members);
      setScreen("team");

      const active = await api<{ session: Session | null; participants: Participant[] }>(`/session/active/${teamId}`);
      setActiveSession(active.session);
      setParticipants(active.participants || []);
      if (active.session) {
        const alreadyJoined = (active.participants || []).some((p) => p.user_id === me.id);
        if (!alreadyJoined) {
          await api<{ success: true }>("/session/join", {
            method: "POST",
            body: JSON.stringify({ sessionId: active.session.id, userId: me.id })
          });
          const refreshed = await api<{ session: Session | null; participants: Participant[] }>(`/session/active/${teamId}`);
          setParticipants(refreshed.participants || []);
        }
        setScreen("active");
      }
    },
    [me]
  );

  const bootstrap = useCallback(async () => {
    initTelegram();
    const profile = getTelegramProfile();
    const auth = await api<{ user: User }>("/auth", {
      method: "POST",
      body: JSON.stringify(profile)
    });
    setMe(auth.user);
  }, []);

  useEffect(() => {
    bootstrap().catch((e) => setError((e as Error).message));
  }, [bootstrap]);

  useRaidSocket(
    team?.id || null,
    useCallback(
      async (event) => {
        if (!team?.id) return;
        if (event.type === "participant_joined" || event.type === "participant_left") {
          const data = await api<{ session: Session | null; participants: Participant[] }>(`/session/active/${team.id}`);
          setActiveSession(data.session);
          let nextParticipants = data.participants || [];
          if (data.session && me && !nextParticipants.some((p) => p.user_id === me.id)) {
            await api<{ success: true }>("/session/join", {
              method: "POST",
              body: JSON.stringify({ sessionId: data.session.id, userId: me.id })
            });
            const refreshed = await api<{ session: Session | null; participants: Participant[] }>(`/session/active/${team.id}`);
            nextParticipants = refreshed.participants || [];
          }
          setParticipants(nextParticipants);
          if (data.session) setScreen("active");
        }
        if (event.type === "session_ended" && activeSession?.id) {
          const response = await api<SessionResults>("/session/complete", {
            method: "POST",
            body: JSON.stringify({ sessionId: activeSession.id })
          });
          setResults(response);
          setActiveSession(null);
          setScreen("results");
        }
      },
      [team?.id, activeSession?.id, me]
    )
  );

  useEffect(() => {
    if (!activeSession) return;
    const timer = setInterval(async () => {
      if (Date.now() >= new Date(activeSession.end_time).getTime()) {
        const response = await api<SessionResults>("/session/complete", {
          method: "POST",
          body: JSON.stringify({ sessionId: activeSession.id })
        });
        setResults(response);
        setActiveSession(null);
        setScreen("results");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession]);

  const createTeam = async (name: string) => {
    if (!me) return;
    const data = await api<{ team: Team }>("/team/create", {
      method: "POST",
      body: JSON.stringify({ name, userId: me.id })
    });
    await loadTeam(data.team.id);
  };

  const joinTeam = async (teamId: number) => {
    if (!me) return;
    await api<{ success: true }>("/team/join", {
      method: "POST",
      body: JSON.stringify({ teamId, userId: me.id })
    });
    await loadTeam(teamId);
  };

  const startRaid = async () => {
    if (!team || !me) return;
    const started = await api<{ session: Session }>("/session/start", {
      method: "POST",
      body: JSON.stringify({ teamId: team.id })
    });
    await api<{ success: true }>("/session/join", {
      method: "POST",
      body: JSON.stringify({ sessionId: started.session.id, userId: me.id })
    });
    setActiveSession(started.session);
    const data = await api<{ session: Session | null; participants: Participant[] }>(`/session/active/${team.id}`);
    setParticipants(data.participants || []);
    setScreen("active");
  };

  const leaveRaid = async () => {
    if (!activeSession || !me) return;
    await api<{ success: true }>("/session/leave", {
      method: "POST",
      body: JSON.stringify({ sessionId: activeSession.id, userId: me.id })
    });
  };

  const content = useMemo(() => {
    if (!me) return <p className="text-center text-slate-400">Authenticating via Telegram...</p>;
    if (screen === "home") {
      return <HomePage currentTeam={team} onCreateTeam={createTeam} onJoinTeam={joinTeam} />;
    }
    if (screen === "team" && team) {
      return <TeamPage team={team} members={members} activeSession={activeSession} onStartRaid={startRaid} />;
    }
    if (screen === "active" && activeSession) {
      return <ActiveSessionPage session={activeSession} participants={participants} onLeaveRaid={leaveRaid} />;
    }
    if (screen === "results" && results) {
      return (
        <ResultsPage
          score={results.score}
          participants={results.participants}
          onBackHome={() => setScreen(team ? "team" : "home")}
        />
      );
    }
    return <p className="text-center text-slate-400">Loading...</p>;
  }, [me, screen, team, createTeam, joinTeam, members, activeSession, startRaid, participants, leaveRaid, results]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-xl bg-slate-950 p-4">
      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">
        Logged in as: <span className="font-semibold text-white">{me?.username || "..."}</span>
      </div>
      {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}
      {content}
    </main>
  );
}
