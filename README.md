# FORGE — Fitness Operating System

A no-nonsense web app for workouts, nutrition, calorie tracking, and AI coaching. Built for teens and adults.

## What's in the box

- **Onboarding** — 10–11 steps that collect body, goal, equipment, schedule, diet, injuries, sleep
- **Teen Mode** (auto for ages 13–17) — calorie floors, no aggressive cuts, safety screen, age-aware coach
- **Workout plans** — gym, calisthenics, or hybrid; block periodization (accessories rotate every 4 weeks, week 4 is a deload)
- **Specific training days** — pick which days of the week you train
- **Exercise alternatives** — every exercise has 3–5 swap options labeled easier / similar / harder
- **Rest timer** — auto-starts when you check off a set
- **Calorie & macro tracker** — searchable food database filtered by diet
- **Food photo analysis** — snap a meal, Claude estimates calories and macros
- **Water tracker** — tappable cup grid, target scales to body weight
- **Weight log** — with SVG trend chart
- **Daily wellness check-in** — sleep, energy, mood, soreness with 7-day history
- **AI Coach** — Claude Sonnet, knows your full profile, plan, and what you ate today
- **Achievements** — unlockables for streaks, sessions, water, tracking
- **Bold athletic UI** — acid lime on iron black

## Quick start (local)

```bash
npm install
cp .env.example .env
# edit .env, paste your key from console.anthropic.com
```

For local dev you have two options:

**A) Just the frontend** (the Coach + Food photo features won't work locally, but everything else does):

```bash
npm run dev
```

**B) Frontend + serverless function** (recommended — works exactly like production):

```bash
npm i -g vercel    # one time
vercel dev         # serves /api/claude alongside the app
```

Open http://localhost:5173 (Vite) or whatever URL `vercel dev` prints.

## Deploy to Vercel

1. Push this folder to a new GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo
3. Framework preset: **Vite** (auto-detected). Build command and output dir are correct by default.
4. **Add environment variable** (Settings → Environment Variables):
   - `ANTHROPIC_API_KEY` — your key from [console.anthropic.com](https://console.anthropic.com)
   - (optional) `RATE_LIMIT_PER_HOUR` — defaults to 60
5. **Deploy**. Vercel auto-detects the `/api` folder and turns `api/claude.js` into a serverless function.

Custom domain: project → **Settings → Domains** → add yours (Cloudflare or Namecheap ~$12/yr).

## Tech stack

- React 18 + Vite 6
- lucide-react (icons)
- Anthropic Claude Sonnet (AI coach + food vision)
- Vercel serverless functions (API proxy)
- localStorage (data persistence per device)

## Project layout

```
forge-fitness/
├── api/
│   └── claude.js          # Serverless proxy → Anthropic
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx            # Main app (~3000 lines)
│   ├── main.jsx           # React entry
│   ├── styles.css
│   └── lib/
│       ├── api.js         # callClaude() — hits /api/claude
│       └── storage.js     # localStorage adapter
├── docs/
│   ├── DEPLOY.md          # Detailed deploy guide + scaling notes
│   ├── PRIVACY.md         # Privacy policy template
│   └── TERMS.md           # Terms of service template
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vercel.json            # Function timeout config
└── vite.config.js
```

## Costs (rough)

| Item | Cost |
|---|---|
| Domain | ~$12/year |
| Vercel hosting (Hobby) | $0 for personal scale |
| Claude API (Sonnet) | ~$0.01–0.03 per coach message, ~$0.02–0.05 per food photo |

A few hundred users with normal usage = tens of dollars/month. Heavy use or a public viral spike = could be hundreds. Set per-user limits before opening the doors.

**Model version**: the code uses `claude-sonnet-4-6`. Newer models ship regularly — check [docs.claude.com](https://docs.claude.com) for the latest model strings and bump it in `src/App.jsx`.

## Before you launch publicly

- [ ] Read `docs/PRIVACY.md` and host the privacy policy publicly
- [ ] Read `docs/TERMS.md` and host the terms
- [ ] Add a visible medical disclaimer link in the UI
- [ ] If you want accounts that sync across devices: add Supabase Auth or Clerk and swap `src/lib/storage.js` to call your backend
- [ ] Replace the in-memory rate limiter in `api/claude.js` with Upstash Redis (it doesn't share state across function instances)
- [ ] For users 13–17: consider a parental-consent step
- [ ] For under-13 users: blocked at onboarding (do not relax this)
- [ ] If wrapping as a native app: App Store and Play Store have separate health/fitness rules

## License

MIT — yours to modify, deploy, and ship. Don't blame me if you get injured. Talk to a doctor.
