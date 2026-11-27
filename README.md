# Gemstone Certificate & QR Verification System

A web app for a gemstone laboratory. It covers three jobs:

- **Staff** create a gemstone record with a photo and the measured properties, publish it to issue a permanent
  certificate number and QR code, and print a branded card or an A4 report.
- **Customers** scan the QR code with any phone and see that stone's live certificate status: **Verified**,
  **Voided**, **Superseded** or **Not found**.
- **Public verification works with the lab PC switched off**, but only once the app is deployed to a hosting provider.

> **Important:** The software records what the laboratory enters. It does not identify or assess stones, and nothing
> is marked "natural" or "genuine" unless your staff enter it.

---

## Contents

1. [Features](#features)
2. [Tech stack](#tech-stack)
3. [Local setup (Windows PowerShell)](#local-setup-windows-powershell)
4. [Everyday commands](#everyday-commands)
5. [Testing QR codes with a phone before deployment](#testing-qr-codes-with-a-phone-before-deployment)
6. [Deployment (free / low-cost)](#deployment-free--low-cost)
7. [Backups, restore & export](#backups-restore--export)
8. [Ongoing costs](#ongoing-costs)
9. [Walkthrough: create → publish → print → scan → void](#walkthrough)
10. [Security notes](#security-notes)
11. [Project structure](#project-structure)

---

## Features

| Area | What it does |
| --- | --- |
| Roles | **Admin**: everything, including publishing, voiding, settings, users and export. **Operator**: create and edit drafts, upload photos, preview, print. **Public**: verify only. |
| Certificates | Draft → **Publish** issues a number in the form `SLN-2026-000001`. The number is allocated inside the publish transaction, so it is concurrency-safe and never reused. |
| Immutability | Issued certificates cannot be edited, deleted or un-voided. The app enforces this, and so do **database triggers**. Corrections go through **Create revision**: the revision gets a new number when published, and the original shows "Superseded → new number". |
| QR | An absolute URL taken from the configured public base URL, e.g. `https://verify.yourlab.com/v/SLN-2026-000001`. It is frozen at publish time, so reprints always produce the same QR. Publishing is **refused** in production if the URL is `http`, `localhost` or a private IP. |
| Printing | A card with **configurable size** (default 85.6 × 54 mm ID card, printed front and back) or an **A4** report. Each certificate can store a preferred format, and you can switch at print time. PDF: Print → *Save as PDF*. Every reprint is logged. |
| Public page | Mobile-first `/v/<number>` with a clear status banner, photo, properties, lab details and issue date, plus a manual lookup on `/`. |
| Audit | Append-only audit log covering create, edit (field diffs), publish, void, supersede, duplicate, print, login, settings and users. History is shown on each certificate. |
| Uploads | JPEG, PNG or WebP only, **checked by file content**, size-capped and re-encoded. Re-encoding strips EXIF/GPS data. Files get random object keys. Draft photos are never served publicly. |

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · PostgreSQL + Prisma 7 · Zod · bcrypt · `qrcode` · sharp ·
S3-compatible storage (Cloudflare R2 recommended; local folder for development) · Vitest.

**Deviations from the original brief:**

- **PDF output** comes from a millimetre-exact HTML print stylesheet (`@page` size equals the card or A4 size). You get
  a PDF with the browser's *Save as PDF*. A separate server-side PDF engine would mean maintaining a second copy of
  the card design.
- **Rendering**: Next.js "Cache Components" is disabled. Every page shows live data, so a void is visible the moment
  it happens.
- **Rate limiting** is in-memory. That's correct for a single always-on instance, which is the recommended
  deployment. Swap in Redis if you ever run several instances.

---

## Local setup (Windows PowerShell)

Prerequisites:

- Node.js **20.19+** (22 or 24 LTS recommended)
- PostgreSQL 15+ (this PC has PostgreSQL 18 installed as a Windows service)
- Git

Run these commands from the project folder in the VS Code terminal (PowerShell).

```powershell
# 1. Install dependencies (this also generates the Prisma client)
npm install

# 2. Make the PostgreSQL tools available in this terminal
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"

# 3. Create the app database and a separate test database
#    (asks for the password of the "postgres" user)
createdb -U postgres -h localhost gemcert
createdb -U postgres -h localhost gemcert_test

# 4. Create your .env (skip if it already exists) and edit it
Copy-Item .env.example .env -ErrorAction SilentlyContinue
code .env
#    - In DATABASE_URL and TEST_DATABASE_URL, replace YOUR_PASSWORD with the postgres password.
#      URL-encode special characters: @ -> %40, # -> %23, : -> %3A, / -> %2F
#    - Set ADMIN_EMAIL, ADMIN_NAME and ADMIN_PASSWORD (12+ characters)

# 5. Create the tables (applies prisma/migrations)
npm run db:deploy

# 6. Create the first administrator from the ADMIN_* values, then delete ADMIN_PASSWORD from .env
npm run admin:bootstrap

# 7. (Optional) Add 3 clearly labelled DEMO certificates
npm run db:seed-demo

# 8. Start the app
npm run dev
```

Open <http://localhost:3000/login> and sign in.

Then go to **Lab settings** and enter your lab name, logo, colours, contact details and card size.

**Forgot the admin password?** Put a new `ADMIN_PASSWORD` in `.env` and run:

```powershell
npm run admin:bootstrap -- --reset-password
```

## Everyday commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run check` | Lint, typecheck, tests and production build (run before deploying) |
| `npm test` | Unit and integration tests. DB tests use `TEST_DATABASE_URL`; skip them with `$env:SKIP_DB_TESTS='1'` |
| `npm run db:migrate` | After changing `prisma/schema.prisma`: creates a new migration (development only) |
| `npm run db:deploy` | Applies pending migrations (local and production) |
| `npm run db:studio` | Browse the database in a GUI |
| `npm run db:seed-demo -- --remove` | Removes DEMO certificates |

## Testing QR codes with a phone before deployment

`localhost` only exists on this PC, so a phone cannot open a QR that points to `http://localhost:3000`. The admin
screens show a warning about this. To test with a phone on the **same Wi-Fi**:

```powershell
ipconfig   # note the IPv4 address, e.g. 192.168.1.20
```

1. In `.env`, set `PUBLIC_BASE_URL="http://192.168.1.20:3000"`. Alternatively, set the same value in Lab settings.
2. Run `npm run dev -- -H 0.0.0.0` and allow Node.js through Windows Firewall when prompted.
3. Publish a **new** certificate. QR URLs are frozen at publish time, so older certificates keep their old URL.

This is still local-only. **Customers can only verify once the app is deployed to a public `https://` address.**

---

## Deployment (free / low-cost)

Recommended setup: **Render** (web app) + **Neon** (PostgreSQL) + **Cloudflare R2** (images) + your own domain.

### 1. Database: Neon

1. Create a project at <https://neon.tech> in the region closest to your customers.
2. Copy the connection string. It looks like
   `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`.

### 2. Image storage: Cloudflare R2

1. Cloudflare dashboard → R2 → **Create bucket**, e.g. `gemcert-images`. Keep it **private**.
2. R2 → **Manage API tokens** → create a token with *Object Read & Write* on that bucket. Note the Access Key ID,
   the Secret Access Key, and the S3 endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.

### 3. Web app: Render

1. Push this project to a private GitHub repository:

   ```powershell
   git add -A
   git commit -m "Initial version"
   git remote add origin https://github.com/<you>/gemcert.git
   git push -u origin main
   ```

2. In Render, choose **New → Blueprint** and select the repository. `render.yaml` is picked up automatically.
3. Fill in the environment variables:
   - `DATABASE_URL`: the Neon connection string
   - `PUBLIC_BASE_URL`: e.g. `https://verify.yourlab.com`. Use the `https://gemcert.onrender.com` URL until your
     domain is ready.
   - `S3_*`: the R2 values from step 2
4. Deploy. The build runs `prisma migrate deploy` automatically.
5. Create the first admin. Locally, set `DATABASE_URL` to the **Neon** URL plus the `ADMIN_*` values, then:

   ```powershell
   $env:DATABASE_URL="postgresql://...neon..."; $env:ADMIN_EMAIL="you@lab.com"; $env:ADMIN_NAME="Your Name"; $env:ADMIN_PASSWORD="a-long-unique-password"
   npm run admin:bootstrap
   Remove-Item Env:ADMIN_PASSWORD
   ```

### 4. Custom domain

1. Render → Settings → **Custom Domains** → add `verify.yourlab.com`.
2. At your domain registrar, create the CNAME record that Render shows. HTTPS is issued automatically.
3. Set `PUBLIC_BASE_URL`, or the value in **Lab settings**, to `https://verify.yourlab.com` **before publishing real
   certificates**. Printed QR codes keep the URL they were published with, so choose a domain you will keep.

### Free vs. always-on

On Render's **free** plan the app sleeps after about 15 minutes without visits. The next QR scan then waits roughly
30–60 seconds while it wakes up. It still works, just slowly. For a business, the **Starter** plan (about $7/month)
keeps it always on.

### Acceptance check after deployment

1. Shut down the lab PC.
2. Scan a printed QR code using mobile data, not lab Wi-Fi.
3. The certificate page loads. That proves verification does not depend on the lab PC.

---

## Backups, restore & export

**Database (most important).** Neon keeps a short point-in-time restore window. Also take your own copies,
e.g. weekly:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
New-Item -ItemType Directory -Force backups | Out-Null
# Use the connection string WITHOUT "?schema=public" (pg_dump does not accept it)
pg_dump --format=custom --no-owner --file "backups\gemcert-$(Get-Date -Format yyyy-MM-dd).dump" "postgresql://USER:PASS@HOST/DB?sslmode=require"
```

To restore into an **empty** database (e.g. a new Neon branch):

```powershell
pg_restore --no-owner --clean --if-exists --dbname "postgresql://USER:PASS@HOST/NEWDB?sslmode=require" "backups\gemcert-2026-10-22.dump"
```

Store backups off the PC as well, e.g. on OneDrive or Google Drive.

**Images.** R2 is durable storage, but also copy the bucket periodically, e.g. with `rclone sync r2:gemcert-images
D:\gemcert-images`. Images are never overwritten in place: every upload gets a new random key.

**Export.** In **Lab settings**, *Export all data (JSON)* downloads every certificate, the audit log, users without
password hashes, and settings. This is a readable archive, not a substitute for `pg_dump`.

**Recovery test.** Every few months, restore a backup into a temporary database and open the app against it.

## Ongoing costs

Approximate prices as of 2026. Check each provider's pricing page.

| Item | Free option | Recommended |
| --- | --- | --- |
| Web hosting (Render) | Free (sleeps when idle) | Starter, about **$7/month**, always on |
| PostgreSQL (Neon) | Free tier (0.5 GB, plenty for tens of thousands of certificates) | Paid plan if you outgrow it or want longer restore history |
| Image storage (Cloudflare R2) | Free up to **10 GB** (about 30,000+ photos), no download fees | About $0.015 per GB-month beyond that |
| Domain name | — | About **$10–20/year** |
| Card printer & blank cards | — | One-off hardware cost |

**Typical total:** about $0 to start, about **$8–10/month** for a reliable always-on setup.

---

## Walkthrough

1. **Sign in** at `/login` as the admin.
2. Open **Lab settings**:
   - Enter the lab name and contact details, and upload the logo.
   - Set the colours and the card size (85.6 × 54 by default).
   - Check the **Public base URL**. Locally, a yellow banner explains that localhost QR codes only work on this PC.
3. **New certificate**:
   - Enter the specimen name, weight (ct) and measured properties.
   - Upload the photo and click **Save draft**.
   - Invalid input is rejected with field messages, e.g. an empty name, weight ≤ 0, or a PDF or text file instead of a
     photo.
4. Review the **card and A4 previews** on the certificate page. Drafts show a "DRAFT – NOT VALID" watermark and no QR.
5. Click **Publish & issue number**. This assigns `SLN-YYYY-000001` and creates a QR for
   `<public base URL>/v/SLN-YYYY-000001`.
6. Click **Print / PDF**, choose **Card** or **A4**, then **Print**:
   - Set Margins = None and Scale = 100%.
   - Choose *Save as PDF* to get a PDF.
   - Printing is recorded in the certificate history.
7. **Scan the QR** with a phone. After deployment, any phone works; locally, see the LAN steps above. The page shows
   **VERIFIED** with the photo and properties. No login is needed.
8. Back in the admin area, click **Void certificate…** and enter a reason.
9. **Scan again**. The same QR now shows a red **VOIDED** banner. The reason stays internal.
10. Optionally, use **Create revision** on a published certificate. After publishing, the old QR shows
    **SUPERSEDED → see new number**.

## Security notes

**Authentication**

- Passwords are hashed with bcrypt (cost 12).
- Sessions are random 256-bit tokens. Only their SHA-256 hash is stored.
- The session cookie is HTTP-only and `SameSite=Lax`. In production it is `Secure` and uses the `__Host-` prefix.
- Logout and deactivation revoke sessions on the server.
- Login is rate-limited per IP and per account, and gives the same response for unknown emails and wrong passwords.

**Authorisation and request safety**

- Every page, server action and API route checks the session and role on the server. The proxy only redirects early.
- Server actions only accept POST and have Next.js origin checks against CSRF.
- Security headers are set: `nosniff`, `X-Frame-Options: DENY`, and a referrer policy.

**What the public can see**

- Public responses are built from an explicit allow-list (`toPublicCertificate`).
- They never include internal IDs, internal notes, void reasons, creator or storage keys.
- Drafts are indistinguishable from unknown numbers.
- Public lookups and image requests are rate-limited.

**Data integrity**

- Database constraints and triggers make issued certificates immutable and undeletable, and the audit log append-only.

**Secrets**

- Secrets come only from environment variables. There is no default admin password.

## Project structure

```
prisma/                 schema.prisma + migrations (incl. integrity triggers)
scripts/                bootstrap-admin.ts, seed-demo.ts
src/proxy.ts            optimistic redirect for /admin and /print
src/lib/
  auth/                 password hashing, DB sessions, permissions table, data-access helpers
  certificates/         service (create/edit/publish/void/revise), number allocation, public DTO, queries
  storage/              local + S3/R2 adapters, image validation/re-encoding
  validation/           Zod schemas shared by browser and server
  verify-url.ts         public base URL rules for QR codes
src/app/
  admin/…               dashboard, list, form, detail, settings, users, account
  print/[id]            print/PDF view (card or A4)
  v/[number]            public verification page
  api/…                 images, QR download, export, health
src/components/
  certificate/          card front/back + A4 designs (shared by preview and print)
  public/               public page layout and verification view (restyle here)
tests/                  unit + database integration tests
```
