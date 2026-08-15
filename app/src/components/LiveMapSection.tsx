"use client";

import { useGlobeViewers } from "@/lib/globeMap";
import LiveGlobe from "@/components/LiveGlobe";

export default function LiveMapSection() {
  const viewers = useGlobeViewers();

  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 pb-20 text-center">
      <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-1 text-sm text-emerald-300">
        🟢 {viewers.length} {viewers.length === 1 ? "explorer" : "explorers"} online right now
      </span>
      <h2 className="text-2xl font-bold sm:text-3xl">Watch the world, live.</h2>
      <p className="max-w-xl text-slate-400">
        Players who opt in show up here in real time, wherever they are — no replay, no
        simulation, just whoever&apos;s actually online right now.
      </p>
      <LiveGlobe viewers={viewers} />
      {viewers.length === 0 && (
        <p className="text-xs text-slate-500">
          Nobody&apos;s opted in yet — sign up and share your location to be the first pin on the map.
        </p>
      )}
    </section>
  );
}
