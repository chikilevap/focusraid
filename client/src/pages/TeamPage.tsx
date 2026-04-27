import { Card } from "../components/Card";
import { Session, Team, User } from "../lib/types";

type Props = {
  team: Team;
  members: User[];
  activeSession: Session | null;
  onStartRaid: () => Promise<void>;
};

export const TeamPage = ({ team, members, activeSession, onStartRaid }: Props) => {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-bold text-white">{team.name}</h2>
        <p className="mt-1 text-slate-300">Team ID: {team.id}</p>
        <p className="mt-1 text-slate-300">Members: {members.length}/5</p>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-white">Members</h3>
        <ul className="mt-3 space-y-2">
          {members.map((m) => (
            <li key={m.id} className="rounded-lg bg-slate-800 p-2 text-slate-100">
              {m.username}
            </li>
          ))}
        </ul>
      </Card>

      <button
        onClick={onStartRaid}
        disabled={!!activeSession}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 text-lg font-semibold text-white disabled:bg-slate-700"
      >
        {activeSession ? "Raid Already Active" : "Start Raid"}
      </button>
    </div>
  );
};
