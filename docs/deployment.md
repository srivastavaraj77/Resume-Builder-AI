# Deployment Guide

## 1) Prepare secrets and database
1. Create a MongoDB Atlas cluster.
2. Create a database user and allow access from your hosting provider IPs (or `0.0.0.0/0` for quick start).
3. Copy your connection string as `MONGODB_URI`.
4. Generate a strong JWT secret for `JWT_SECRET`.
5. Keep `GEMINI_API_KEY` ready if you want AI features enabled.

## 2) Backend deployment (Render)
This repo includes `render.yaml` for Blueprint deployment.

Required environment variables on backend service:
- `NODE_ENV=production`
- `PORT=3000`
- `MONGODB_URI=<atlas-uri>`
- `JWT_SECRET=<long-random-secret>`
- `GEMINI_API_KEY=<gemini-api-key>`
- `GEMINI_MODEL=gemini-2.5-flash`
- `CORS_ORIGINS=<comma-separated-frontend-origins>`

After deploy, verify:
- `GET /healthz` returns `{ ok: true, ... }`

## 3) Frontend deployment (Vercel or Render Static Site)
Set:
- `VITE_API_BASE_URL=https://<your-backend-domain>`

Then run the frontend build and deploy.

## 4) Local full stack with Docker (API + MongoDB)
From repo root:

```bash
docker compose up -d
```

This starts:
- MongoDB on `localhost:27017`
- API on `localhost:3000`

Run frontend locally:

```bash
cd client
npm ci
npm run dev
```

## 5) Production checklist
1. Rotate any keys that were ever committed in `.env`.
2. Confirm CORS contains only trusted frontend domains.
3. Confirm backend health endpoint is green.
4. Test register/login/resume CRUD/ATS flow on deployed URLs.
