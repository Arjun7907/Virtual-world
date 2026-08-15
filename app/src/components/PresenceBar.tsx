"use client";

import { usePresence } from "@/lib/presence";
import { AVATAR_BG_CLASS } from "@/lib/avatarColors";

export default function PresenceBar({ room, activity }: { room: string; activity: string }) {
  const { others } = usePresence(room);
  const count = others.length + 1;

  return (
    <div className="mb-2 flex w-fit items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-300">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span>
        {count} {count === 1 ? "person" : "people"} {activity} right now
      </span>
      {others.length > 0 && (
        <div className="flex -space-x-2">
          {others.slice(0, 6).map((p) => (
            <div
              key={p.userId}
              className={`h-6 w-6 rounded-full ${AVATAR_BG_CLASS[p.color]} border-2 border-slate-950`}
              title={p.name}
            />
          ))}
          {others.length > 6 && (
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-800 text-[10px] text-slate-300">
              +{others.length - 6}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
