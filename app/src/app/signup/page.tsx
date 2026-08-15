"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVirtualWorldStore } from "@/lib/store";
import { AVATAR_COLORS, AVATAR_BG_CLASS, AVATAR_RING_CLASS } from "@/lib/avatarColors";
import type { AvatarColor } from "@/lib/store";

export default function SignupPage() {
  const router = useRouter();
  const login = useVirtualWorldStore((s) => s.login);
  const setAvatarColor = useVirtualWorldStore((s) => s.setAvatarColor);
  const setAvatarName = useVirtualWorldStore((s) => s.setAvatarName);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [color, setColor] = useState<AvatarColor>("indigo");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Enter both your name and email to continue.");
      return;
    }
    login({ name: name.trim(), email: email.trim() });
    setAvatarName(name.trim().split(" ")[0]);
    setAvatarColor(color);
    router.push("/world");
  }

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200">
          ← Back home
        </Link>
        <h1 className="mb-1 text-2xl font-bold">Create your avatar</h1>
        <p className="mb-6 text-sm text-slate-400">
          You&apos;ll start with 150 coins to spend at the shop, kitchen, and arcade.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ada Lovelace"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="ada@example.com"
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-indigo-500"
            />
          </label>
          <div className="flex flex-col gap-2 text-sm">
            Avatar color
            <div className="flex gap-3">
              {AVATAR_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={`h-9 w-9 rounded-full ${AVATAR_BG_CLASS[c]} transition ring-offset-2 ring-offset-slate-900 ${
                    color === c ? `ring-2 ${AVATAR_RING_CLASS[c]}` : ""
                  }`}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            className="mt-2 rounded-full bg-indigo-500 px-4 py-2.5 font-semibold text-white hover:bg-indigo-400 transition"
          >
            Start exploring
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an avatar?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
