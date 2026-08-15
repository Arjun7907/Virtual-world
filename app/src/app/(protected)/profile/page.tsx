"use client";

import { useState } from "react";
import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";
import { AVATAR_COLORS, AVATAR_BG_CLASS, AVATAR_RING_CLASS } from "@/lib/avatarColors";
import type { AvatarColor } from "@/lib/store";

const CATEGORY_LABEL: Record<string, string> = {
  shop: "🛍️ Shop",
  kitchen: "🍳 Kitchen",
  arcade: "🕹️ Arcade",
};

export default function ProfilePage() {
  const user = useVirtualWorldStore((s) => s.user);
  const avatarColor = useVirtualWorldStore((s) => s.avatarColor);
  const avatarName = useVirtualWorldStore((s) => s.avatarName);
  const setAvatarColor = useVirtualWorldStore((s) => s.setAvatarColor);
  const setAvatarName = useVirtualWorldStore((s) => s.setAvatarName);
  const coins = useVirtualWorldStore((s) => s.coins);
  const inventory = useVirtualWorldStore((s) => s.inventory);
  const stats = useVirtualWorldStore((s) => s.stats);

  const [nameDraft, setNameDraft] = useState(avatarName);

  function saveName() {
    if (nameDraft.trim()) setAvatarName(nameDraft.trim());
  }

  function pickColor(color: AvatarColor) {
    setAvatarColor(color);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/world" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to hub
        </Link>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">🧑‍🎤 Your Profile</h1>
        <p className="text-slate-400">Customize your avatar and track your virtual-world progress.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-full ${AVATAR_BG_CLASS[avatarColor]} shadow-lg`} />
            <div>
              <div className="font-semibold">{avatarName}</div>
              <div className="text-sm text-slate-400">{user?.email}</div>
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Avatar name
            <div className="flex gap-2">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500"
              />
              <button
                onClick={saveName}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
              >
                Save
              </button>
            </div>
          </label>

          <div className="flex flex-col gap-2 text-sm">
            Avatar color
            <div className="flex gap-3">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => pickColor(c)}
                  aria-label={c}
                  className={`h-9 w-9 rounded-full ${AVATAR_BG_CLASS[c]} ring-offset-2 ring-offset-slate-900 transition ${
                    avatarColor === c ? `ring-2 ${AVATAR_RING_CLASS[c]}` : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 className="font-semibold">Stats</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <StatTile label="Coins" value={coins} accent="text-amber-300" />
            <StatTile label="Items owned" value={inventory.length} accent="text-sky-300" />
            <StatTile label="Tic-Tac-Toe wins" value={stats.ticTacToeWins} accent="text-violet-300" />
            <StatTile label="Memory wins" value={stats.memoryWins} accent="text-violet-300" />
            <StatTile label="Recipes cooked" value={stats.recipesCooked} accent="text-emerald-300" />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="mb-4 font-semibold">Inventory</h2>
        {inventory.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing yet — visit the{" "}
            <Link href="/world/shop" className="text-indigo-400 hover:text-indigo-300">
              shop
            </Link>{" "}
            to pick up some gear.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {inventory.map((item, i) => (
              <div
                key={`${item.id}-${i}`}
                className="flex flex-col items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-3 text-center"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-xs text-slate-300">{item.name}</span>
                <span className="text-[10px] text-slate-500">{CATEGORY_LABEL[item.category]}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className={`text-xl font-bold ${accent}`}>{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
