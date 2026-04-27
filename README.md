# FocusRaid

FocusRaid is a Telegram Mini App for team-based focus raids (25-minute sessions) with social pressure mechanics:
- team members join the same raid
- leaving early marks failure
- team score is calculated as `+10` per completed and `-5` per failed participant
- updates are real-time via WebSocket

## Stack

- Frontend: React + Vite + TypeScript + TailwindCSS + Telegram WebApp SDK
- Backend: Node.js + Express + TypeScript + SQLite (`better-sqlite3`)
- Real-time: `ws`

## Project Structure

```text
focusraid/
  client/
    src/
      components/
      pages/
      hooks/
      lib/
      main.tsx
      App.tsx
    index.html
    tailwind.config.js
    vite.config.ts
  server/
    src/
      routes/
      services/
      models/
      ws/
      index.ts
      db.ts
  package.json
  README.md
```

## Local Development

### 1) Prerequisites

- Node.js 18+ (recommended: latest LTS)
- npm

### 2) Install dependencies

From project root:

```bash
npm install
```

### 3) Configure backend env

```bash
cp server/.env.example server/.env
```

Set `TELEGRAM_BOT_TOKEN` in `server/.env` for strict Telegram initData validation.

If no bot token is set, `/auth` will still work in local mode (validation bypass) so you can test in browser.

### 4) Start app (client + server together)

```bash
npm run dev
```

This starts:
- server on `http://localhost:4000`
- client on `http://localhost:5173`

## API Endpoints

- `POST /auth` - create/get user from Telegram init data
- `POST /team/create` - create a team
- `POST /team/join` - join existing team
- `GET /team/:id` - get team + members
- `POST /session/start` - start 25-minute raid
- `POST /session/join` - join active raid
- `POST /session/leave` - leave early (failure)
- `POST /session/complete` - finalize raid and return score
- `GET /session/active/:teamId` - active session by team
- WebSocket: `/ws?teamId=<id>`

## Telegram Bot Connection

1. Create bot via [@BotFather](https://t.me/BotFather) and copy token.
2. Put token into `server/.env`:

   ```env
   TELEGRAM_BOT_TOKEN=123456:ABC...
   ```

3. Host client with HTTPS (Telegram requires HTTPS for Mini App in production).
4. In BotFather:
   - `/setmenubutton`
   - choose your bot
   - set Mini App URL to your hosted frontend URL
5. Also set allowed domain if needed using BotFather mini app settings.

In Telegram, open the bot menu button and launch FocusRaid.  
The app uses `window.Telegram.WebApp` through `@twa-dev/sdk`, calls `ready()` and `expand()`, and reads user from `initDataUnsafe`.

## Deployment (Simple)

### Option A: Single VM / VPS

1. Build both apps:
   ```bash
   npm run build
   ```
2. Serve `client/dist` through Nginx (HTTPS).
3. Run backend:
   ```bash
   npm run start --workspace server
   ```
4. Configure reverse proxy:
   - `/` -> static `client/dist`
   - `/auth`, `/team`, `/session`, `/ws` -> backend `localhost:4000`
5. Set `VITE_API_URL` and `VITE_WS_URL` for production frontend build if your API is on different origin.

### Option B: Split Hosting

- Deploy backend to Render/Railway/Fly.io
- Deploy frontend static build to Vercel/Netlify/Cloudflare Pages
- Set:
  - `VITE_API_URL=https://your-api-domain`
  - `VITE_WS_URL=wss://your-api-domain/ws`
- Rebuild frontend and update BotFather Mini App URL.

## Notes

- Team size max: 5 members.
- Team size min for raid start: 3 members.
- Session duration: 25 minutes.
- SQLite DB file is created automatically (`server/focusraid.db` by default).
