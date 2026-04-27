import { useEffect, useState } from "react";

type Props = {
  endTime: string;
};

export const CountdownTimer = ({ endTime }: Props) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remain = Math.max(0, new Date(endTime).getTime() - now);
  const minutes = Math.floor(remain / 60_000);
  const seconds = Math.floor((remain % 60_000) / 1000);
  const text = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return <div className="text-center text-6xl font-bold tracking-widest text-brand-500">{text}</div>;
};
