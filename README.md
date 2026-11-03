# Verdict

**A triage command center for a bug-bounty hunter's inbox.**

A working hunter's inbox mixes four very different kinds of mail: verdicts on
submitted reports, programs asking for more information inside a reply window,
payout notifications, and platform noise. In a normal inbox they all look the
same — and the costliest mistake is missing the one message where a program is
waiting on *you*, because the report stalls or dies quietly.

Verdict fixes that. Its agent reads every incoming message and records a
triage decision for each one:

- **Verdict** — a decision on your work: triaged, accepted, duplicate, paid.
- **Action** — the program needs your reply or a step from you.
- **Noise** — newsletters, announcements, and mail that needs nothing.

Every call carries an urgency flag and a one-line reason, and the queue puts a
single **Do first** card on top: the most urgent open action item. Nothing is
hidden from the hunter — every agent decision can be overridden from the same
screen, because the agent and the UI run on the *same actions*.

## How it works

Verdict is built on the [Agent-Native framework](https://github.com/BuilderIO/agent-native).
The domain is six actions, shared verbatim by the chat agent, the web UI,
the CLI, HTTP, and MCP:

| Action | What it does |
| --- | --- |
| `list-items` | List inbox items, filterable by status and kind |
| `get-item` | Read one message in full |
| `add-item` | Add a message to the inbox |
| `triage-item` | Record kind, urgency, and a one-line reason for an item |
| `set-item-status` | Mark an item new, done, or archived |
| `seed-inbox` | Load the fictional demo inbox (only into an empty inbox) |

The queue at `/queue` is the product surface: filter chips (All, Needs triage,
Action, Verdicts, Noise, Done), the Do-first card, per-item badges and reasons,
a detail panel with manual triage override and status controls, and an
add-message form. The agent chat lives at `/chat` with the same actions and a
system prompt that encodes the triage rules — including the rule that every
triage run ends by naming the single do-first item.

All data is scoped per user; every query and mutation is owner-checked.

## Try it

The demo inbox is fictional: seven messages (a $250 verdict with a retest
invitation, an information request with a five-day deadline, a $480 payout, an
expiring identity verification, a program launch, a duplicate closure, and a
platform newsletter). Load it from the empty queue and ask the agent to triage
the inbox.

## Run locally

Prerequisites: Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open the app, choose **Continue as local dev** to sign in, and go to `/queue`.
Local development uses an embedded PGlite database — no setup needed.

The chat agent needs a model key in the environment. Any one of these works:
`GOOGLE_GENERATIVE_AI_API_KEY`, `OPENROUTER_API_KEY`, `OPENAI_API_KEY`,
`ANTHROPIC_API_KEY`, `GROQ_API_KEY`.

Useful commands:

```bash
pnpm action list-items        # the same actions, from the CLI
pnpm action seed-inbox
pnpm typecheck
```

## Deploy

A Netlify preset ships in `netlify.toml`. A production deployment needs:

- `DATABASE_URL` — a hosted PostgreSQL database
- `BETTER_AUTH_SECRET` — a stable auth secret
- one model key (see above)

## About

Built for the Builder.io Agent-Native Hackathon (November 2026), solo.
The framework is MIT-licensed; this app builds on the framework's chat
template.
