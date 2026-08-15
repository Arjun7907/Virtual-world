# Virtual World

A live, browser-based virtual world where you log in as your own avatar and do
things — shop, cook, and play games — inside one connected hub.

The app lives in [`app/`](./app). `reference-repos.zip` at the repo root is a
bundle of open-source projects (WorkAdventure, an avatar/2D-world Unity
sample, and related lists) kept purely as design references; none of their
code was copied into this app.

## What's in the world

- **Hub** (`/world`) — a top-down 2D scene (built with [Phaser](https://phaser.io))
  where you walk your avatar with WASD/arrow keys and step into buildings to
  enter an activity.
- **Shop** (`/world/shop`) — browse a product catalog, build a cart, and check
  out by spending coins. Purchases land in your inventory.
- **Kitchen** (`/world/kitchen`) — pick a recipe and add ingredients in the
  right order before the timer runs out to earn coins.
- **Arcade** (`/world/arcade`) — Tic-Tac-Toe against an AI opponent and a
  Memory Match game, both paying out coins on a win.
- **Profile** (`/profile`) — customize your avatar's name/color and see your
  coin balance, inventory, and game stats.

Coins are the shared currency: earn them cooking and gaming, spend them at
the shop.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Phaser](https://phaser.io) for the walkable 2D world
- [Supabase](https://supabase.com) — Postgres + email/password auth, with row
  level security scoping every row to its owner
- [Zustand](https://zustand.docs.pmnd.rs) for client-side state, seeded from
  the server on every request (see [Accounts & data](#accounts--data) below)

## Accounts & data

Auth is real: `/signup` and `/login` call Supabase Auth
(`src/app/signup/page.tsx`, `src/app/login/page.tsx`). A new account gets a
`profiles` row (avatar name/color, 150 starting coins) and a `game_stats` row
auto-created by a Postgres trigger (`handle_new_user`, see the migration
history in the Supabase project). Purchases go into `inventory_items`.

Route protection happens in two layers:

- `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`) redirects
  signed-out visitors away from `/world*` and `/profile`, and signed-in users
  away from `/login`/`/signup`, using `src/lib/supabase/middleware.ts`.
- `src/app/(protected)/layout.tsx` is a Server Component that re-checks the
  session, fetches the user's profile/stats/inventory straight from Postgres,
  and seeds a per-request Zustand store (`src/lib/store.ts` +
  `src/components/StoreProvider.tsx`) via React context — not a module-level
  singleton, so concurrent requests from different users never share state.

Client-side mutations (buying an item, winning a game, renaming your avatar)
update the Zustand store optimistically and write through to Supabase via
`src/lib/supabase/client.ts`.

### Environment variables

The app needs a Supabase project URL and publishable key, read from
`app/.env.local` (gitignored — create your own):

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

The schema (three tables + RLS policies + the signup trigger) is defined by
the migrations applied to the project — reproduce it with the Supabase CLI or
dashboard SQL editor if you're pointing this at a fresh project.

> **Known limitation of this sandbox**: the session this was built in has an
> outbound network policy that blocks direct HTTPS to `*.supabase.co`, so the
> signup → persisted-data round trip could only be verified via the Supabase
> project's own tools (schema, RLS, and trigger were confirmed server-side),
> not via a live browser test from inside the sandbox. The build and lint are
> clean and the auth/data-fetching code follows the standard Supabase +
> Next.js App Router pattern, but it's worth a real signup/login pass in a
> normal environment before you rely on it.

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
        kitchen/                 cooking mini-game
        arcade/                  arcade hub + tic-tac-toe + memory match
      profile/                   avatar customization & stats
  components/
    PhaserGame.tsx                the Phaser scene (hub map, avatar, zones)
    StoreProvider.tsx, WorldNav.tsx
  lib/
    store.ts                     per-request Zustand store (factory + context)
    supabase/client.ts, server.ts, middleware.ts
    avatarColors.ts               avatar color palette + Tailwind class maps
  proxy.ts                        session refresh + route protection
```

## Extending this into a real product

The natural next steps, roughly in order of effort:

1. **Multiplayer presence** — sync avatar position over Supabase Realtime (or
   something like Colyseus) so other logged-in users appear and move in the
   same hub, à la WorkAdventure.
2. **More activities** — the hub's zone system (`WORLD_ZONES` in
   `PhaserGame.tsx`) is just a list of `{ id, label, x, y, width, height, href }`
   rectangles; adding a new building + activity page is the same pattern used
   for Shop/Kitchen/Arcade. A new activity that awards coins/inventory needs
   no schema changes — `inventory_items.category` already accepts `shop`,
   `kitchen`, or `arcade`.
3. **Richer world art** — the hub currently draws simple shapes/emoji in
   Phaser; swapping in a tileset (e.g. via Tiled + `phaser-tiled` or a WAM map
   like WorkAdventure uses) would make it feel like a real place.
