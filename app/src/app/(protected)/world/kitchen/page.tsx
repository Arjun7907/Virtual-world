"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";
import PresenceBar from "@/components/PresenceBar";

interface Recipe {
  id: string;
  name: string;
  emoji: string;
  steps: { label: string; emoji: string }[];
  reward: number;
  seconds: number;
}

const RECIPES: Recipe[] = [
  {
    id: "salad",
    name: "Garden Salad",
    emoji: "🥗",
    reward: 20,
    seconds: 20,
    steps: [
      { label: "Lettuce", emoji: "🥬" },
      { label: "Tomato", emoji: "🍅" },
      { label: "Cucumber", emoji: "🥒" },
      { label: "Dressing", emoji: "🫙" },
    ],
  },
  {
    id: "pizza",
    name: "Homemade Pizza",
    emoji: "🍕",
    reward: 35,
    seconds: 25,
    steps: [
      { label: "Dough", emoji: "🥖" },
      { label: "Sauce", emoji: "🍅" },
      { label: "Cheese", emoji: "🧀" },
      { label: "Pepperoni", emoji: "🍖" },
      { label: "Bake", emoji: "🔥" },
    ],
  },
  {
    id: "cake",
    name: "Birthday Cake",
    emoji: "🎂",
    reward: 45,
    seconds: 30,
    steps: [
      { label: "Flour", emoji: "🌾" },
      { label: "Eggs", emoji: "🥚" },
      { label: "Sugar", emoji: "🧂" },
      { label: "Bake", emoji: "🔥" },
      { label: "Frosting", emoji: "🍰" },
      { label: "Candles", emoji: "🕯️" },
    ],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type Phase = "idle" | "playing" | "success" | "failed";

export default function KitchenPage() {
  const addCoins = useVirtualWorldStore((s) => s.addCoins);
  const recipesCooked = useVirtualWorldStore((s) => s.stats.recipesCooked);
  const recordWin = useVirtualWorldStore((s) => s.recordWin);

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [order, setOrder] = useState<Recipe["steps"]>([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (phase !== "playing") return;
    const t = setTimeout(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          setPhase("failed");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  function startRecipe(r: Recipe) {
    setRecipe(r);
    setOrder(shuffle(r.steps));
    setNextIndex(0);
    setTimeLeft(r.seconds);
    setPhase("playing");
  }

  function pickIngredient(step: Recipe["steps"][number]) {
    if (!recipe || phase !== "playing") return;
    const expected = recipe.steps[nextIndex];
    if (step.label === expected.label) {
      if (nextIndex + 1 === recipe.steps.length) {
        setPhase("success");
        addCoins(recipe.reward);
        recordWin("recipesCooked");
      } else {
        setNextIndex((i) => i + 1);
      }
    } else {
      setPhase("failed");
    }
  }

  function reset() {
    setRecipe(null);
    setPhase("idle");
    setOrder([]);
    setNextIndex(0);
  }

  const progressLabel = useMemo(() => {
    if (!recipe) return "";
    return `Step ${Math.min(nextIndex + 1, recipe.steps.length)} of ${recipe.steps.length}`;
  }, [recipe, nextIndex]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/world" className="text-sm text-slate-400 hover:text-slate-200">
            ← Back to hub
          </Link>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">🍳 The Kitchen</h1>
          <p className="text-slate-400">
            Add ingredients in the right order before time runs out. Recipes cooked: {recipesCooked}
          </p>
        </div>
      </div>

      <PresenceBar room="kitchen" activity="cooking" />

      {phase === "idle" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {RECIPES.map((r) => (
            <button
              key={r.id}
              onClick={() => startRecipe(r)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center transition hover:border-amber-500/40 hover:bg-slate-900"
            >
              <div className="text-4xl">{r.emoji}</div>
              <div className="font-semibold">{r.name}</div>
              <div className="text-xs text-slate-500">
                {r.steps.length} steps · {r.seconds}s
              </div>
              <div className="text-sm text-amber-300">🪙 {r.reward}</div>
            </button>
          ))}
        </div>
      )}

      {phase === "playing" && recipe && (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex w-full items-center justify-between text-sm">
            <span className="font-semibold">
              {recipe.emoji} {recipe.name}
            </span>
            <span className="text-slate-400">{progressLabel}</span>
            <span className={`font-semibold ${timeLeft <= 5 ? "text-rose-400" : "text-slate-300"}`}>
              ⏱️ {timeLeft}s
            </span>
          </div>
          <p className="text-slate-400">Click the next ingredient in the correct order.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {order.map((step) => (
              <button
                key={step.label}
                onClick={() => pickIngredient(step)}
                className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm transition hover:border-amber-400 hover:bg-slate-900"
              >
                <span className="text-2xl">{step.emoji}</span>
                {step.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "success" && recipe && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <div className="text-5xl">{recipe.emoji}</div>
          <h2 className="text-xl font-bold text-emerald-300">Delicious! You plated the {recipe.name}.</h2>
          <p className="text-slate-300">You earned 🪙 {recipe.reward} coins.</p>
          <button
            onClick={reset}
            className="mt-2 rounded-full bg-emerald-500 px-5 py-2 font-semibold text-white hover:bg-emerald-400"
          >
            Cook something else
          </button>
        </div>
      )}

      {phase === "failed" && recipe && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-8 text-center">
          <div className="text-5xl">🔥</div>
          <h2 className="text-xl font-bold text-rose-300">Oops — that dish didn&apos;t work out.</h2>
          <p className="text-slate-300">Time ran out or an ingredient was out of order.</p>
          <button
            onClick={reset}
            className="mt-2 rounded-full bg-rose-500 px-5 py-2 font-semibold text-white hover:bg-rose-400"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
