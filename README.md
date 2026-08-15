# Virtual World

A live, browser-based virtual world where you log in as your own avatar and
build a parallel economy — work, run a business, shop, and trade with other
real players — inside one connected hub. No real money ever moves; the coin
economy is entirely self-contained.

The app lives in [`app/`](./app). `reference-repos.zip` at the repo root is a
bundle of open-source projects (WorkAdventure, an avatar/2D-world Unity
sample, and related lists) kept purely as design references; none of their
code was copied into this app.

## What's in the world

- **Hub** (`/world`) — a top-down 2D scene (built with [Phaser](https://phaser.io))
  where you walk your avatar with WASD/arrow keys and step into buildings to
  enter an activity. Other logged-in players appear live, moving around the
  same hub in real time.
- **Work** (`/world/work`) — clock into a shift (Barista, Courier, Warehouse),
  each with a genuinely different mini-game (reaction/matching, whack-a-mole,
  classification), and get paid coins for what you complete.
- **Business** (`/world/business`) — start a venture (Coffee Cart, Flip Shop,
  Tech Startup) for an upfront cost; it accrues coins over real time (capped,
  so it can't be farmed indefinitely) whether you're online or not. Upgrade
  it for a higher rate.
- **The Exchange** (`/world/market`) — a real player-to-player marketplace:
  list an item from your inventory for a fixed price or as a timed auction;
  other players buy or bid with escrowed coins. All of it updates live via
  Supabase Realtime, so you see other people's bids and listings appear as
  they happen.
- **Shop** (`/world/shop`) — browse a product catalog, build a cart, and check
  out by spending coins. Purchases land in your inventory (which is what you
  actually trade on the Exchange).
- **Kitchen** (`/world/kitchen`) — pick a recipe and add ingredients in the
  right order before the timer runs out to earn coins.
- **Arcade** (`/world/arcade`) — Tic-Tac-Toe against an AI opponent and a
  Memory Match game, both paying out coins on a win.
- **Profile** (`/profile`) — customize your avatar's name/color and see your
  coin balance, inventory, and stats.

Every room (Shop/Work/Business/Kitchen/Arcade/Exchange) shows a live "N
people here right now" bar with the avatars of whoever else is currently
there — the same presence system that drives the hub.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Phaser](https://phaser.io) for the walkable 2D world
- [Supabase](https://supabase.com) — Postgres + email/password auth, row
  level security, Realtime (Presence + Postgres Changes), and Postgres
  functions for the marketplace's money-handling
- [Zustand](https://zustand.docs.pmnd.rs) for client-side state, seeded from
  the server on every request (see [Accounts & data](#accounts--data) below)

## Accounts & data

Auth is real: `/signup` and `/login` call Supabase Auth
(`src/app/signup/page.tsx`, `src/app/login/page.tsx`). A new account gets a
`profiles` row (avatar name/color, 150 starting coins) and a `game_stats` row
auto-created by a Postgres trigger (`handle_new_user`). Purchases go into
`inventory_items`; owning a venture adds a row to `ventures`.

Route protection happens in two layers:

- `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) redirects
  signed-out visitors away from `/world*` and `/profile`, and signed-in users
  away from `/login`/`/signup`, using `src/lib/supabase/middleware.ts`.
- `src/app/(protected)/layout.tsx` is a Server Component that re-checks the
  session, fetches the user's profile/stats/inventory/ventures straight from
  Postgres, and seeds a per-request Zustand store (`src/lib/store.ts` +
  `src/components/StoreProvider.tsx`) via React context — not a module-level
  singleton, so concurrent requests from different users never share state.

Most client-side mutations (buying a shop item, winning a game, renaming your
avatar, running a venture) update the Zustand store optimistically and write
through to Supabase via `src/lib/supabase/client.ts`.

**The marketplace is different on purpose.** Listing/buying/bidding/cancelling
all go through Postgres functions (`create_listing`, `buy_listing`,
`place_bid`, `cancel_listing`, `resolve_expired_auctions` — `security definer`,
granted to `authenticated` only) instead of raw client-side table writes. A
bid escrows the bidder's coins immediately and refunds the previous highest
bidder atomically inside the same transaction; a client can't spend coins it
doesn't have or race another bid, because the row is locked (`for update`)
for the duration of the function call. `src/lib/marketplace.ts` calls these
via `supabase.rpc(...)` and subscribes to Postgres Changes on
`marketplace_listings` so everyone browsing sees new listings and bids land
live, with a 15s poll as a fallback.

### Environment variables

The app needs a Supabase project URL and publishable key, read from
`app/.env.local` (gitignored — create your own):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

`src/lib/supabase/config.ts` also bakes in a fallback so deployments without
these env vars configured still work (these values are meant to be public —
protected by RLS, not secrecy).

The schema (tables, RLS policies, the signup trigger, and the marketplace
functions) is defined by the migrations applied to the project — reproduce it
with the Supabase CLI or dashboard SQL editor if you're pointing this at a
fresh project.

> **Known limitation of this sandbox**: the session this was built in has an
> outbound network policy that blocks direct HTTPS to `*.supabase.co`, so
> most of this could only be verified via the Supabase project's own tools
> (schema, RLS, function grants confirmed server-side) and via `npm run
> build`/`lint`, not a live browser round trip from inside the sandbox. The
> code follows standard Supabase + Next.js App Router / Realtime patterns,
> but it's worth a real multi-account pass (two browser sessions bidding
> against each other) in a normal environment before you rely on it.

## Running locally

```bash
cd app
npm install
npm run dev
```

Then open http://localhost:3000. `npm run build` produces a production
build; `npm run lint` runs ESLint.

## Project structure

```
app/src/
  app/
    page.tsx                    landing page
    login/, signup/              real Supabase auth
    (protected)/                 route group: fetches user data server-side,
                                  seeds the store, renders the shared nav
      world/
        page.tsx                 the Phaser hub
        shop/                    shopping activity
        work/                    job shifts (3 distinct mini-games)
        business/                venture ownership (passive income)
        market/                  player-to-player marketplace + auctions
        kitchen/                 cooking mini-game
        arcade/                  arcade hub + tic-tac-toe + memory match
      profile/                   avatar customization & stats
  components/
    PhaserGame.tsx                the Phaser scene (hub map, avatar, zones)
    PresenceBar.tsx                "N people here now" bar used on every room
    StoreProvider.tsx, WorldNav.tsx
  lib/
    store.ts                     per-request Zustand store (factory + context)
    presence.ts                   Supabase Realtime Presence hook
    marketplace.ts                 marketplace RPC calls + live listings hook
    ventures.ts                    venture templates/economics (pure functions)
    jobs.ts                        job leveling/titles/pay-multiplier (pure functions)
    supabase/client.ts, server.ts, middleware.ts, config.ts
    avatarColors.ts               avatar color palette + Tailwind class maps
  proxy.ts                        session refresh + route protection
```

Job progression (levels, titles, pay multiplier) is stored in a `job_progress`
table (one row per user per job) and computed via pure functions in
`src/lib/jobs.ts` — every 5 completed shifts levels a job up, raising its pay
multiplier and unlocking a new title (e.g. Trainee Barista → Barista → Head
Barista → Café Manager), shown on the Work page and in a Careers section on
the Profile page.

Auctions close automatically: a `pg_cron` job calls
`resolve_expired_auctions()` every minute server-side, on top of the
opportunistic calls the Exchange page already makes (page load + 15s poll),
so listings resolve even when nobody has the page open.

## Extending this into a real product

The natural next steps, roughly in order of effort:

1. **More activities** — the hub's zone system (`WORLD_ZONES` in
   `PhaserGame.tsx`) is just a list of `{ id, label, x, y, width, height, href }`
   rectangles; adding a new building + activity page is the same pattern used
   for the existing zones.
2. **Richer world art** — the hub currently draws simple shapes/emoji in
   Phaser; swapping in a tileset (e.g. via Tiled + `phaser-tiled` or a WAM map
   like WorkAdventure uses) would make it feel like a real place.
