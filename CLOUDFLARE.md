# Cloudflare Pages + Functions (production)

Deployment is **Cloudflare Pages only** (static `build/` + `functions/`). Local development still uses **Express** (`npm run dev`).

## Moving to a new Cloudflare account (or new domain)

1. **Log in** with the new account: `npx wrangler login`.
2. **Create a Pages project** in the dashboard (Workers & Pages → Create → Connect to Git) **or** deploy once with `npm run pages:deploy` and follow the prompts.
3. **`wrangler.toml`:** set `name = "your-project-slug"` to match the Pages project name (used by `pages:secrets:push` / CLI deploy).
4. **Custom domain:** Pages project → **Custom domains** → add your domain. Point DNS at Cloudflare (nameservers or CNAME) in **this** account so the zone matches.
5. **Secrets & variables:** Production (and Preview if needed) — copy from the old project or from `.dev.vars` via `npm run pages:secrets:push`. See **Deploy** below and `backend/.env.example` (Cloudflare section).
6. **CORS:** If you use `CORS_ORIGINS`, include the new production URL (and preview hosts if you use previews).
7. **Build settings:** Build command `npm run build:pages`, output directory `build`, root = repo root.
8. **Cutover:** When the new site checks out, remove or pause the old Pages project to avoid confusion.
9. **Repo metadata:** Update canonical URLs in `public/index.html` (Open Graph / Twitter / JSON-LD) if the public domain changed.

## Node vs Cloudflare (reference)

| Area | Node (`server.js` + `backend/`, local) | Cloudflare |
|------|----------------------------------------|------------|
| **Runtime** | Long-lived Express | Per-request Workers (Pages Functions) |
| **Static SPA** | Express serves `build/` in some setups | Pages CDN serves `build/` + `_redirects` for SPA |
| **Email** | Nodemailer → Zoho **SMTP** | **ZeptoMail HTTPS API** (`api.zeptomail.com`) |
| **Secrets** | `.env` | Pages **Settings → Variables and Secrets** |
| **Firestore Admin** | `firebase-admin` SDK | **Firestore REST** + service account JWT (`jose`) |
| **Staff auth** | `admin.auth().verifyIdToken` | **JWT verify** (Google JWKS) + Firestore `users/{uid}` |
| **Multipart uploads** | Multer | `request.formData()` |
| **CORS** | `cors` package | `_middleware.ts` + per-response headers |

## ZeptoMail vs Zoho Mail SMTP

- You need a [ZeptoMail](https://www.zoho.com/zeptomail/) agent, verified sender domain, and **Send Mail Token** → `ZEPTOMAIL_TOKEN`.
- ZeptoMail’s docs position it for **transactional** mail; **high-volume marketing** may need a different product (e.g. Zoho Campaigns). The newsletter route is still implemented; use within Zoho’s terms.

## Local development

- **UI + API together:** `npm run dev` (Express + CRA).
- **Simulate Pages + Functions:** `npm run pages:dev` (runs `build:pages` then Wrangler serves `build/` + `functions/`). For local secrets, copy `.dev.vars.example` to `.dev.vars` in the repo root.

## Deploy

1. Create a [Cloudflare Pages](https://pages.cloudflare.com/) project (connect Git or upload).
2. **Build command:** `npm run build:pages` (sets `REACT_APP_API_RELATIVE=1` so the SPA calls `/api` on the same origin).
3. **Build output directory:** `build`
4. **Root directory:** repo root (or set in the dashboard).
5. Add **environment variables** (Production + Preview): Firebase fields for the worker (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`), **`ZEPTOMAIL_TOKEN`**, Zoho **From** addresses (`ZOHO_*_USER`), notify/BCC vars, and optional `CORS_ORIGINS`. See `backend/.env.example` (Cloudflare section).
6. Or use CLI: `npm run pages:deploy` (requires `wrangler login`).

### `.dev.vars` vs production (why test email says `ZOHO_ORDERS_USER is not configured`)

- **`.dev.vars`** is loaded only when you run **`npm run pages:dev`**. It is **not** sent to Cloudflare when you **`pages:deploy`**.
- The live site only sees variables you set in the **dashboard** (Pages → your project → **Settings → Variables and Secrets**) or via **Wrangler secrets** below.
- Errors like **`ZOHO_ORDERS_USER is not configured`** on `*.pages.dev` mean that key is **missing in Production** for that project—not that ZeptoMail is wrong. Set at least `ZOHO_ORDERS_USER` (and `ZEPTOMAIL_TOKEN`, Firebase fields, etc.) in Production.

### Push local `.dev.vars` to Pages (same keys as `pages:dev`)

Wrangler can bulk-upload a **`.dev.vars`** file (`KEY=value` lines, `#` comments allowed) into the **Pages project’s secrets**.

```bash
npx wrangler login
npm run pages:secrets:push
```

This runs **`wrangler pages secret bulk .dev.vars`**. Requirements:

- A real **`.dev.vars`** at the **repo root** (copy from `.dev.vars.example`; keep it **gitignored**).
- The **`name`** in **`wrangler.toml`** must match your **Cloudflare Pages project name**. If Wrangler asks for a project, run explicitly:  
  `wrangler pages secret bulk .dev.vars --project-name your-project-slug`

List what Cloudflare has stored:

```bash
npm run pages:secrets:list
```

**Non-secrets** you are happy to commit: optional **`[vars]`** in **`wrangler.toml`**. Do **not** put tokens or private keys there.

**Preview deployments:** Production vs Preview variables are managed in the dashboard; if preview builds need the API too, add the same keys under **Preview**.

## Repo layout (Cloudflare-related)

- `wrangler.toml` — Pages output dir + compatibility date
- `functions/` — API implementation
- `public/_redirects` — SPA fallback on Pages

## Export exact Firestore schema (recommended before final rules lock-down)

Use the included schema dumper (Admin SDK) to inventory **real** collections + subcollections + sampled field types from your live project:

```bash
npm run firestore:schema:dump
```

Optional tuning:

```bash
node scripts/dump-firestore-schema.js --output=firestore-schema.prod.json --sample=50 --depth=4 --shapeDepth=3
```

The script auto-loads `.env` and `backend/.env` for Firebase Admin credentials and writes a JSON snapshot. Use that output to drive a strict allowlist in `firestore.rules` without guessing collection structure.
