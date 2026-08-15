"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";

const EMOJIS = ["🍕", "🚀", "🎧", "🐙", "🌵", "🎲", "🍩", "🛸"];

interface Card {
  id: number;
  emoji: string;
  matched: boolean;
}

function buildDeck(): Card[] {
  const doubled = [...EMOJIS, ...EMOJIS];
  for (let i = doubled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
  }
  return doubled.map((emoji, id) => ({ id, emoji, matched: false }));
}

const MIN_MOVES = EMOJIS.length;
const MAX_REWARD = 40;
const MIN_REWARD = 10;

function calcReward(moves: number) {
  return Math.max(MIN_REWARD, MAX_REWARD - Math.max(0, moves - MIN_MOVES) * 2);
}

export default function MemoryMatchPage() {
  const addCoins = useVirtualWorldStore((s) => s.addCoins);
  const recordWin = useVirtualWorldStore((s) => s.recordWin);
  const wins = useVirtualWorldStore((s) => s.stats.memoryWins);

  const [cards, setCards] = useState<Card[]>(() => buildDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const solved = cards.every((c) => c.matched);

  useEffect(() => {
    if (flipped.length !== 2) return;
    const [a, b] = flipped;
    const finalMoves = moves + 1;
    const timer = setTimeout(() => {
      setCards((prev) => {
        if (prev[a].emoji !== prev[b].emoji) return prev;
        const next = prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c));
        if (next.every((c) => c.matched)) {
          addCoins(calcReward(finalMoves));
          recordWin("memoryWins");
        }
        return next;
      });
      setFlipped([]);
      setLocked(false);
      setMoves(finalMoves);
    }, 650);
    return () => clearTimeout(timer);
  }, [flipped, moves, addCoins, recordWin]);

  function flip(index: number) {
    if (locked || flipped.includes(index) || cards[index].matched || flipped.length === 2) return;
    const next = [...flipped, index];
    setFlipped(next);
    if (next.length === 2) setLocked(true);
  }

  function newGame() {
    setCards(buildDeck());
    setFlipped([]);
    setMoves(0);
    setLocked(false);
  }

  const projectedReward = calcReward(moves);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full">
        <Link href="/world/arcade" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to arcade
        </Link>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">🧠 Memory Match</h1>
        <p className="text-slate-400">
          Fewer moves earn more coins (up to 🪙 {MAX_REWARD}). Wins: {wins}
        </p>
      </div>

      <div className="flex items-center gap-6 text-sm text-slate-400">
        <span>Moves: {moves}</span>
        <span>Reward if you win now: 🪙 {projectedReward}</span>
      </div>

      <div className="grid grid-cols-4 gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        {cards.map((card, i) => {
          const shown = card.matched || flipped.includes(i);
          return (
            <button
              key={card.id}
              onClick={() => flip(i)}
              className={`flex h-16 w-16 items-center justify-center rounded-xl border text-2xl transition sm:h-20 sm:w-20 ${
                card.matched
                  ? "border-emerald-500/50 bg-emerald-500/10"
                  : "border-slate-700 bg-slate-950 hover:border-violet-500"
              }`}
            >
              {shown ? card.emoji : "❔"}
            </button>
          );
        })}
      </div>

      {solved && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-lg font-semibold text-emerald-400">
            Board cleared in {moves} moves! +🪙 {projectedReward}
          </p>
          <button
            onClick={newGame}
            className="rounded-full bg-violet-500 px-5 py-2 font-semibold text-white hover:bg-violet-400"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}
