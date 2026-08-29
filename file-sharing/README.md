# Death by AI

This is the consolidated, final version of the project, merged from the
incremental stage-by-stage builds (stages 1–7) into two clean folders:

```
final/
├── backend/    Express + Socket.io server (rooms, game loop, Groq AI judge)
└── frontend/   React + Vite client (all screens, avatars, reveal sequences)
```

No stage-numbered duplicates, no half-finished branches — this is the single
version to run and deploy.

## What it is

A party game where each round an AI "judge" (via Groq) decides which
player's written strategy survives a ridiculous scenario. Includes:

- Lobby creation/joining with host migration
- Game-mode and avatar/personality selection
- Round-robin scenario-writer assignment
- Server-authoritative round timers
- Real-time scenario/strategy submission
- Groq-powered AI judging with a safe fallback if the API is unreachable
- Per-player reveal sequence, round history, ranked standings, podium/winner screen
- "Play Again" flow

## Quick start

**Backend**
```bash
cd backend
npm install
cp .env.example .env      # add a real GROQ_API_KEY for live AI judging (get one free at console.groq.com)
npm start                 # listens on http://localhost:3001
```

**Frontend** (in a second terminal)
```bash
cd frontend
npm install
cp .env.example .env      # defaults to http://localhost:3001, adjust if needed
npm run dev               # opens on http://localhost:5173
```

Without a `GROQ_API_KEY`, the game still runs end-to-end — rounds just fall
back to a generic "the AI couldn't reach a verdict" result instead of a real
judged outcome.

## Tests

**Backend** — pure logic suites run instantly, no server or network needed:
```bash
cd backend
node --test test-game-logic.js
node --test test-groq-judge.js
node --test test-groq-judge-integration.js   # against a local mock Groq server
```
Socket-level integration tests (`test-integration*.js`) need a running server
— start it first with `npm start`, then run them from a second terminal.

**Frontend**
```bash
cd frontend
npm run build     # production build
npx vitest run     # integration tests (need the backend running on :3001)
```

Both the backend's pure-logic suites (45 tests) and the frontend production
build have been verified to pass/succeed as of this consolidated version.

## Deploying

Backend: any Node host (Render, Railway, Fly.io, etc.) — set `CLIENT_ORIGIN`
to your deployed frontend's URL and `GROQ_API_KEY` in the environment.
Frontend: any static host (Vercel, Netlify, etc.) — set `VITE_BACKEND_URL` to
your deployed backend's URL at build time.
