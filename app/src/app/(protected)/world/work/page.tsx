"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";
import PresenceBar from "@/components/PresenceBar";

interface Job {
  id: string;
  title: string;
  emoji: string;
  verb: string;
  seconds: number;
  rate: number;
  cap: number;
}

const JOBS: Job[] = [
  {
    id: "barista",
    title: "Barista Shift",
    emoji: "☕",
    verb: "Pull a shot",
    seconds: 15,
    rate: 2,
    cap: 20,
  },
  {
    id: "courier",
    title: "Delivery Run",
    emoji: "🛵",
    verb: "Drop off a package",
    seconds: 20,
    rate: 3,
    cap: 18,
  },
  {
    id: "warehouse",
    title: "Warehouse Shift",
    emoji: "📦",
    verb: "Scan a crate",
    seconds: 30,
    rate: 4,
    cap: 20,
  },
];

type Phase = "idle" | "working" | "done";

export default function WorkPage() {
  const addCoins = useVirtualWorldStore((s) => s.addCoins);
  const recordWin = useVirtualWorldStore((s) => s.recordWin);
  const jobsWorked = useVirtualWorldStore((s) => s.stats.jobsWorked);

  const [job, setJob] = useState<Job | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [clicks, setClicks] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [payout, setPayout] = useState(0);

  useEffect(() => {
    if (phase !== "working" || !job) return;
    const t = setTimeout(() => {
      if (timeLeft <= 1) {
        const earned = Math.min(clicks, job.cap) * job.rate;
        setPayout(earned);
        addCoins(earned);
        recordWin("jobsWorked");
        setPhase("done");
        setTimeLeft(0);
      } else {
        setTimeLeft((s) => s - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, job, clicks, addCoins, recordWin]);

  function clockIn(j: Job) {
    setJob(j);
    setPhase("working");
    setClicks(0);
    setTimeLeft(j.seconds);
    setPayout(0);
  }

  function doWork() {
    if (!job) return;
    setClicks((c) => Math.min(c + 1, job.cap));
  }

  function reset() {
    setJob(null);
    setPhase("idle");
    setClicks(0);
    setPayout(0);
  }

  const currentEarnings = job ? Math.min(clicks, job.cap) * job.rate : 0;
  const atCap = job ? clicks >= job.cap : false;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/world" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to hub
        </Link>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">💼 The Job Board</h1>
        <p className="text-slate-400">Clock in, put in the effort, get paid. Shifts worked: {jobsWorked}</p>
      </div>

      <PresenceBar room="work" activity="working" />

      {phase === "idle" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {JOBS.map((j) => (
            <button
              key={j.id}
              onClick={() => clockIn(j)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center transition hover:border-emerald-500/40 hover:bg-slate-900"
            >
              <div className="text-4xl">{j.emoji}</div>
              <div className="font-semibold">{j.title}</div>
              <div className="text-xs text-slate-500">
                {j.seconds}s shift · 🪙 {j.rate}/task
              </div>
              <div className="text-sm text-emerald-300">Up to 🪙 {j.rate * j.cap}</div>
            </button>
          ))}
        </div>
      )}

      {phase === "working" && job && (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex w-full items-center justify-between text-sm">
            <span className="font-semibold">
              {job.emoji} {job.title}
            </span>
            <span className="text-slate-400">
              {clicks}/{job.cap} tasks
            </span>
            <span className={`font-semibold ${timeLeft <= 5 ? "text-rose-400" : "text-slate-300"}`}>
              ⏱️ {timeLeft}s
            </span>
          </div>
          <p className="text-slate-400">
            Click as fast as you can — earning 🪙 {currentEarnings} so far{atCap ? " (capped out, nice work!)" : ""}.
          </p>
          <button
            onClick={doWork}
            disabled={atCap}
            className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {job.verb}
          </button>
        </div>
      )}

      {phase === "done" && job && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <div className="text-5xl">{job.emoji}</div>
          <h2 className="text-xl font-bold text-emerald-300">Shift complete!</h2>
          <p className="text-slate-300">
            You completed {Math.min(clicks, job.cap)} tasks and earned 🪙 {payout} coins.
          </p>
          <button
            onClick={reset}
            className="mt-2 rounded-full bg-emerald-500 px-5 py-2 font-semibold text-white hover:bg-emerald-400"
          >
            Pick another job
          </button>
        </div>
      )}
    </div>
  );
}
