"use client";

import { useState } from "react";
import { useGlobeViewers } from "@/lib/globeMap";
import type { GlobeViewer } from "@/lib/globeMap";
import LiveGlobe from "@/components/LiveGlobe";
import { AVATAR_BG_CLASS } from "@/lib/avatarColors";

export default function LiveMapSection() {
  const viewers = useGlobeViewers();
  const [selected, setSelected] = useState<GlobeViewer | null>(null);

  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 pb-20 text-center">
      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-300">
        🟢 {viewers.length} {viewers.length === 1 ? "explorer" : "explorers"} online right now
      </span>
      <h2 className="text-2xl font-bold sm:text-3xl">Watch the world, live.</h2>
      <p className="max-w-xl text-slate-400">
        Players who opt in show up here in real time, wherever they are — no replay, no
        simulation, just whoever&apos;s actually online right now. Click a light to see who it is.
      </p>
      <LiveGlobe viewers={viewers} onSelect={setSelected} />
      {selected ? (
        <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-3">
          <span className={`h-8 w-8 shrink-0 rounded-full ${AVATAR_BG_CLASS[selected.color]}`} />
          <div className="text-left">
            <div className="text-sm font-semibold">{selected.name}</div>
            <div className="text-xs text-slate-500">exploring from near {selected.city}</div>
          </div>
          <button
            onClick={() => setSelected(null)}
            aria-label="Close"
            className="ml-2 text-slate-500 hover:text-slate-300"
          >
            ✕
          </button>
        </div>
      ) : (
        viewers.length === 0 && (
          <p className="text-xs text-slate-500">
            Nobody&apos;s opted in yet — sign up and share your location to be the first pin on the map.
          </p>
        )
      )}
    </section>
  );
}
