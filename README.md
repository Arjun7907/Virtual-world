# Virtual World — Live Globe

A live, privacy-conscious view of who's online right now. Anyone can open the
globe and watch, no account needed. Create an account and opt in to share
your city, and you show up as a glowing point on it yourself, alongside
everyone else currently online — no replay, no simulation, just real people
in real time.

The app lives in [`app/`](./app). `reference-repos.zip` and `live-globe.zip`
at the repo root are open-source/prototype references kept purely for design
inspiration; only ideas (not code) were carried over into this app.

## What's here

- **Landing page** (`/`) — a teaser globe (`LiveMapSection`) showing whoever's
  currently opted in, with a live "N explorers online" count.
- **Sign up / log in** (`/signup`, `/login`) — real Supabase email/password
  auth. Pick a name and avatar color when you sign up.
- **Live globe** (`/globe`) — a full-screen rotating 3D globe, open to
  anyone, signed in or not. If you're signed in, you also get a one-time
  consent prompt to share your location; your device's GPS reading is
  snapped to the nearest of ~20 world-city anchors (`src/lib/cityAnchors.ts`)
  before it's ever broadcast — nothing more precise than "which city,
  roughly" leaves the browser. Nothing is stored in a database: your
  presence is broadcast only while you're online, via Supabase Realtime
  Presence, so declining, signing out, or closing the tab removes you
  instantly. Click a light to see who it is; new joins get a brief ripple.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [react-globe.gl](https://github.com/vasturiano/react-globe.gl) (three.js/WebGL)
  for the live 3D globe
- [Supabase](https://supabase.com) — Postgres + email/password auth, row
  level security, and Realtime Presence for the live globe
- [Zustand](https://zustand.docs.pmnd.rs) for client-side identity state,
  seeded from the server on every request (see [Accounts & data](#accounts--data)
  below)

## Accounts & data

Auth is real: `/signup` and `/login` call Supabase Auth
(`src/app/signup/page.tsx`, `src/app/login/page.tsx`). A new account gets a
`profiles` row (avatar name/color) auto-created by a Postgres trigger
(`handle_new_user`).

`/globe` itself is public — no route protection needed there. The only auth
redirect left is `src/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`)
sending already-signed-in users away from `/login`/`/signup` to `/globe`,
via `src/lib/supabase/middleware.ts`.

`src/app/globe/page.tsx` is a Server Component that checks for a session
without requiring one: if signed in, it fetches the user's profile (avatar
name/color) from Postgres and seeds a per-request Zustand store
(`src/lib/store.ts` + `src/components/StoreProvider.tsx`) via React context —
not a module-level singleton, so concurrent requests from different users
never share state. `src/components/GlobeView.tsx` renders the full-screen
globe either way, only mounting the store/consent-banner/sign-out UI when
there's an identity to hang them on.

Renaming your avatar or changing its color updates the Zustand store
optimistically and writes through to Supabase via
`src/lib/supabase/client.ts`.

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

The schema (the `profiles` table, its RLS policies, and the signup trigger)
is defined by the migrations applied to the project — reproduce it with the
Supabase CLI or dashboard SQL editor if you're pointing this at a fresh
project. (The project this was built against still has a handful of unused
tables/functions left over from an earlier version of the app that included
jobs/businesses/a marketplace — they're inert and safe to ignore or drop.)

> **Known limitation of this sandbox**: the session this was built in has an
> outbound network policy that blocks direct HTTPS to `*.supabase.co`, so
> most of this could only be verified via the Supabase project's own tools
> (schema, RLS confirmed server-side) and via `npm run build`/`lint`, not a
> live browser round trip from inside the sandbox. The code follows standard
> Supabase + Next.js App Router / Realtime patterns, but it's worth a real
> multi-account pass (two browser sessions, two locations) in a normal
> environment before you rely on it.

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
    page.tsx                    landing page (teaser globe)
    login/, signup/              real Supabase auth
    globe/page.tsx               public full-screen live globe (identity optional)
  components/
    GlobeView.tsx                 full-screen globe chrome, works signed-in or not
    LiveGlobe.tsx, LiveMapSection.tsx  the 3D globe + its landing-page teaser
    GlobePresence.tsx              opt-in consent banner + location broadcaster
    StoreProvider.tsx
  lib/
    store.ts                     per-request Zustand store (factory + context) — identity only
    globeMap.ts                    live-globe presence hook (public, unauthenticated-safe)
    cityAnchors.ts                  city-anchor snapping for privacy-conscious location
    supabase/client.ts, server.ts, middleware.ts, config.ts
    avatarColors.ts               avatar color palette + Tailwind class maps
  proxy.ts                        session refresh + route protection
```

## Extending this into a real product

The natural next steps, roughly in order of effort:

1. **Richer profile panel** — clicking a light on `/globe` currently shows
   name, avatar, and city; a real profile (bio, status, a way to say hi) is
   the obvious next layer.
2. **Direct messaging or "say hi"** — the globe already knows who's online;
   wiring up a lightweight DM or wave feature is a natural fit given the
   existing Realtime channel.
3. **More precise opt-in tiers** — e.g. letting a user choose neighborhood-
   vs. city-level precision, rather than one fixed anchor set.
