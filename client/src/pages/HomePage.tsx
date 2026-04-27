import { useState } from "react";
import { Card } from "../components/Card";
import { Team } from "../lib/types";

type Props = {
  currentTeam: Team | null;
  onCreateTeam: (name: string) => Promise<void>;
  onJoinTeam: (teamId: number) => Promise<void>;
};

export const HomePage = ({ currentTeam, onCreateTeam, onJoinTeam }: Props) => {
  const [createName, setCreateName] = useState("");
  const [joinId, setJoinId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    setError("");
    setLoading(true);
    try {
      await onCreateTeam(createName.trim());
      setCreateName("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const join = async () => {
    setError("");
    setLoading(true);
    try {
      await onJoinTeam(Number(joinId));
      setJoinId("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-2xl font-bold text-white">FocusRaid</h1>
        <p className="mt-2 text-sm text-slate-300">Team-based 25 minute focus sessions with social pressure.</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Current Team</h2>
        <p className="mt-2 text-slate-300">{currentTeam ? `${currentTeam.name} (ID: ${currentTeam.id})` : "No team yet"}</p>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Create Team</h2>
        <input
          value={createName}
          onChange={(e) => setCreateName(e.target.value)}
          placeholder="Team name"
          className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white"
        />
        <button
          onClick={create}
          disabled={loading || !createName.trim()}
          className="mt-3 w-full rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Create Team
        </button>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-white">Join Team</h2>
        <input
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          placeholder="Team ID"
          className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white"
        />
        <button
          onClick={join}
          disabled={loading || !joinId.trim()}
          className="mt-3 w-full rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Join Team
        </button>
      </Card>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
};
