import { Card } from "../components/Card";
import { CountdownTimer } from "../components/CountdownTimer";
import { Participant, Session } from "../lib/types";

type Props = {
  session: Session;
  participants: Participant[];
  onLeaveRaid: () => Promise<void>;
};

export const ActiveSessionPage = ({ session, participants, onLeaveRaid }: Props) => {
  const leave = async () => {
    const ok = window.confirm("Leaving early will penalize your team. Continue?");
    if (!ok) return;
    await onLeaveRaid();
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-center text-xl font-semibold text-white">Focus Raid Active</h2>
        <div className="mt-4">
          <CountdownTimer endTime={session.end_time} />
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-white">Participants</h3>
        <div className="mt-3 space-y-2">
          {participants.map((p) => (
            <div key={p.user_id} className="flex items-center justify-between rounded-lg bg-slate-800 p-2">
              <span className="text-white">{p.username}</span>
              <span className={p.left_at ? "text-rose-400" : "text-emerald-400"}>{p.left_at ? "left early" : "active"}</span>
            </div>
          ))}
        </div>
      </Card>

      <button onClick={leave} className="w-full rounded-xl bg-rose-600 px-4 py-3 text-lg font-semibold text-white">
        Leave Raid
      </button>
    </div>
  );
};
