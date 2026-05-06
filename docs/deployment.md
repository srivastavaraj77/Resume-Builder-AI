# Deployment Guide (Render + Atlas)

## 1) Create MongoDB Atlas database
1. Create an Atlas cluster (Free/Flex/paid as needed).
2. Create a database user.
3. In Network Access, allow Render egress IPs or `0.0.0.0/0` for quick setup.
4. Copy the connection string for `MONGODB_URI`.

## 2) Deploy on Render using `render.yaml`
1. Push this repo to GitHub.
2. In Render, create a new Blueprint and select this repo.
3. Render will create:
- `resume-builder-api` (Node Web Service, `server`)
- `resume-builder-web` (Static Site, `client`)

Set these backend environment variables in Render:
- `MONGODB_URI`
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (default: `gemini-2.5-flash`)
- `CORS_ORIGINS` (set this after frontend URL is known)
- `FRONTEND_BASE_URL` (frontend public URL)
- `RAZORPAY_KEY_ID` (if payments enabled)
- `RAZORPAY_KEY_SECRET` (if payments enabled)
- `RAZORPAY_WEBHOOK_SECRET` (if payments enabled)
- `RAZORPAY_PRO_AMOUNT_PAISE` (if payments enabled)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_SECURE` (if email flows enabled)

Set this frontend environment variable in Render:
- `VITE_API_BASE_URL=https://<your-api-domain>.onrender.com`

After first deploy:
1. Copy frontend URL and set it in backend:
- `CORS_ORIGINS=https://<your-web-domain>.onrender.com`
- `FRONTEND_BASE_URL=https://<your-web-domain>.onrender.com`
2. Trigger backend redeploy.

## 3) Verify production health
1. Open `https://<your-api-domain>.onrender.com/healthz` and confirm `ok: true`.
2. Open frontend URL and test:
- register/login
- resume CRUD
- AI enhance/ATS endpoints
- payments/webhooks (if enabled)

## 4) Railway migration checklist
1. Point frontend `VITE_API_BASE_URL` to Render API.
2. Update backend `CORS_ORIGINS` with Render frontend URL.
3. Move all active secrets from Railway to Render.
4. Validate webhooks and callback URLs in external providers (Razorpay, email provider).
5. Only after successful smoke tests, disable Railway services.

## 5) Local full stack (for fallback testing)
From repo root:

```bash
docker compose up -d
```

Run frontend locally:

```bash
cd client
npm ci
npm run dev
```
