"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useVirtualWorldStore } from "@/lib/store";
import { usePresence } from "@/lib/presence";

const PhaserGame = dynamic(() => import("@/components/PhaserGame"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] w-[800px] max-w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-500">
      Loading world…
    </div>
  ),
});

export default function WorldHubPage() {
  const router = useRouter();
  const avatarColor = useVirtualWorldStore((s) => s.avatarColor);
  const avatarName = useVirtualWorldStore((s) => s.avatarName);
  const { others, updatePosition } = usePresence("hub");

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">Welcome back, {avatarName} 👋</h1>
        <p className="mt-1 text-slate-400">
          {others.length > 0
            ? `${others.length} other ${others.length === 1 ? "explorer is" : "explorers are"} walking around right now.`
            : "Walk into a building to jump into that activity."}
        </p>
      </div>
      <PhaserGame
        avatarColor={avatarColor}
        avatarName={avatarName}
        onEnterZone={(href) => router.push(href)}
        otherPlayers={others}
        onPositionChange={updatePosition}
      />
    </div>
  );
}
