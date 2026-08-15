"use client";

import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";

const GAMES = [
  {
    id: "tic-tac-toe",
    name: "Tic-Tac-Toe",
    emoji: "❌⭕",
    description: "Outsmart the AI. Win for 25 coins.",
    href: "/world/arcade/tic-tac-toe",
    statKey: "ticTacToeWins" as const,
  },
  {
    id: "memory",
    name: "Memory Match",
    emoji: "🧠",
    description: "Clear the board fast for up to 40 coins.",
    href: "/world/arcade/memory",
    statKey: "memoryWins" as const,
  },
];

export default function ArcadePage() {
  const stats = useVirtualWorldStore((s) => s.stats);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/world" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to hub
        </Link>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">🕹️ The Arcade</h1>
        <p className="text-slate-400">Pick a game and earn coins for your wins.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            href={g.href}
            className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-violet-500/40 hover:bg-slate-900"
          >
            <div className="text-4xl">{g.emoji}</div>
            <div className="text-lg font-semibold">{g.name}</div>
            <p className="text-sm text-slate-400">{g.description}</p>
            <div className="mt-2 text-xs text-slate-500">Wins: {stats[g.statKey]}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
