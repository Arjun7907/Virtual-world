"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useVirtualWorldStore } from "@/lib/store";
import { AVATAR_BG_CLASS } from "@/lib/avatarColors";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/world", label: "Hub", icon: "🗺️" },
  { href: "/world/shop", label: "Shop", icon: "🛍️" },
  { href: "/world/work", label: "Work", icon: "💼" },
  { href: "/world/business", label: "Business", icon: "🚀" },
  { href: "/world/market", label: "Exchange", icon: "🏛️" },
  { href: "/world/kitchen", label: "Kitchen", icon: "🍳" },
  { href: "/world/arcade", label: "Arcade", icon: "🕹️" },
  { href: "/profile", label: "Profile", icon: "🧑‍🎤" },
];

export default function WorldNav() {
  const pathname = usePathname();
  const router = useRouter();
  const coins = useVirtualWorldStore((s) => s.coins);
  const avatarColor = useVirtualWorldStore((s) => s.avatarColor);
  const avatarName = useVirtualWorldStore((s) => s.avatarName);

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-900 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/world" className="flex items-center gap-2 text-base font-semibold tracking-tight shrink-0">
          <span className="text-xl">🌐</span>
          <span className="hidden sm:inline">Virtual World</span>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-1 overflow-x-auto">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-indigo-500 text-white"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                }`}
              >
                <span>{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-300">
            🪙 <span>{coins}</span>
          </div>
          <div className={`h-8 w-8 rounded-full ${AVATAR_BG_CLASS[avatarColor]}`} title={avatarName} />
          <button
            onClick={handleLogout}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:border-slate-500 hover:text-white transition"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
