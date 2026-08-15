"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";

type Cell = "X" | "O" | null;
type Board = Cell[];

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function getWinner(board: Board): Cell {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

function isDraw(board: Board) {
  return board.every((c) => c !== null) && !getWinner(board);
}

function minimax(board: Board, isMaximizing: boolean): number {
  const winner = getWinner(board);
  if (winner === "O") return 1;
  if (winner === "X") return -1;
  if (isDraw(board)) return 0;

  const scores: number[] = [];
  board.forEach((cell, i) => {
    if (cell) return;
    const next = [...board];
    next[i] = isMaximizing ? "O" : "X";
    scores.push(minimax(next, !isMaximizing));
  });
  return isMaximizing ? Math.max(...scores) : Math.min(...scores);
}

function bestMove(board: Board): number {
  let best = -Infinity;
  let move = -1;
  // 15% chance of a deliberately weaker move to keep the game beatable.
  const openMoves = board.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  if (Math.random() < 0.15 && openMoves.length > 1) {
    return openMoves[Math.floor(Math.random() * openMoves.length)];
  }
  board.forEach((cell, i) => {
    if (cell) return;
    const next = [...board];
    next[i] = "O";
    const score = minimax(next, false);
    if (score > best) {
      best = score;
      move = i;
    }
  });
  return move;
}

const REWARD = 25;

export default function TicTacToePage() {
  const addCoins = useVirtualWorldStore((s) => s.addCoins);
  const recordWin = useVirtualWorldStore((s) => s.recordWin);
  const wins = useVirtualWorldStore((s) => s.stats.ticTacToeWins);

  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [playerStarts, setPlayerStarts] = useState(true);

  const turn = board.filter(Boolean).length % 2 === 0 ? (playerStarts ? "X" : "O") : playerStarts ? "O" : "X";

  const status = useMemo<"playing" | "won" | "lost" | "draw">(() => {
    const winner = getWinner(board);
    if (winner === "X") return "won";
    if (winner === "O") return "lost";
    if (isDraw(board)) return "draw";
    return "playing";
  }, [board]);

  useEffect(() => {
    if (status !== "playing") return;
    if (turn !== "O") return;
    const t = setTimeout(() => {
      setBoard((b) => {
        if (getWinner(b) || isDraw(b)) return b;
        const move = bestMove(b);
        if (move < 0) return b;
        const next = [...b];
        next[move] = "O";
        return next;
      });
    }, 450);
    return () => clearTimeout(t);
  }, [board, turn, status]);

  function play(index: number) {
    if (status !== "playing" || board[index] || turn !== "X") return;
    const next = [...board];
    next[index] = "X";
    setBoard(next);
    if (getWinner(next) === "X") {
      addCoins(REWARD);
      recordWin("ticTacToeWins");
    }
  }

  function newGame() {
    setBoard(Array(9).fill(null));
    setPlayerStarts((p) => !p);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full">
        <Link href="/world/arcade" className="text-sm text-slate-400 hover:text-slate-200">
          ← Back to arcade
        </Link>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">❌⭕ Tic-Tac-Toe</h1>
        <p className="text-slate-400">You&apos;re X. Beat the AI to earn 🪙 {REWARD} coins. Wins: {wins}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => play(i)}
            className="flex h-20 w-20 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-3xl font-bold transition hover:border-violet-500 disabled:cursor-not-allowed sm:h-24 sm:w-24"
            disabled={!!cell || status !== "playing" || turn !== "X"}
          >
            <span className={cell === "X" ? "text-sky-400" : "text-rose-400"}>{cell}</span>
          </button>
        ))}
      </div>

      <div className="text-center">
        {status === "playing" && (
          <p className="text-slate-400">{turn === "X" ? "Your move." : "AI is thinking…"}</p>
        )}
        {status === "won" && <p className="text-lg font-semibold text-emerald-400">You won! +🪙 {REWARD}</p>}
        {status === "lost" && <p className="text-lg font-semibold text-rose-400">The AI got you this time.</p>}
        {status === "draw" && <p className="text-lg font-semibold text-slate-300">It&apos;s a draw.</p>}
        {status !== "playing" && (
          <button
            onClick={newGame}
            className="mt-3 rounded-full bg-violet-500 px-5 py-2 font-semibold text-white hover:bg-violet-400"
          >
            Play again
          </button>
        )}
      </div>
    </div>
  );
}
