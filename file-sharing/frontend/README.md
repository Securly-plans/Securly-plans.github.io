# Death by AI — Frontend

Avatar picker, username entry, create/join, the lobby, the shared visual system, the scenario/strategy screens, the judging → fate sealed → per-player reveal sequence, and standings after every round plus the podium winner screen. This is the full game loop, playable start to finish.

## Run it locally

You need the backend running first (Stage 1-7).

```bash
# terminal 1
cd ../backend && npm install && npm start

# terminal 2
npm install
cp .env.example .env      # defaults to http://localhost:3001, edit if needed
npm run dev
```

Open the printed local URL in two tabs to actually play a full game end to end: create/join, pick a Game Mode, Start, whichever tab is picked as writer submits a scenario, both write strategies, and — if the backend has a real `GROQ_API_KEY` — watch the real judging play out through fate-sealed, each player's reveal, standings, and (once the mode's rounds are up) the podium winner screen with Play Again.

## Verify it yourself

Four integration tests render the real app (via jsdom) and drive it against a **live** backend — not mocks:

```bash
npm start                # backend, in another terminal
npm install
npm test
```

- `test/lobby.integration.test.jsx` (Stage 2) — name/avatar entry, room creation, live join, mode changes, disconnects.
- `test/stage4.integration.test.jsx` (Stage 4) — scenario pick, transition beats, simultaneous strategy writing, reaching judging.
- `test/stage6.integration.test.jsx` (Stage 6) — **needs the backend started with a mock Groq server**, since it needs deterministic story content to assert on:
  ```bash
  # terminal 1
  cd ../backend && node run-mock-groq-server.js 4571
  # terminal 2
  cd ../backend && GROQ_API_KEY=test-key GROQ_API_BASE_URL=http://localhost:4571 npm start
  # terminal 3
  npx vitest run test/stage6.integration.test.jsx
  ```
  Queues a specific mock judge response over HTTP, then verifies the fate-sealed beat, the board-flip showing the right strategy, the story text, the correct survived/died verdict, and that it advances to a second player afterward. Takes about 12 seconds — the timings are real, not sped up, since that's the actual experience being tested.
- `test/stage7.integration.test.jsx` (Stage 7) — same mock-server setup as Stage 6 above. Switches the room to Elimination mode (so the game can complete after a single round — 2 players, one dies, one active player remains), plays that round for real through the actual reveal sequence, then verifies the Standings screen shows both players with the right round history, and that continuing lands on the podium Winner Screen with the correct survivor. Takes about 19 seconds for the same reason — real timing, not mocked.

You'll see some `act(...)` warnings and possibly one stray async socket.io-client error during teardown when running the full suite together — both are known, harmless noise from real-time sockets in a test environment, not test failures (all files report passed).

## What's built

**Stage 2 — lobby & visual system.** `SwirlBackground` (the rotating spiral, `theme` prop: purple | dark | black | light, reused by every later stage), `Robot` mascot, design tokens in `index.css` (Space Grotesk / JetBrains Mono / Inter, `--accent` yellow/orange), avatar picker, username entry, create/join, and the full lobby (player list with live host-transfer handling, room code + copy, Game Mode selector, Settings modal for AI Personality + How to Play).

**Stage 4 — scenario & strategy screens.** `ScenarioWriterScreen` (preset-cycling or free-type, live countdown), `ScenarioWaitingScreen` (updates automatically if the writer changes mid-turn), `TransitionSequence` (the two-beat "Scenario Incoming!" → "Prompt: …", shown once per round), `StrategyWritingScreen` (pinned prompt, pulsing countdown under 10s, "waiting for others (X/Y)" state, auto-submits at 0). `CountdownTimer`/`useCountdown` ticks from a server-provided epoch deadline, never a client-guessed duration.

**Stage 6 — the reveal sequence.** `JudgingScreen` (three dots pulsing on independently-offset timers). `FateSealedScreen` (robot's `closeup` pose, typewriter text via `useTypewriter`). The reveal loop in `screens/reveal/`: `RevealSequence` iterates `room.game.results` one player at a time; `BoardCard` does the CSS 3D flip (Framer Motion `rotateY`) showing what they wrote, robot in its `holding` pose; `StoryCard` types out the verdict while `useSpeech` triggers real TTS at the same moment (not hard-synced — TTS timing is unpredictable across browsers), with a replay button and speed slider, falling back gracefully (text still fully readable) in any environment without `speechSynthesis`, including jsdom.

**Stage 7 — standings & the winner screen.** `StandingsScreen` — shown once `RevealSequence` finishes iterating every player for the round. This is a local, client-side transition, not a server phase change: the backend's `phase` stays `revealing_results` throughout (see the backend README for why — each client paces its own reveal independently, so nothing should force-cut a slower client's animation). "Standings" / "round X/N" (or "round X / N max" for Elimination), one row per player with a `RoundHistoryIcons` strip (skull/check per round, dimmed for rounds not reached — or, for an eliminated player, rounds after they were out), an "OUT" tag for eliminated players, host-only "Continue" button. `PodiumWinnerScreen` — shown the instant `room.game.gameComplete` is true, which `GameScreen` checks *before* any phase-based routing (the flag can flip true while `phase` is still `revealing_results`, right when the last round's Continue is pressed, so every client needs to react to the flag itself, not wait on a phase change). Groups standings by rank so genuine ties share a podium block instead of one arbitrarily bumping the other down. Host-only "Play Again" (reuses the same `start_game` event Stage 3 built — the backend allows calling it again once the game is complete).

## Known stub

None on the frontend — Stage 7 completes the playable game loop. Stage 8 is deployment instructions, not more app code.

## A note on `npm audit`

`npm audit` will flag some moderate/high/critical advisories in the vite/vitest/esbuild dev-tooling chain. These are all about the local dev server accepting requests from other tabs during `npm run dev` — they don't affect the production build or deployed app, so there's nothing to fix here for this project.
