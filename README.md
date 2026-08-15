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
the shop. Everything is tied together by one Zustand store
(`app/src/lib/store.ts`) persisted to `localStorage`.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Phaser](https://phaser.io) for the walkable 2D world
- [Zustand](https://zustand.docs.pmnd.rs) (with the `persist` middleware) for
  state

Auth is a self-contained demo: signing in just records a name/email in the
browser — there's no backend or password. This keeps the whole thing runnable
with zero external services while leaving an obvious seam to swap in real
auth later (see below).

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
    page.tsx                 landing page
    login/, signup/           demo auth
    world/
      layout.tsx              auth-guards + nav for every /world/* route
      page.tsx                the Phaser hub
      shop/                   shopping activity
      kitchen/                cooking mini-game
      arcade/                 arcade hub + tic-tac-toe + memory match
    profile/                  avatar customization & stats
  components/
    PhaserGame.tsx             the Phaser scene (hub map, avatar, zones)
    AuthGuard.tsx, ProtectedShell.tsx, WorldNav.tsx
  lib/
    store.ts                   Zustand store: user, avatar, coins, inventory, stats
    avatarColors.ts             avatar color palette + Tailwind class maps
```

## Extending this into a real product

This is a single-player, client-only MVP. The natural next steps, roughly in
order of effort:

1. **Real accounts** — swap the demo `login()` call in `src/lib/store.ts` for
   a real auth provider (e.g. Supabase Auth or NextAuth), and move `coins`,
   `inventory`, and `stats` from `localStorage` into a database keyed by user
   id.
2. **Multiplayer presence** — sync avatar position over WebSockets (or
   something like Supabase Realtime / Colyseus) so other logged-in users
   appear and move in the same hub, à la WorkAdventure.
3. **More activities** — the hub's zone system (`WORLD_ZONES` in
   `PhaserGame.tsx`) is just a list of `{ id, label, x, y, width, height, href }`
   rectangles; adding a new building + activity page is the same pattern used
   for Shop/Kitchen/Arcade.
4. **Richer world art** — the hub currently draws simple shapes/emoji in
   Phaser; swapping in a tileset (e.g. via Tiled + `phaser-tiled` or a WAM map
   like WorkAdventure uses) would make it feel like a real place.
