import Link from "next/link";
import LiveMapSection from "@/components/LiveMapSection";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="text-2xl">🌐</span>
          Virtual World
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/globe"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            View live globe
          </Link>
          <Link
            href="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 transition"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
          <span className="animate-float rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1 text-sm text-indigo-300">
            A live view of who&apos;s here, right now
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            One globe. Everyone online.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              No replay, no simulation.
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-slate-400">
            Create your avatar, opt in to share your city, and watch yourself appear as a
            live light on the world map alongside everyone else who&apos;s online right now.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/globe"
              className="rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 transition"
            >
              Open the live globe
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-slate-700 px-6 py-3 text-base font-semibold text-slate-200 hover:border-slate-500 transition"
            >
              Create your avatar to show up on it
            </Link>
          </div>
        </section>

        <LiveMapSection />
      </main>

      <footer className="border-t border-slate-900 px-6 py-6 text-center text-sm text-slate-500">
        Built as a live, privacy-conscious view of whoever&apos;s online right now.
      </footer>
    </div>
  );
}
