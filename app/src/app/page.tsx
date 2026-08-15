import Link from "next/link";

const ACTIVITIES = [
  {
    emoji: "🛍️",
    title: "Shop",
    description: "Browse the mall, fill your cart, and check out with coins you've earned.",
  },
  {
    emoji: "🍳",
    title: "Cook",
    description: "Follow interactive recipes in the kitchen and plate up before the timer runs out.",
  },
  {
    emoji: "🕹️",
    title: "Play",
    description: "Duel the AI at Tic-Tac-Toe or race the clock in Memory Match at the arcade.",
  },
  {
    emoji: "🧑‍🎤",
    title: "Customize",
    description: "Pick your avatar color and name, and track your stats and inventory.",
  },
];

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
            Live as your virtual me
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            One world. Endless activities.
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 bg-clip-text text-transparent">
              All as your own avatar.
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-slate-400">
            Log in, walk your avatar around a living virtual hub, and dive into shopping,
            cooking, and games — earning and spending coins along the way.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/signup"
              className="rounded-full bg-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 transition"
            >
              Create your avatar
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-slate-700 px-6 py-3 text-base font-semibold text-slate-200 hover:border-slate-500 transition"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-6 pb-24 sm:grid-cols-2 lg:grid-cols-4">
          {ACTIVITIES.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left transition hover:border-indigo-500/40 hover:bg-slate-900"
            >
              <div className="mb-3 text-3xl">{a.emoji}</div>
              <h3 className="mb-1 text-lg font-semibold">{a.title}</h3>
              <p className="text-sm text-slate-400">{a.description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-900 px-6 py-6 text-center text-sm text-slate-500">
        Built as a demo virtual-world experience — walk, shop, cook, and play as yourself.
      </footer>
    </div>
  );
}
