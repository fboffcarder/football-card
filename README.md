# Football Officiating App

A mobile-first web app that digitally replaces the paper game data cards carried by football officials. Tracks every detail of every game — penalties, scoring, timeouts, replays, crew, coin toss — and creates a permanent searchable record.

---

## Quick Start (Windows)

### Step 1 — Install Node.js
1. Go to [nodejs.org](https://nodejs.org)
2. Download the **LTS** version (e.g. 20.x)
3. Run the installer, accept all defaults
4. Open **Command Prompt** (Win+R → type `cmd` → Enter)
5. Verify: `node --version` should print `v20.x.x`

### Step 2 — Install VS Code (optional but recommended)
1. Go to [code.visualstudio.com](https://code.visualstudio.com)
2. Download and install
3. Install extensions: **Prettier** and **ESLint** (search in the Extensions panel, Ctrl+Shift+X)

### Step 3 — Set up Supabase
1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Click **New Project**, name it `football-officiating`
3. Pick any region (US East or US West recommended)
4. Wait for it to provision (~2 minutes)
5. Go to **Settings → API** and copy:
   - `Project URL` → this is your `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Go to **SQL Editor** → paste the entire contents of `supabase-schema.sql` → click **Run**

### Step 4 — Set up GitHub
1. Go to [github.com](https://github.com) → Sign up (free)
2. Click **+** → **New repository**
3. Name: `football-officiating-app`
4. Set to **Public** (or Private if preferred)
5. Do NOT initialize with README (we'll push our own)

### Step 5 — Set up Vercel
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. We'll connect the repo after pushing in Step 7

### Step 6 — Configure this project
1. Open **Command Prompt** and navigate to this folder:
   ```
   cd path\to\football-officiating-app
   ```
2. Copy the env example file:
   ```
   copy .env.example .env.local
   ```
3. Open `.env.local` in VS Code (or Notepad) and paste in your Supabase URL and key

### Step 7 — Install dependencies and run locally
```cmd
npm install
npm run dev
```
Then open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 8 — Push to GitHub
```cmd
git init
git add .
git commit -m "Initial commit — Football Officiating App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/football-officiating-app.git
git push -u origin main
```
Replace `YOUR_USERNAME` with your actual GitHub username.

### Step 9 — Deploy to Vercel
1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your `football-officiating-app` GitHub repo
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Deploy**
5. Once deployed, open the URL on your phone!

### Step 10 — Add to iPhone/Android home screen (PWA)
**iPhone (Safari):**
1. Open the Vercel URL in Safari
2. Tap the Share button (box with arrow)
3. Tap **Add to Home Screen**
4. Tap **Add** — it appears like a native app

**Android (Chrome):**
1. Open the Vercel URL in Chrome
2. Tap the ⋮ menu
3. Tap **Add to Home Screen**

---

## Project Structure

```
src/
  app/
    page.tsx              ← Home / Dashboard
    login/page.tsx        ← Login page
    game/
      new/page.tsx        ← New game setup (pre-game)
      [id]/page.tsx       ← Post-game summary with tabs
      [id]/live/page.tsx  ← In-game screen (sideline use)
  components/
    ui/
      Modal.tsx           ← Reusable bottom-sheet modal
      OfflineBadge.tsx    ← Offline status indicator
    forms/
      TimeoutForm.tsx     ← Timeout entry form
      PenaltyForm.tsx     ← Penalty flag form
      ScoringForm.tsx     ← Scoring play form
      ReplayForm.tsx      ← Instant replay form
      EventForm.tsx       ← Generic game event form
  hooks/
    useOnlineStatus.ts    ← Offline detection + sync
  lib/
    supabase.ts           ← Supabase client
    offlineQueue.ts       ← localStorage buffer for offline
    utils.ts              ← Formatting helpers
  types/
    index.ts              ← All TypeScript types + constants
supabase-schema.sql       ← Full DB schema (run in Supabase SQL Editor)
```

---

## For Dad's PC — Handoff Instructions

1. Make sure Node.js is installed (Step 1 above)
2. Clone the repo:
   ```cmd
   git clone https://github.com/YOUR_USERNAME/football-officiating-app.git
   cd football-officiating-app
   ```
3. Copy env file:
   ```cmd
   copy .env.example .env.local
   ```
4. Fill in `.env.local` with the same Supabase keys (same project = same database)
5. Install and run:
   ```cmd
   npm install
   npm run dev
   ```

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| Next.js 14 | React framework with App Router |
| Tailwind CSS | Mobile-first styling |
| Supabase | PostgreSQL database + auth |
| React Hook Form + Zod | Form handling + validation |
| jsPDF + autoTable | PDF export |
| next-pwa | PWA / offline support |
| date-fns | Date formatting |

---

## Supabase Auth — Inviting Crew Members

1. In Supabase dashboard → **Authentication → Users**
2. Click **Invite User** and enter their email
3. They'll receive a magic link to set up their account
4. Once signed in, they can create and edit game records
5. Unauthenticated users can still VIEW all game records (public read via RLS)
