"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";
import type { JobProgress } from "@/lib/store";
import PresenceBar from "@/components/PresenceBar";
import { levelForShifts, payMultiplier, titleForLevel, shiftsToNextLevel, SHIFTS_PER_LEVEL, type JobId } from "@/lib/jobs";

interface Option {
  id: string;
  emoji: string;
  label: string;
}

interface SortItem {
  id: string;
  emoji: string;
  categoryId: string;
}

type JobKind = "match" | "whack" | "sort";

interface Job {
  id: JobId;
  title: string;
  emoji: string;
  description: string;
  kind: JobKind;
  seconds: number;
  rate: number;
  cap: number;
  roundMs: number;
}

const DRINKS: Option[] = [
  { id: "espresso", emoji: "☕", label: "Espresso" },
  { id: "tea", emoji: "🍵", label: "Tea" },
  { id: "boba", emoji: "🧋", label: "Boba" },
  { id: "soda", emoji: "🥤", label: "Soda" },
];

const BINS: Option[] = [
  { id: "electronics", emoji: "🗄️", label: "Electronics" },
  { id: "clothing", emoji: "👕", label: "Clothing" },
  { id: "food", emoji: "🍫", label: "Food" },
];

const SORT_ITEMS: SortItem[] = [
  { id: "phone", emoji: "📱", categoryId: "electronics" },
  { id: "laptop", emoji: "💻", categoryId: "electronics" },
  { id: "shirt", emoji: "👔", categoryId: "clothing" },
  { id: "shoe", emoji: "👟", categoryId: "clothing" },
  { id: "candy", emoji: "🍬", categoryId: "food" },
  { id: "bread", emoji: "🍞", categoryId: "food" },
];

const GRID_SIZE = 9;

const JOBS: Job[] = [
  {
    id: "barista",
    title: "Barista Shift",
    emoji: "☕",
    description: "An order flashes up — click the matching drink before it's gone.",
    kind: "match",
    seconds: 20,
    rate: 3,
    cap: 15,
    roundMs: 1400,
  },
  {
    id: "courier",
    title: "Delivery Sprint",
    emoji: "🛵",
    description: "Packages pop up on the loading dock — click them before they're missed.",
    kind: "whack",
    seconds: 25,
    rate: 3,
    cap: 18,
    roundMs: 900,
  },
  {
    id: "warehouse",
    title: "Warehouse Sort",
    emoji: "📦",
    description: "An item comes down the belt — sort it into the right bin.",
    kind: "sort",
    seconds: 25,
    rate: 3,
    cap: 15,
    roundMs: 1800,
  },
];

type Phase = "idle" | "working" | "done";

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomIndex(size: number): number {
  return Math.floor(Math.random() * size);
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function WorkPage() {
  const addCoins = useVirtualWorldStore((s) => s.addCoins);
  const recordWin = useVirtualWorldStore((s) => s.recordWin);
  const recordShift = useVirtualWorldStore((s) => s.recordShift);
  const jobsWorked = useVirtualWorldStore((s) => s.stats.jobsWorked);
  const jobProgress = useVirtualWorldStore((s) => s.jobProgress);

  const [job, setJob] = useState<Job | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [shiftTimeLeft, setShiftTimeLeft] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [payout, setPayout] = useState(0);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);

  // Round state, shaped per job kind.
  const [matchTarget, setMatchTarget] = useState<Option | null>(null);
  const [matchChoices, setMatchChoices] = useState<Option[]>([]);
  const [whackCell, setWhackCell] = useState<number | null>(null);
  const [sortItem, setSortItem] = useState<SortItem | null>(null);

  const phaseRef = useRef<Phase>("idle");
  const jobRef = useRef<Job | null>(null);
  const completedRef = useRef(0);
  const jobProgressRef = useRef<JobProgress>(jobProgress);
  const roundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shiftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    completedRef.current = completed;
  }, [completed]);
  useEffect(() => {
    jobProgressRef.current = jobProgress;
  }, [jobProgress]);

  function clearRoundTimeout() {
    if (roundTimeoutRef.current) clearTimeout(roundTimeoutRef.current);
    roundTimeoutRef.current = null;
  }

  function clearShiftTimeout() {
    if (shiftTimeoutRef.current) clearTimeout(shiftTimeoutRef.current);
    shiftTimeoutRef.current = null;
  }

  function startRound(currentJob: Job) {
    clearRoundTimeout();
    if (currentJob.kind === "match") {
      setMatchTarget(pickRandom(DRINKS));
      setMatchChoices(shuffle(DRINKS));
    } else if (currentJob.kind === "whack") {
      setWhackCell(pickRandomIndex(GRID_SIZE));
    } else {
      setSortItem(pickRandom(SORT_ITEMS));
    }

    roundTimeoutRef.current = setTimeout(() => {
      if (phaseRef.current !== "working") return;
      setFlash("miss");
      startRound(currentJob);
    }, currentJob.roundMs);
  }

  function finishShift(currentJob: Job) {
    clearRoundTimeout();
    clearShiftTimeout();
    const shiftsSoFar = jobProgressRef.current[currentJob.id] ?? 0;
    const level = levelForShifts(shiftsSoFar);
    const earned = Math.round(Math.min(completedRef.current, currentJob.cap) * currentJob.rate * payMultiplier(level));
    setPayout(earned);
    addCoins(earned);
    recordWin("jobsWorked");
    recordShift(currentJob.id);
    setPhase("done");
  }

  function tickShift(currentJob: Job, secondsLeft: number) {
    shiftTimeoutRef.current = setTimeout(() => {
      if (secondsLeft <= 1) {
        finishShift(currentJob);
        setShiftTimeLeft(0);
        return;
      }
      setShiftTimeLeft(secondsLeft - 1);
      tickShift(currentJob, secondsLeft - 1);
    }, 1000);
  }

  function clockIn(j: Job) {
    setJob(j);
    jobRef.current = j;
    setPhase("working");
    phaseRef.current = "working";
    setCompleted(0);
    completedRef.current = 0;
    setPayout(0);
    setFlash(null);
    setShiftTimeLeft(j.seconds);
    startRound(j);
    tickShift(j, j.seconds);
  }

  function handleAnswer(currentJob: Job, chosenId: string, correctId: string) {
    if (phaseRef.current !== "working") return;
    clearRoundTimeout();
    if (chosenId === correctId) {
      setCompleted((c) => Math.min(c + 1, currentJob.cap));
      setFlash("hit");
    } else {
      setFlash("miss");
    }
    startRound(currentJob);
  }

  function reset() {
    clearRoundTimeout();
    clearShiftTimeout();
    setJob(null);
    jobRef.current = null;
    setPhase("idle");
    setCompleted(0);
    setPayout(0);
    setFlash(null);
  }

  useEffect(() => {
    return () => {
      clearRoundTimeout();
      clearShiftTimeout();
    };
  }, []);

  const currentEarnings = job ? Math.min(completed, job.cap) * job.rate : 0;
  const atCap = job ? completed >= job.cap : false;

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
          {JOBS.map((j) => {
            const shifts = jobProgress[j.id] ?? 0;
            const level = levelForShifts(shifts);
            const title = titleForLevel(j.id, level);
            const multiplier = payMultiplier(level);
            const toNext = shiftsToNextLevel(shifts);
            const maxPay = Math.round(j.rate * j.cap * multiplier);

            return (
              <button
                key={j.id}
                onClick={() => clockIn(j)}
                className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center transition hover:border-emerald-500/40 hover:bg-slate-900"
              >
                <div className="text-4xl">{j.emoji}</div>
                <div className="font-semibold">{title}</div>
                <div className="text-[11px] text-slate-500">
                  Lv.{level} · {j.title}
                </div>
                <p className="text-xs text-slate-500">{j.description}</p>
                <div className="text-xs text-slate-500">
                  {j.seconds}s shift · 🪙 {(j.rate * multiplier).toFixed(1)}/task
                </div>
                <div className="text-sm text-emerald-300">Up to 🪙 {maxPay}</div>
                <div className="text-[11px] text-slate-600">
                  {toNext === null ? "Max level" : `${SHIFTS_PER_LEVEL - toNext}/${SHIFTS_PER_LEVEL} shifts to Lv.${level + 1}`}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {phase === "working" && job && (
        <div
          className={`flex flex-col items-center gap-5 rounded-2xl border p-6 transition-colors ${
            flash === "hit"
              ? "border-emerald-500/50 bg-emerald-500/5"
              : flash === "miss"
                ? "border-rose-500/50 bg-rose-500/5"
                : "border-slate-800 bg-slate-900/60"
          }`}
        >
          <div className="flex w-full items-center justify-between text-sm">
            <span className="font-semibold">
              {job.emoji} {titleForLevel(job.id, levelForShifts(jobProgress[job.id] ?? 0))}
            </span>
            <span className="text-slate-400">
              {completed}/{job.cap} tasks
            </span>
            <span className={`font-semibold ${shiftTimeLeft <= 5 ? "text-rose-400" : "text-slate-300"}`}>
              ⏱️ {shiftTimeLeft}s
            </span>
          </div>
          <p className="text-slate-400">
            Earning 🪙 {currentEarnings} so far{atCap ? " (capped out, nice work!)" : ""}.
          </p>

          {job.kind === "match" && matchTarget && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-sm text-slate-400">Order up:</div>
              <div className="text-6xl">{matchTarget.emoji}</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {matchChoices.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(job, opt.id, matchTarget.id)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm transition hover:border-emerald-400 hover:bg-slate-900"
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {job.kind === "whack" && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: GRID_SIZE }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(job, String(i), String(whackCell))}
                  className={`flex h-16 w-16 items-center justify-center rounded-xl border text-2xl transition sm:h-20 sm:w-20 ${
                    whackCell === i
                      ? "border-emerald-400 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-950 hover:border-slate-500"
                  }`}
                >
                  {whackCell === i ? "📦" : ""}
                </button>
              ))}
            </div>
          )}

          {job.kind === "sort" && sortItem && (
            <div className="flex flex-col items-center gap-4">
              <div className="text-sm text-slate-400">Sort this item:</div>
              <div className="text-6xl">{sortItem.emoji}</div>
              <div className="grid grid-cols-3 gap-3">
                {BINS.map((bin) => (
                  <button
                    key={bin.id}
                    onClick={() => handleAnswer(job, bin.id, sortItem.categoryId)}
                    className="flex flex-col items-center gap-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm transition hover:border-emerald-400 hover:bg-slate-900"
                  >
                    <span className="text-2xl">{bin.emoji}</span>
                    {bin.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "done" && job && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
          <div className="text-5xl">{job.emoji}</div>
          <h2 className="text-xl font-bold text-emerald-300">Shift complete!</h2>
          <p className="text-slate-300">
            You completed {Math.min(completed, job.cap)} tasks and earned 🪙 {payout} coins.
          </p>
          {(() => {
            const shiftsNow = jobProgress[job.id] ?? 0;
            const levelNow = levelForShifts(shiftsNow);
            const leveledUp = shiftsNow > 0 && levelForShifts(shiftsNow - 1) < levelNow;
            return leveledUp ? (
              <p className="text-sm font-semibold text-amber-300">
                🎉 Promoted to {titleForLevel(job.id, levelNow)} (Lv.{levelNow})!
              </p>
            ) : null;
          })()}
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
