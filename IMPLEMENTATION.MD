1) Product concept

Name (placeholder): LoveLobby
Core loop (1 round):

Partner A creates a lobby (5-digit code) → becomes Host / Setter.

Host answers 10 questions privately (their “key answers”).

Partner B joins with code → becomes Player / Guesser.

Player answers the same 10 questions with a timer while Host watches progress in real time.

After each answer (or time up), Host chooses Correct / Incorrect (optionally with a cute reaction).

At the end: results summary + shareable “couple scorecard” screen.

Tone: playful, safe, non-explicit, relationship-friendly.

2) Roles & permissions
Host / Setter

Creates lobby

Selects question pack (or random)

Answers all 10 questions (stored as “hostAnswers”)

During guess phase: watches player typing/answering

After each question: marks correct/incorrect (can override)

Can restart round, pick new pack, or end session

Player / Guesser

Joins lobby via 5-digit code

Waits until host completed setup

Answers 10 questions with timer

Can’t see host’s answers while playing

Sees verdict per question after host judges (or at end)

3) Key screens (UI flow)
A) Home

Two big buttons:

Create Lobby

Join Lobby (input: 5-digit code)

Optional: nickname input (display name)

B) Lobby (waiting room)

Shows code + copy button

Shows both participants connected (avatars or initials)

Shows state:

“Host is answering questions…”

“Ready to start?”

Host controls: pick pack, start setup, start game

C) Host Setup (Answering 10 questions)

One question at a time (or a list) with a progress bar

Host enters answer (free text / multiple choice depending on question type)

When done: “I’m ready” → switches lobby to guess phase

D) Guess Phase (Player answering)

Player view:

Question text

Timer countdown

Input UI (text / choices)

Submit button (or auto-submit on timeout)

Host view (watching):

Sees player’s current typed text live (for text questions)

When player submits/timeouts: sees player answer + host’s answer

Buttons: ✅ Correct / ❌ Incorrect

Optional: “Close enough” tooltip or “Let it pass” cute option

E) Results

Score: X / 10

Per-question breakdown with verdict

“Play again” (new questions same lobby)

“New lobby” / “End”

4) Lobby + state machine
Lobby states

WAITING_FOR_PLAYERS

HOST_SETUP

READY_TO_START (both present, host finished answers)

IN_PROGRESS (player answering)

JUDGING (after each question submission, host judges)

FINISHED

Per-question states

UNANSWERED

ANSWERING (player typing)

SUBMITTED (player answer submitted or timed out)

JUDGED (host marked correct/incorrect)

5) Real-time architecture (recommended)
Transport

Use WebSockets via Socket.IO (simplest) or native WebSocket.

Next.js: run Socket.IO on a Node server (custom server) or use a separate small WS server.

If you want “easiest deploy”: use a hosted WS service (Ably/Pusher/Supabase Realtime).

For MVP: a simple Socket.IO server is fine.

Persistence

MVP can be in-memory (Map keyed by lobbyCode) but will reset on redeploy.

Better: store lobby state in Redis or Postgres with realtime.

Minimal durable approach: Supabase Postgres + realtime or Upstash Redis.

Pick one for the IDE AI:

Option A (fast MVP): Socket.IO + in-memory (works locally, demo-grade)

Option B (deploy-safe): Socket.IO + Redis (Upstash)

6) Data model
Lobby
type Lobby = {
  code: string;                 // "04217"
  createdAt: number;
  host: Participant | null;
  player: Participant | null;

  packId: string;
  questionIds: string[];        // length 10
  questions: Question[];        // cached for convenience

  hostAnswers: HostAnswer[];    // length 10
  playerAnswers: PlayerAnswer[];// length 10

  currentIndex: number;         // 0..9
  phase: LobbyPhase;

  // timer control
  perQuestionSeconds: number;   // e.g. 25
  questionStartAt: number | null;

  // judging
  verdicts: Verdict[];          // { index, isCorrect, judgedAt, judgeNote? }
};

Participant
type Participant = {
  id: string;           // socket id or user uuid
  name: string;         // nickname
  joinedAt: number;
};

Question
type QuestionType = "TEXT" | "MULTI_CHOICE" | "THIS_OR_THAT" | "SCALE";

type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];      // for multi/this-or-that
  helper?: string;         // optional guidance
  maxLen?: number;         // for text input
};

Answers
type HostAnswer = {
  questionId: string;
  value: string;           // normalized
};

type PlayerAnswer = {
  questionId: string;
  value: string;
  submittedAt: number;
  timedOut: boolean;
  liveDraft?: string;      // optional for realtime typing
};

Verdict
type Verdict = {
  questionId: string;
  index: number;
  isCorrect: boolean;
  judgedAt: number;
};

7) 5-digit lobby code rules

Code is 5 digits: "00000" to "99999" (but avoid "00000").

On create:

Random generate

Check collision against active lobbies (in memory/redis/db)

Retry up to N times

8) Socket events (contract)
Connection / lobby

lobby:create → server returns { code, lobby }

lobby:join (code, name) → returns lobby state or error

lobby:leave → updates state

lobby:state (server emits) → full lobby snapshot to both

Setup

pack:select (packId) [host only]

host:answer:set ({ index, questionId, value })

host:setup:complete

Gameplay

game:start [host only]

player:draft:update ({ index, text }) // for live typing

player:answer:submit ({ index, value })

timer:tick (server emit optional) OR clients compute based on questionStartAt

Judging

host:judge ({ index, isCorrect })

Finish

game:finish (server sets FINISHED)

game:restart (reuse lobby, new questions)

Authorization checks:

Only host socket can do host actions

Only player socket can submit player answers

9) Timer behavior (clear rules)

Default perQuestionSeconds = 25 (configurable).

When a question begins:

server sets questionStartAt = Date.now() and emits state

Player can submit early.

If time reaches zero:

server auto-submits { value: "" , timedOut: true } if not submitted

phase moves to JUDGING

After host judges:

increment currentIndex

if last question judged → FINISHED

else start next question (new questionStartAt)

10) Question pack + bank
Packs

Create 3–5 packs to start:

Cute Basics

Daily Life

Memories

Preferences

Future / Dreams

Question types mix

For each round of 10 questions:

5 TEXT (short)

3 THIS_OR_THAT

2 MULTI_CHOICE or SCALE

Content constraints

No explicit sexual content

No heavy trauma topics

No sensitive personal identifiers

Keep answers short and fun

Prompts should allow “close enough” judging

Example question bank (seed ~30)

TEXT

“What’s my go-to comfort food when I’m tired?”

“What’s the first thing I do when I wake up?”

“If I could teleport right now, where would I go with you?”

“What’s a tiny habit of mine you find adorable?”

“What’s my ‘I need cheering up’ song vibe?”

“What emoji do I overuse when texting you?”

“What’s my most used app besides chat?”

“If I had a free day, what would I actually do?”

“What’s a nickname I secretly like?”

“What’s my ‘order at a cafe’ default?”

THIS OR THAT
11. “I’d rather: Movie night 🎬 / Game night 🎮”
12. “I’m more: Planner 🗓️ / Spontaneous 🎲”
13. “I prefer: Beach 🌊 / Mountains ⛰️”
14. “My messages are usually: Short 😶 / Long 🧾”
15. “Best date: Cozy at home 🛋️ / Going out ✨”

MULTI_CHOICE
16. “Which gift would make me happiest?” [options]
17. “Which time do I feel most alive?” Morning / Afternoon / Night / 2am Goblin Mode

SCALE (1–5)
18. “How much do I like surprises?” (1 hate–5 love)
19. “How social am I this month?” (1 hermit–5 extrovert)

Implementation: store in a JSON file questionBank.json, grouped by pack.

11) Correctness judging logic

Important: correctness is not automatic.

The app shows both answers side-by-side to Host.

Host decides ✅/❌.

Optionally allow a “tie / partial” toggle later, but MVP: boolean.

To prevent awkwardness:

add a cute tooltip: “Correct = close enough / same intention 💛”

12) UX details (small but important)

Always show connection status (“Partner connected ✅”)

If someone disconnects:

Pause timer

Keep lobby alive for e.g. 5 minutes

Show “Waiting for partner to reconnect…”

Add delight:

confetti on finish

little heart progress bar

silly waiting screen messages

13) Tech stack recommendation (for the IDE AI)

Next.js App Router + TypeScript + Tailwind + Socket.IO

/app routes:

/ home

/host/[code]

/play/[code]

/lobby/[code] (optional unified, role-based)

server/ for socket server (or pages/api/socket if using Pages Router approach)

lib/ for shared types + validation (zod)

State management:

Client: React state + derived from server lobby:state

Server is source of truth

Validation:

Use Zod schemas for all socket payloads

14) Acceptance criteria (definition of done)

Host can create lobby and receives 5-digit code.

Player can join with code and nickname.

Host selects a pack and answers 10 questions.

Player plays 10 questions with timer; host watches typed drafts in real-time.

On submit/timeout, host can judge correct/incorrect.

Scoreboard shows results; replay works.

Basic disconnect handling (pause + resume).

15) Implementation checklist (step-by-step for the IDE AI)

Scaffold Next.js (TS, Tailwind).

Implement shared types + Zod schemas.

Implement question bank JSON + “pick 10” logic.

Implement lobby store:

in-memory Map for MVP

functions: createLobby, joinLobby, updateHostAnswer, updatePlayerDraft, submitAnswer, judge, nextQuestion

Implement Socket.IO server:

connect

room = lobby code

emit lobby:state after every mutation

Build UI screens in order:

Home

Lobby waiting room

Host setup

Player view + Host watch view

Results screen

Add timer logic on server (setInterval per lobby or scheduled timeouts).

Add minimal styling + playful microcopy.

If you want, I can also generate a single “IMPLEMENTATION.md” file (with folder structure + exact event payload schemas + pseudo-code for server mutations) so you can paste it straight into your repo