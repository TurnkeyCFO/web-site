# Turnkey Web Intake Form — Auto-Submit Setup

The intake form at `turnkeyweb.org/intakeform` is a **one-click auto-submit**.
The visitor clicks Submit once and lands on the thank-you page. Behind that, on
submit the backend:

1. Posts the **full submission detail** to the **#leads** Slack channel
2. Uploads any brand files to **OneDrive** (`ricky@turnkeycfo.com` › `Turnkey Web Intake/<Business> - <Industry>/<date>/`)
3. **Emails** the full submission to **rickyW@turnkeyweb.org** (Reply-To = the prospect)

No copy/paste, no manual step — the visitor always goes straight to
`questionnaire-thanks.html` once the request settles.

The backend is a Cloudflare Pages Function: `docs/functions/api/intake.js`. It
deploys with the same `git push` as the site — no separate server.

---

## Setup — Ricky

This reuses the **existing** Azure app — the one the Financial Cents scraper
already uses (credentials in the workspace `.env`: `AZURE_TENANT_ID`,
`AZURE_APPLICATION_ID`, `AZURE_CLIENT_SECRET_VALUE`). No new app registration.

> **Steps 1–2 (Azure) are already done** — the "TurnkeyCFO Agent" app has
> `Files.ReadWrite.All` + `Mail.Send` granted and admin-consented. The only
> thing left is **Step 3 — the Cloudflare environment variables.**

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
| `SLACK_BOT_TOKEN` | from `.env` | **Secret** |
| `SLACK_CHANNEL_LEADS` | `C0AREP6F46N` | Text |

`ONEDRIVE_USER` is whose OneDrive holds the files. `INTAKE_EMAIL_FROM` is the
mailbox the email is sent *as* (must be a real mailbox in the turnkeycfo.com
tenant). `INTAKE_EMAIL_TO` is where it lands. `SLACK_BOT_TOKEN` +
`SLACK_CHANNEL_LEADS` drive the ping to the **#leads** channel (`C0AREP6F46N`) —
if either is omitted the Slack step is silently skipped (files + email still run).

### 4. Functions directory — already correct (no action)

The `web-site` Pages project is configured with **Root directory: `docs`**
(confirmed via the Cloudflare API). Cloudflare compiles Functions from inside
`docs/`, so the endpoint lives at **`docs/functions/api/intake.js`** and routes
to **`/api/intake`**. It is already in the right place — nothing to do here.

### 5. Deploy and test

A `git push` of this repo triggers the Cloudflare build. Then:

1. Open `turnkeyweb.org/intakeform`, pick a package, fill it out, attach a small
   test file, submit.
2. Expect: button shows "Submitting…", then it redirects to the thank-you page.
3. Check the **#leads** Slack channel for the full-detail card.
4. Check `rickyW@turnkeyweb.org` for the submission email.
5. Check `ricky@turnkeycfo.com` OneDrive → `Turnkey Web Intake/` for the file.

The visitor always reaches the thank-you page. The #leads card posts first and
needs only the two Slack vars — so even before the Graph env vars are set, you
still get the lead in Slack; only the OneDrive + email steps wait on that config.

---

## How it works

| Piece | Where |
|---|---|
| Form | `docs/intakeform/index.html` — file upload is in Section 1, visible on all 3 plans |
| Backend | `docs/functions/api/intake.js` → live at `/api/intake` |
| File storage | OneDrive of `ONEDRIVE_USER` › `Turnkey Web Intake/<Business> - <Industry>/<YYYY-MM-DD>/` |
| Email | Graph `sendMail`, `INTAKE_EMAIL_FROM` → `INTAKE_EMAIL_TO` |
| Slack | `chat.postMessage` to #leads (`SLACK_CHANNEL_LEADS`) on every submission |
| Secondary log | Google Apps Script webhook still fires for the Sheet row (its Slack ping is disabled) |

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

The Apps Script webhook is left in place for the Sheet-row log only — its Slack
ping is disabled (`_slackNotify: false` in the form) so it does not duplicate the
Function's #leads post. The Function is the primary path (OneDrive + Slack +
email); the GAS webhook is backup telemetry (the spreadsheet record).

## Changing things later

- **Different recipient** → edit `INTAKE_EMAIL_TO` in Cloudflare (no code change).
- **Different OneDrive owner / folder** → edit `ONEDRIVE_USER`; the base folder
  name `Turnkey Web Intake` is in `docs/functions/api/intake.js` (`ensureFolders`).
- **File size cap** → client check is 10 MB in `docs/intakeform/index.html`;
  server guard is `MAX_FILE_BYTES` in `docs/functions/api/intake.js`.
- **Slack message detail** → `postSlack()` in `docs/functions/api/intake.js`
  builds one block per form section from `SECTIONS` / `LABELS`.
