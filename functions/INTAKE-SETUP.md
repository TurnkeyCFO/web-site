# Turnkey Web Intake Form — Auto-Submit Setup

The intake form at `turnkeyweb.org/intakeform` now **auto-submits**. On submit it:

1. Uploads any brand files to **OneDrive** (`ricky@turnkeycfo.com` › `Turnkey Web Intake/<date> <Business>/`)
2. **Emails** the full submission to **rickyW@turnkeyweb.org** (Reply-To = the prospect)
3. Redirects the visitor to `questionnaire-thanks.html`

No more copy/paste. The old manual-send overlay still exists, but only appears
as a **fallback** if the auto-submit fails — so a lead is never lost.

The backend is a Cloudflare Pages Function: `functions/api/intake.js`. It deploys
with the same `git push` as the site — no separate server.

---

## What still needs to be done (one-time, ~15 min) — Ricky

This reuses the **existing** Azure app — the one the Financial Cents scraper
already uses (credentials in the workspace `.env`: `AZURE_TENANT_ID`,
`AZURE_APPLICATION_ID`, `AZURE_CLIENT_SECRET_VALUE`). No new app registration.

### 1. Add two permissions to the existing app

Azure Portal → **Microsoft Entra ID** → **App registrations** → open the
existing Turnkey CFO app (its client id matches `AZURE_APPLICATION_ID` in `.env`).

**API permissions** → **Add a permission** → **Microsoft Graph** →
**Application permissions** → add both (it already has `Mail.Read`):

- `Files.ReadWrite.All`  — upload files to OneDrive
- `Mail.Send`            — send the submission email

Then click **Grant admin consent for <tenant>**. All rows must show a green check.

> `Files.ReadWrite.All` is the only Graph option that can write to a OneDrive
> folder — Graph has no per-folder scope for personal OneDrive. `Mail.Send` lets
> the app send mail as the `INTAKE_EMAIL_FROM` mailbox.

### 2. Client secret — reuse the existing one

No new secret needed. The value already in `.env` as `AZURE_CLIENT_SECRET_VALUE`
is the one to use. (Only if it's near expiry: App → **Certificates & secrets** →
**New client secret**, then update `.env` and step 3 with the new value.)

### 3. Add the environment variables to Cloudflare Pages

Cloudflare dashboard → **Workers & Pages** → the `web-site` Pages project →
**Settings** → **Variables and Secrets** → add for **Production** (and Preview).
The three `AZURE_*` values are copied verbatim from the workspace `.env`:

| Name | Value | Type |
|---|---|---|
| `AZURE_TENANT_ID` | from `.env` | Text |
| `AZURE_APPLICATION_ID` | from `.env` | Text |
| `AZURE_CLIENT_SECRET_VALUE` | from `.env` | **Secret** |
| `ONEDRIVE_USER` | `ricky@turnkeycfo.com` | Text |
| `INTAKE_EMAIL_FROM` | `ricky@turnkeycfo.com` | Text |
| `INTAKE_EMAIL_TO` | `rickyW@turnkeyweb.org` | Text |

`ONEDRIVE_USER` is whose OneDrive holds the files. `INTAKE_EMAIL_FROM` is the
mailbox the email is sent *as* (must be a real mailbox in the turnkeycfo.com
tenant). `INTAKE_EMAIL_TO` is where it lands.

### 4. Confirm the Functions directory location

Cloudflare picks up `functions/` from the **root directory of the Pages project**.
This repo's build settings should be:

- **Root directory:** `/` (repo root) — the default
- **Build output directory:** `docs`
- **Build command:** `exit 0` (or blank)

With those settings, `functions/api/intake.js` (where it is now) is correct.

> If the project's **Root directory** is set to `docs` instead, move the
> `functions/` folder to `docs/functions/`. Check it under Pages → Settings →
> Builds & deployments.

### 5. Deploy and test

A `git push` of this repo triggers the Cloudflare build. Then:

1. Open `turnkeyweb.org/intakeform`, pick a package, fill it out, attach a small
   test file, submit.
2. Expect: button shows "Submitting…", then it redirects to the thank-you page.
3. Check `rickyW@turnkeyweb.org` for the submission email.
4. Check `ricky@turnkeycfo.com` OneDrive → `Turnkey Web Intake/` for the file.

If auto-submit fails (e.g. env vars missing), the form shows the fallback
overlay with manual email options — the visitor still gets through.

---

## How it works

| Piece | Where |
|---|---|
| Form | `docs/intakeform/index.html` — file upload is in Section 1, visible on all 3 plans |
| Backend | `functions/api/intake.js` → live at `/api/intake` |
| File storage | OneDrive of `ONEDRIVE_USER` › `Turnkey Web Intake/<Business> - <Industry>/<YYYY-MM-DD>/` |
| Email | Graph `sendMail`, `INTAKE_EMAIL_FROM` → `INTAKE_EMAIL_TO` |
| Secondary log | Existing Google Apps Script webhook still fires (Slack ping + Sheet row) |

### OneDrive folder layout

Every submission with files lands in a 3-level tree inside `ONEDRIVE_USER`'s OneDrive:

```
Turnkey Web Intake/
  Acme Plumbing - Home Services/     <- one custom folder per client (name + industry)
    2026-05-18/                      <- one folder per submission (date, CT)
      logo.png
      brand-guide.pdf
```

The base folder and the per-client folder are reused if a client submits again;
the dated folder is always fresh (a same-day re-submit gets `2026-05-18 1`).
Submissions with no files create no folder — they are email-only.

The Apps Script webhook is left in place on purpose: it still posts the instant
Slack ping and logs the Sheet row, so even if the email path has a hiccup the
lead is visible. The Function is the new primary path; the GAS webhook is backup
telemetry.

## Changing things later

- **Different recipient** → edit `INTAKE_EMAIL_TO` in Cloudflare (no code change).
- **Different OneDrive owner / folder** → edit `ONEDRIVE_USER`; the base folder
  name `Turnkey Web Intake` is in `functions/api/intake.js` (`ensureFolders`).
- **File size cap** → client check is 10 MB in `docs/intakeform/index.html`;
  server guard is `MAX_FILE_BYTES` in `intake.js`.
