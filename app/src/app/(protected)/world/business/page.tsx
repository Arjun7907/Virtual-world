"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";
import PresenceBar from "@/components/PresenceBar";
import {
  VENTURE_TEMPLATES,
  accruedCoins,
  ventureRate,
  ventureUpgradeCost,
  type VentureType,
} from "@/lib/ventures";

const VENTURE_ORDER: VentureType[] = ["coffee_cart", "flip_shop", "startup"];

export default function BusinessPage() {
  const coins = useVirtualWorldStore((s) => s.coins);
  const ventures = useVirtualWorldStore((s) => s.ventures);
  const buyVenture = useVirtualWorldStore((s) => s.buyVenture);
  const collectVenture = useVirtualWorldStore((s) => s.collectVenture);
  const upgradeVenture = useVirtualWorldStore((s) => s.upgradeVenture);

  const [now, setNow] = useState(() => Date.now());
  const [buying, setBuying] = useState<VentureType | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleBuy(type: VentureType) {
    setBuying(type);
    await buyVenture(type);
    setBuying(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/world" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to hub
        </Link>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">🚀 Business District</h1>
        <p className="text-slate-400">Start a venture and it earns coins for you even while you&apos;re away.</p>
      </div>

      <PresenceBar room="business" activity="managing a business" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {VENTURE_ORDER.map((type) => {
          const template = VENTURE_TEMPLATES[type];
          const owned = ventures.find((v) => v.type === type);

          if (!owned) {
            const canAfford = coins >= template.cost;
            return (
              <div
                key={type}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center"
              >
                <div className="text-4xl">{template.emoji}</div>
                <div className="font-semibold">{template.name}</div>
                <p className="text-xs text-slate-500">{template.description}</p>
                <div className="text-sm text-emerald-300">
                  🪙 {template.baseRatePerHour}/hr at level 1 (cap {template.capHours}h)
                </div>
                <button
                  onClick={() => handleBuy(type)}
                  disabled={!canAfford || buying === type}
                  className="mt-2 w-full rounded-full bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {buying === type ? "Starting…" : `Start for 🪙 ${template.cost}`}
                </button>
              </div>
            );
          }

          const earned = accruedCoins(template, owned.level, owned.lastCollectedAt, now);
          const rate = ventureRate(template, owned.level);
          const cost = ventureUpgradeCost(template, owned.level);
          const canUpgrade = coins >= cost;
          const capped = earned >= template.capHours * rate;

          return (
            <div
              key={type}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center"
            >
              <div className="text-4xl">{template.emoji}</div>
              <div className="font-semibold">
                {template.name} <span className="text-slate-400">· Lv.{owned.level}</span>
              </div>
              <div className="text-xs text-slate-500">🪙 {rate}/hr</div>
              <div className="text-lg font-bold text-amber-300">🪙 {earned}</div>
              {capped && <div className="text-[11px] text-rose-400">Maxed out — collect soon</div>}
              <button
                onClick={() => collectVenture(owned.id)}
                disabled={earned <= 0}
                className="mt-1 w-full rounded-full bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                Collect
              </button>
              <button
                onClick={() => upgradeVenture(owned.id)}
                disabled={!canUpgrade}
                className="w-full rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-emerald-500/40 disabled:cursor-not-allowed disabled:text-slate-600"
              >
                Upgrade for 🪙 {cost}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
