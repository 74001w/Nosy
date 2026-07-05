# Nosy

Your morning, summarized. Gmail, Google Calendar, and Slack, gathered into one prioritized briefing.

This is the **foundation phase** of the build: real project structure, real auth, real data handling logic (Prioritization Logic + Suggested Actions Logic from the PRD), and mock data standing in for live Gmail/Calendar/Slack. The live API connections (Sprint 2 in the PRD) come next, once this foundation is confirmed solid, that's intentional, it's the "build in the right order so nothing breaks later" approach.

---

## 1. What's actually built right now

- Two demo logins (no real signup flow, matches the PRD's MVP scope)
- A backend API with:
  - `/api/auth/login` — validates input, checks demo credentials, returns a session token
  - `/api/briefing` — protected route, returns all five sections (URGENT, UPCOMING EVENTS, SLACK HIGHLIGHTS, OTHER EMAILS, SUGGESTED ACTIONS) built from mock data using the exact Prioritization Logic and Suggested Actions Logic from the PRD
  - A way to simulate a data source failing (`?fail=gmail`, `?fail=calendar`, or `?fail=slack`), so you can actually see the friendly-error-message behavior work, not just take it on faith
- A frontend that matches the wireframe: login screen, generate button, loading screen with rotating funny messages, results screen with the font-based hierarchy (bold+underline / bold / italics), and empty/error states
- A Supabase/PostgreSQL schema, ready for Sprint 3 (briefing history), with row-level security policies already in place
- A basic automated smoke test covering the main flows (login validation, auth protection, all five sections present, failure handling)

## 2. What's intentionally NOT built yet (comes later, per the PRD)

- The actual AI agent (Strands + LiteLLM + OpenRouter) — right now, the Prioritization Logic and Suggested Actions Logic run as plain JavaScript rules against mock data. This proves the data layer works correctly before adding the AI layer on top of it.
- Live Gmail/Calendar/Slack connections (that's Sprint 2)
- VIP sender list (intentionally empty per the PRD, filled in after a real run)
- Briefing history actually being saved (the database table exists, nothing writes to it yet)

---

## 3. Project structure

```
Nosy/
├── frontend/          <- everything the browser loads
│   ├── index.html     <- login screen
│   ├── briefing.html  <- main app screen
│   ├── css/styles.css
│   ├── js/
│   │   ├── config.js  <- API URL, edit this after backend is deployed
│   │   ├── auth.js
│   │   └── briefing.js
│   └── vercel.json
├── backend/           <- everything that runs on a server
│   ├── server.js
│   ├── routes/         (auth.js, briefing.js)
│   ├── middleware/      (auth.js — the JWT check)
│   ├── services/        (prioritization.js, suggestedActions.js, mockDataLoader.js)
│   ├── config/          (demoUsers.js, supabaseClient.js)
│   ├── data/mock/        (gmail.json, calendar.json, slack.json)
│   ├── db/schema.sql   <- run this in Supabase
│   ├── tests/smoke-test.js
│   ├── .env.example    <- copy to .env, never commit .env itself
│   └── package.json
├── .gitignore
└── README.md (this file)
```

---

## 4. Step-by-step: running it locally

### 4.1 Unzip this into your project folder

You gave me this path earlier: `/Users/rob/pursuit-2.0/L2/wk-5`. I can't write to your Mac's filesystem directly, so:

1. Download the zip file I'm giving you
2. Move it into `/Users/rob/pursuit-2.0/L2/wk-5`
3. Unzip it there (double-click, or `unzip Nosy.zip` in Terminal)

You should end up with `/Users/rob/pursuit-2.0/L2/wk-5/Nosy/` containing the `frontend` and `backend` folders above.

### 4.2 Backend setup

Open a terminal in the `backend` folder:

```bash
cd Nosy/backend
npm install
```

Copy the environment template and fill it in:

```bash
cp .env.example .env
```

Open `.env` and:
- Generate a real `JWT_SECRET` by running: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and pasting the result in
- Leave `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as placeholders for now, the app runs fine without them (Supabase is only needed once briefing history actually starts saving)
- Leave the demo user emails/passwords as-is, or change them, your call

Start the backend:

```bash
npm run dev
```

You should see: `Nosy backend running on http://localhost:4000`

Leave that terminal running, open a **second terminal**, and run the smoke test to confirm everything actually works:

```bash
cd Nosy/backend
npm test
```

You should see 12 checks, all `PASS`. If anything fails, fix that before touching the frontend, the whole point of building foundation-first is catching problems here, not later.

### 4.3 Frontend setup

The frontend is plain HTML/CSS/JS, no build step. Simplest way to run it locally:

```bash
cd Nosy/frontend
npx serve .
```

(or just double-click `index.html` to open it directly in a browser, though `npx serve` avoids some browser quirks with local file access)

Open the URL it gives you (usually `http://localhost:3000`).

### 4.4 Log in

Two demo accounts, either the buttons or type them manually:

| Name | Email | Password |
|---|---|---|
| Alex | alex@demo.test | demo1234 |
| Sam | sam@demo.test | demo1234 |

Click **Generate morning briefing** and watch it work.

To test the failure state, open your browser's address bar for the API directly, or temporarily edit `frontend/js/briefing.js`'s fetch URL to add `?fail=slack` (or `gmail`, `calendar`) and regenerate, you'll see the friendly "unavailable" message instead of a crash.

---

## 5. Deploying

### Frontend → Vercel
1. Push the `frontend` folder to a GitHub repo (or the whole `Nosy` folder, pointing Vercel's root directory setting at `frontend`)
2. Import the repo in Vercel, set root directory to `frontend`
3. Deploy, no build command needed, it's static files

### Backend → needs a real Node host
Vercel is built for serverless functions, not a long-running Express server like this one. For this phase, deploy the backend to a host that runs Node servers directly, **Render** or **Railway** are both free-tier friendly and simple:
1. Push the `backend` folder to GitHub
2. Connect it to Render/Railway, set the start command to `npm start`
3. Add your environment variables (`JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, demo user vars) in their dashboard, never in code
4. Once deployed, copy the live URL and update `frontend/js/config.js`'s `NOSY_API_BASE_URL` to point at it, then redeploy the frontend

### Supabase
1. Create a project at supabase.com
2. Go to SQL Editor → New query, paste in `backend/db/schema.sql`, run it
3. Copy your Project URL and `service_role` key (Settings → API) into the backend's `.env`

---

## 6. Security checklist (confirmed for this build)

- **No secrets in the repo**: `.env` is in `.gitignore`, only `.env.example` (with placeholder values) is committed. Double-check with `git status` before your first commit, `.env` should never show up as a tracked file.
- **Users only see their own data**: every briefing request goes through `requireAuth` middleware, which verifies the JWT before returning anything. The Supabase schema also has row-level security policies enabled on every table, so even a direct database connection can't see another user's rows.
- **Input validation**: the login route rejects missing/empty email or password before checking credentials. The briefing route rejects any `?fail=` value that isn't one of the three real data sources.
- **Nothing crashes on bad input or a failed data source**: every tool-level failure returns a friendly JSON message instead of a raw error or a dead server. The global error handler in `server.js` catches anything unexpected too.

## 7. Testing checklist (confirmed working)

Run `npm test` in `backend` any time you change something. It currently checks:
- Health check responds
- Empty login credentials are rejected
- Wrong password is rejected
- Correct demo login succeeds and returns a token
- Briefing endpoint refuses to respond without a valid token
- All five briefing sections are present in a successful response
- A simulated source failure returns the friendly fallback message
- An invalid `fail` value is rejected instead of silently ignored

---

## 8. What to build next (in order)

1. Wire up the real Strands + LiteLLM + OpenRouter agent (per the Build Guide), replacing the plain-JS Prioritization/Suggested Actions logic with the AI-driven version, or layering the AI on top of this same data
2. Connect live Gmail, Calendar, and Slack (Sprint 2 in the PRD), including the DM scopes
3. Add briefing history writes to the `briefings` Supabase table (Sprint 3)
4. Fill in the VIP sender list once you've seen a few real runs
