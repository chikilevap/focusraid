import { PropsWithChildren } from "react";

export const Card = ({ children }: PropsWithChildren) => {
  return <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">{children}</div>;
};
