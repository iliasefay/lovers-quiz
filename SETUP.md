# Lovers Quiz - Backend Deployment Guide

This is the Socket.io server and web client for LoveLobby. Deploy this before building the mobile app.

---

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the web client.

---

## Deployment Options

### Option 1: Render (Recommended - Free Tier)

1. **Sign up at [render.com](https://render.com)**

2. **Create Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     ```
     Name: lovers-quiz
     Root Directory: lovers-quiz (if in monorepo)
     Environment: Node
     Build Command: npm install && npm run build
     Start Command: npm start
     ```

3. **Add Environment Variables**
   | Key | Value |
   |-----|-------|
   | NODE_ENV | production |
   | PORT | 3000 |
   | ALLOWED_ORIGIN | https://your-mobile-app-domain.com |
   | MAX_LOBBIES | 1000 |
   | LOBBY_TTL_MS | 1800000 |
   | DISCONNECT_TTL_MS | 300000 |

4. **Deploy**
   - Click "Create Web Service"
   - Note your URL: `https://lovers-quiz-xxxx.onrender.com`

### Option 2: Railway ($5/month)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

Add environment variables in Railway dashboard.

### Option 3: Fly.io (Free Tier)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login and deploy
fly auth login
fly launch
fly deploy
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 3000 |
| ALLOWED_ORIGIN | CORS allowed origin (mobile app URL) | * |
| MAX_LOBBIES | Max concurrent lobbies | 1000 |
| LOBBY_TTL_MS | Lobby timeout (30 min) | 1800000 |
| DISCONNECT_TTL_MS | Disconnect grace period (5 min) | 300000 |

---

## After Deployment

1. **Copy the production URL**
   - Example: `https://lovers-quiz-xxxx.onrender.com`

2. **Update LoveLobby mobile app**
   - Edit `src/services/socketService.ts`
   - Replace `https://your-production-server.com` with your URL

3. **Test the connection**
   - Open the web client in browser
   - Create a lobby
   - Test real-time features

---

## Architecture

```
lovers-quiz/
├── server.ts           # Custom HTTP server with Socket.io
├── server/
│   └── socketServer.ts # Socket.io event handlers
├── app/                # Next.js app (web client)
├── components/         # React components
├── contexts/           # React contexts
└── lib/                # Shared utilities
```

---

## Troubleshooting

### CORS Errors
- Set `ALLOWED_ORIGIN` to your mobile app's URL
- For testing: `ALLOWED_ORIGIN=*` (not recommended for production)

### Socket Connection Fails
- Check server logs for errors
- Verify WebSocket transport is enabled
- Test with web client first

### Render Free Tier Spin-Down
- First request after spin-down takes 30-60 seconds
- Consider Railway for always-on ($5/month)

---

## Monitoring

Check server health:
```bash
curl https://your-server.onrender.com
```

View logs:
- Render: Dashboard → Logs
- Railway: `railway logs`
- Fly.io: `fly logs`
