# FootyZone

FootyZone is a football team randomizer and draft game rebuilt as a modern Next.js application.

## What changed

The original project was a static HTML/CSS/JavaScript app with hard-coded team data and a large collection of local club-logo files. The modern branch replaces that data layer with API-Football and moves the application to:

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- lucide-react
- Server-side API proxy through a Next.js Route Handler
- Remote club logos from API-Football
- Local favorites and recent-draft history
- Random, Balanced and Challenge modes
- Responsive app-like UI

## Supported leagues

- Premier League — 39
- La Liga — 140
- Bundesliga — 78
- Serie A — 135
- Ligue 1 — 61

## Local setup

1. Create an API-Football account and obtain an API key.
2. Copy `.env.example` to `.env.local`.
3. Set `API_FOOTBALL_KEY=your_api_football_key` and `FOOTBALL_SEASON=2026`.
4. Run `npm install`.
5. Run `npm run dev`.

## Architecture

The browser only talks to `/api/football`. The API key stays on the server in `API_FOOTBALL_KEY`.

Team/standings data is cached for one hour. The application loads teams once and performs randomization locally, so pressing Generate does not create another API request.

Live fixtures are exposed through `/api/football?mode=live` with a short cache and are intended for an on-demand live radar feature.

## Game Strength

FootyZone calculates a gameplay-only strength score from league position, points and recent form. It is deliberately labeled as a FootyZone score and is not an official club rating.

## Deployment

Use a Next.js-capable host such as Vercel. Add `API_FOOTBALL_KEY` and `FOOTBALL_SEASON` as server environment variables.

Do not use a `NEXT_PUBLIC_` prefix for the API key.

## API quota

API-Football currently lists a free plan with 100 requests/day and 10 requests/minute. Because of that limit, the app avoids requesting the API on every randomization and uses server-side caching.

## Project status

The `modernize/next-api-football` branch is the active migration branch. Keep the original branch untouched until the modern version has been installed and tested locally.
