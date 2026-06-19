/**
 * Cloudflare Pages Function — Turnkey Web "Free Site" request handler
 * Route:  POST /api/free-site   (turnkeyweb.org/api/free-site)
 *
 * Frictionless landing-page form (no call, no meeting). On submit it:
 *   1. Posts the request to the #leads Slack channel (the guaranteed signal)
 *   2. Best-effort emails the request to INTAKE_EMAIL_TO via Microsoft Graph
 *      (never fails the request if Graph config is absent)
 *   3. Returns { ok: true }
 *
 * Reuses the SAME env vars already configured for /api/intake:
 *   SLACK_BOT_TOKEN, SLACK_CHANNEL_LEADS  (Slack ping)
 *   AZURE_TENANT_ID, AZURE_APPLICATION_ID, AZURE_CLIENT_SECRET_VALUE,
 *   INTAKE_EMAIL_FROM, INTAKE_EMAIL_TO    (optional email; best-effort)
 */

const GRAPH = "https://graph.microsoft.com/v1.0";

const FIELDS = [
  ["full_name", "Name"],
  ["business_name", "Business / Company"],
  ["email", "Email"],
  ["phone", "Phone"],
  ["business_type", "Industry / What They Do"],
  ["location", "Location"],
  ["services_offered", "Main Services / Products"],
  ["existing_website", "Current Website"],
  ["details", "Notes / Style Preferences"],
];

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const fields = await parseBody(request);

    // basic honeypot — bots fill hidden "company_url"; humans never see it
    if ((fields.company_url || "").trim()) return json({ ok: true });

    if (!(fields.full_name || "").trim() && !(fields.business_name || "").trim() && !(fields.email || "").trim()) {
      return json({ ok: false, error: "Please add your name, business, and email." }, 400);
    }

    let slackOk = false;
    try { slackOk = await postSlack(env, fields); } catch (e) { console.log("slack:", e); }

    // best-effort email — never blocks the response
    try { await sendEmail(env, fields); } catch (e) { console.log("email:", e); }

    // Slack is the capture of record. If it isn't configured, surface an error
    // so the page can show the fallback contact — never silently drop a lead.
    if (!slackOk && !(env.SLACK_BOT_TOKEN && env.SLACK_CHANNEL_LEADS)) {
      return json({ ok: false, error: "We couldn't submit that — please email hello@turnkeyweb.org." }, 502);
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String((err && err.message) || err) }, 502);
  }
}

export async function onRequest() {
  return new Response("POST only.", { status: 405, headers: { Allow: "POST" } });
}

async function parseBody(request) {
  const ct = (request.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/json")) {
    return await request.json().catch(() => ({}));
  }
  const fd = await request.formData();
  const o = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

async function postSlack(env, fields) {
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_LEADS) return false;
  const business = (fields.business_name || fields.full_name || "New lead").trim();
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });

  const lines = FIELDS
    .map(([k, label]) => {
      const v = (fields[k] || "").trim();
      return v ? `*${label}:* ${v.length > 800 ? v.slice(0, 800) + "…" : v}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const blocks = [
    { type: "header", text: { type: "plain_text", text: `🆓 Free Site Request — ${business}`.slice(0, 150) } },
    { type: "section", text: { type: "mrkdwn", text: lines || "(no details provided)" } },
    { type: "context", elements: [{ type: "mrkdwn", text: `Submitted ${ts} CT · turnkeyweb.org/free-website` }] },
  ];

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.SLACK_BOT_TOKEN, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ channel: env.SLACK_CHANNEL_LEADS, text: `Free site request — ${business}`, blocks }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error("chat.postMessage: " + (data.error || res.status));
  return true;
}

async function sendEmail(env, fields) {
  const need = ["AZURE_TENANT_ID", "AZURE_APPLICATION_ID", "AZURE_CLIENT_SECRET_VALUE", "INTAKE_EMAIL_FROM", "INTAKE_EMAIL_TO"];
  if (need.some((k) => !env[k])) return;

  const token = await getGraphToken(env);
  const business = (fields.business_name || fields.full_name || "New lead").trim();
  const from = encodeURIComponent(env.INTAKE_EMAIL_FROM);

  const rows = FIELDS.map(([k, label]) => {
    const v = (fields[k] || "").trim();
    if (!v) return "";
    return `<tr><td style="padding:6px 14px 6px 0;font:600 13px/1.5 Arial,sans-serif;color:#5b6478;vertical-align:top;white-space:nowrap;">${esc(label)}</td><td style="padding:6px 0;font:400 13px/1.5 Arial,sans-serif;color:#1d2335;">${esc(v)}</td></tr>`;
  }).join("");
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
  const html =
    `<div style="background:#f4f6fb;padding:24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(13,22,71,0.08);">` +
    `<tr><td style="background:linear-gradient(135deg,#2E1065,#5B21B6);padding:24px 30px;"><div style="font:800 12px/1 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.6);">Turnkey WEB</div><div style="font:800 20px/1.3 Arial,sans-serif;color:#fff;margin-top:6px;">New Free Site Request</div><div style="font:400 13px Arial,sans-serif;color:rgba(255,255,255,.75);margin-top:4px;">Submitted ${esc(ts)} CT</div></td></tr>` +
    `<tr><td style="padding:14px 30px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr></table></div>`;

  const draft = {
    subject: `New Free Site Request — ${business}`,
    body: { contentType: "HTML", content: html },
    toRecipients: [{ emailAddress: { address: env.INTAKE_EMAIL_TO } }],
  };
  const submitter = (fields.email || "").trim();
  if (/^\S+@\S+\.\S+$/.test(submitter)) draft.replyTo = [{ emailAddress: { address: submitter } }];

  await fetch(`${GRAPH}/users/${from}/sendMail`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ message: draft, saveToSentItems: true }),
  });
}

async function getGraphToken(env) {
  const res = await fetch(`https://login.microsoftonline.com/${env.AZURE_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.AZURE_APPLICATION_ID,
      client_secret: env.AZURE_CLIENT_SECRET_VALUE,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Graph auth failed");
  return data.access_token;
}

function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
}
