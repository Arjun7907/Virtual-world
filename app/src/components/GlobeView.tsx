"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useGlobeViewers, type GlobeViewer } from "@/lib/globeMap";
import LiveGlobe from "@/components/LiveGlobe";
import { AVATAR_BG_CLASS } from "@/lib/avatarColors";
import StoreProvider from "@/components/StoreProvider";
import GlobePresence from "@/components/GlobePresence";
import type { VirtualWorldInit } from "@/lib/store";

function GlobeChrome({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();
  const viewers = useGlobeViewers();
  const [selected, setSelected] = useState<GlobeViewer | null>(null);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="fixed inset-0">
      <LiveGlobe viewers={viewers} onSelect={setSelected} className="absolute inset-0" />

      <div className="pointer-events-none fixed top-7 left-7 z-10">
        <h1 className="text-xl font-semibold italic tracking-tight">live</h1>
        <p className="mt-1 font-mono text-xs text-slate-500">
          <span className="text-amber-400">{String(viewers.length).padStart(2, "0")}</span> lights on right now
        </p>
      </div>

      {signedIn ? (
        <button
          onClick={signOut}
          className="fixed top-7 right-7 z-10 font-mono text-xs text-slate-500 hover:text-slate-300"
        >
          sign out
        </button>
      ) : (
        <div className="fixed top-7 right-7 z-10 flex items-center gap-4 font-mono text-xs text-slate-500">
          <Link href="/login" className="hover:text-slate-300">
            log in
          </Link>
          <Link href="/signup" className="hover:text-slate-300">
            sign up
          </Link>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-6 left-1/2 z-10 -translate-x-1/2 text-center font-mono text-xs text-slate-500">
        {signedIn ? "click a light to say hi" : "sign up to show up as a light yourself"}
      </div>

      <aside
        className={`fixed top-0 right-0 z-20 h-full w-80 max-w-[85vw] border-l border-slate-800 bg-slate-950/90 p-7 backdrop-blur transition-transform duration-300 ${
          selected ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {selected && (
          <>
            <button
              onClick={() => setSelected(null)}
              className="mb-6 font-mono text-sm text-slate-400 hover:text-slate-200"
            >
              ← back to the globe
            </button>
            <span
              className={`mb-4 block h-16 w-16 rounded-full border-2 border-slate-700 ${AVATAR_BG_CLASS[selected.color]}`}
            />
            <h2 className="mb-1 text-2xl font-medium">{selected.name}</h2>
            <p className="mb-5 font-mono text-xs tracking-wide text-amber-400 uppercase">
              exploring near {selected.city}
            </p>
            <p className="mb-7 text-sm leading-relaxed text-slate-400">
              Online right now, somewhere near {selected.city}. That&apos;s all we share — just the city, never
              the exact spot.
            </p>
          </>
        )}
      </aside>
    </div>
  );
}

export default function GlobeView({ identity }: { identity: VirtualWorldInit | null }) {
  if (!identity) return <GlobeChrome signedIn={false} />;

  return (
    <StoreProvider init={identity}>
      <GlobePresence />
      <GlobeChrome signedIn />
    </StoreProvider>
  );
}
