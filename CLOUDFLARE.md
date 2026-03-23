# Cloudflare Pages + Functions migration

## Diagnosis (what changed vs Node/Express)

| Area | Node (`server.js` + `backend/`) | Cloudflare |
|------|-----------------------------------|------------|
| **Runtime** | Long-lived Express on a VM/PaaS | Per-request Workers (Pages Functions) |
| **Static SPA** | Express serves `build/` | Pages CDN serves `build/` + `_redirects` for SPA |
| **Email** | Nodemailer → Zoho **SMTP** (blocked on Render free) | **ZeptoMail HTTPS API** (`api.zeptomail.com`) — still Zoho, port 443 |
| **Secrets** | `.env` / host env | Pages **Settings → Environment variables** (and Secrets for tokens) |
| **Firestore Admin** | `firebase-admin` SDK | **Firestore REST** + OAuth2 (service account JWT via `jose`) |
| **Staff auth** | `admin.auth().verifyIdToken` | **JWT verify** against Google JWKS (`jose`) + Firestore `users/{uid}` read |
| **Multipart uploads** | Multer | `request.formData()` |
| **CORS** | `cors` package | `_middleware.ts` + per-response headers |

## ZeptoMail vs Zoho Mail SMTP

- You need a [ZeptoMail](https://www.zoho.com/zeptomail/) agent, verified sender domain, and **Send Mail Token** → `ZEPTOMAIL_TOKEN`.
- ZeptoMail’s docs position it for **transactional** mail; **high-volume marketing** may need a different product (e.g. Zoho Campaigns). The newsletter route is still implemented; use within Zoho’s terms.

## Local development

- **UI + API together:** `npm run dev` (Express + CRA) — unchanged.
- **Simulate Pages + Functions:** `npm run pages:dev` (runs `build:pages` then Wrangler serves `build/` + `functions/`). For local secrets, copy `.dev.vars.example` to `.dev.vars` in the repo root.

## Deploy

1. Create a [Cloudflare Pages](https://pages.cloudflare.com/) project (connect Git or upload).
2. **Build command:** `npm run build:pages` (sets `REACT_APP_API_RELATIVE=1` so the SPA calls `/api` on the same origin).
3. **Build output directory:** `build`
4. **Root directory:** repo root (or set in dashboard).
5. Add **environment variables** (Production + Preview): Firebase service-account fields used by the worker (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`), **`ZEPTOMAIL_TOKEN`**, Zoho **From** addresses (`ZOHO_*_USER`), notify/BCC vars, and optional `CORS_ORIGINS`. See `backend/.env.example` (Cloudflare section).
6. Or use CLI: `npm run pages:deploy` (requires `wrangler login`).

## Files added

- `wrangler.toml` — Pages output dir + compatibility date
- `functions/` — API implementation
- `public/_redirects` — SPA fallback on Pages

Express + `Dockerfile` / `fly.toml` remain for optional non-Cloudflare deploys.
