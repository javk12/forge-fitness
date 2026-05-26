# Deployment Guide

This walks through getting FORGE live on a real domain.

## Prerequisites

- Node 18+ installed
- A GitHub account
- A Vercel account (free) — sign up with GitHub
- An Anthropic API key — [console.anthropic.com](https://console.anthropic.com) → Settings → API Keys → Create Key
- A domain name (optional but recommended) — Cloudflare or Namecheap ~$12/year

## Step 1 — Local sanity check

```bash
npm install
cp .env.example .env
# Open .env, paste your Anthropic API key
```

Run the full app with the proxy locally:

```bash
npm install -g vercel
vercel dev
```

Open the URL it prints. Walk through onboarding, log some food, talk to the coach. If the coach replies, your API key is wired up correctly.

## Step 2 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create forge-fitness --private --source=. --push
# or do it manually on github.com
```

## Step 3 — Connect Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repo
3. Framework preset: **Vite** (should auto-detect)
4. Don't deploy yet — click **Environment Variables**
5. Add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your key (`sk-ant-api03-...`)
   - Environments: Production, Preview, Development
6. Optionally add `RATE_LIMIT_PER_HOUR` = `60` (or whatever)
7. Click **Deploy**

You'll get a URL like `forge-fitness-xyz.vercel.app`. Test it.

## Step 4 — Add your domain

1. Vercel project → **Settings → Domains**
2. Add `yourdomain.com` (and `www.yourdomain.com` if you want)
3. Follow Vercel's DNS instructions — either:
   - **Easy**: change your domain's nameservers to Vercel
   - **Granular**: add A/CNAME records pointing to Vercel
4. Wait a few minutes for DNS to propagate. Vercel issues an SSL cert automatically.

Done. `yourdomain.com` is live.

## Step 5 — Production hardening

These are recommended before you tell anyone about your site.

### Rate limiting that actually works

The in-memory rate limiter in `api/claude.js` is fine for a few users but breaks under load (Vercel spins up multiple function instances, each with their own memory). Replace it with [Upstash Redis](https://upstash.com) (free tier is generous).

```bash
npm install @upstash/redis @upstash/ratelimit
```

Add to Vercel env vars:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Then in `api/claude.js`, replace `rateLimit()` with the Upstash version. Their docs have a 10-line example.

### Per-user cost limits

The proxy doesn't know who's calling it. To prevent one user from burning your whole budget:
- Add auth (Supabase / Clerk) and pass a user ID with each request
- Track tokens used per user in your database
- Reject calls when monthly limit hit

### Auth and cross-device sync

If you want users to log in and see their data on any device:
1. Sign up at [supabase.com](https://supabase.com)
2. Add their JS client: `npm install @supabase/supabase-js`
3. Replace `src/lib/storage.js` with calls to Supabase's `from('user_data').select/upsert`
4. Add a login screen before onboarding

The rest of the app doesn't need to change — that's why `storage` is its own module.

### Monitoring

- Vercel **Analytics** (free) — see page views, vitals
- Vercel **Functions** logs — watch for proxy errors
- Anthropic **Console** — see API spend in real time. Set a budget alert.

## Step 6 — Legal

Before sharing publicly:

1. Customize `docs/PRIVACY.md` (your name, email, jurisdiction). Host it at `/privacy`.
2. Customize `docs/TERMS.md`. Host it at `/terms`.
3. Add links to both in the app footer or settings.
4. If you take any user data outside the EU/UK/CA, list your sub-processors (Anthropic, Vercel).

You can host them as static markdown pages, or convert to HTML and put them in `/public/privacy.html` and `/public/terms.html`.

## Going to App Stores

If you want a native app:
- **PWA**: cheapest path. Add a manifest and service worker, users can "Add to Home Screen". No app store needed.
- **Capacitor** ([capacitorjs.com](https://capacitorjs.com)): wrap the React app as iOS/Android. Same codebase, real native shell.
- **Apple App Store**: $99/year, ~2 week review, follow [Health and Fitness](https://developer.apple.com/app-store/review/guidelines/) guidelines.
- **Google Play**: $25 one-time, similar review.

Health/fitness apps targeting minors get extra scrutiny on both. Have your medical disclaimers, age gate, and privacy policy bulletproof.

## Costs at a glance

| Stage | Monthly cost |
|---|---|
| Just you using it | ~$2 |
| 100 active users, light use | ~$20–50 |
| 1,000 active users | ~$200–600 |
| 10,000+ | time to add paid tier or aggressive rate limits |

The biggest variable is the food photo feature. Each photo runs ~$0.02–0.05 in API cost. Limit it to a few per user per day if you go free.
