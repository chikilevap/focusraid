import { Card } from "../components/Card";

type ResultParticipant = {
  user_id: number;
  username: string;
  completed: number;
  left_at: string | null;
};

type Props = {
  score: number;
  participants: ResultParticipant[];
  onBackHome: () => void;
};

export const ResultsPage = ({ score, participants, onBackHome }: Props) => {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-center text-2xl font-bold text-white">Raid Results</h2>
        <p className="mt-2 text-center text-4xl font-bold text-brand-500">Team Score: {score}</p>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-white">Completion</h3>
        <div className="mt-3 space-y-2">
          {participants.map((p) => (
            <div key={p.user_id} className="flex items-center justify-between rounded-lg bg-slate-800 p-2">
              <span className="text-white">{p.username}</span>
              <span className={p.completed ? "text-emerald-400" : "text-rose-400"}>
                {p.completed ? "completed" : "failed"}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <button onClick={onBackHome} className="w-full rounded-xl bg-slate-700 px-4 py-3 text-lg font-semibold text-white">
        Back to Team
      </button>
    </div>
  );
};
