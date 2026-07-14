/**
 * Cloudflare Pages Function — Turnkey Web "Free Site" request handler
 * Route:  POST /api/free-site   (turnkeyweb.org/api/free-site)
 *
 * Frictionless landing-page form (no call, no meeting). On submit it:
 *   1. Posts a **BUILD REQUEST** card to #tkweb in the EXACT format the
 *      `turnkey-web-site-builder` / build-request-listener pipeline watches for
 *      — so the submission auto-kicks off the full research → draft → iterate →
 *      DRAFT-preview-in-Slack process (the same one the /build-request form uses).
 *   2. Posts a lead card to #leads (the lead log of record).
 *   3. Best-effort emails the request to INTAKE_EMAIL_TO via Microsoft Graph.
 *   4. Returns { ok: true } as long as the build trigger OR the lead post landed.
 *
 * Env vars (already configured on this Pages project for /api/intake +
 * /api/build-request):
 *   SLACK_BOT_TOKEN                              (Secret)
 *   SLACK_CHANNEL_TKWEB   #tkweb id (build pipeline)   e.g. C0B3P1H77MY
 *   SLACK_CHANNEL_LEADS   #leads id (lead log)         e.g. C0AREP6F46N
 *   AZURE_TENANT_ID / AZURE_APPLICATION_ID / AZURE_CLIENT_SECRET_VALUE,
 *   INTAKE_EMAIL_FROM / INTAKE_EMAIL_TO          (optional email; best-effort)
 */

const GRAPH = "https://graph.microsoft.com/v1.0";

// Submission-notification recipient (overrides the shared INTAKE_EMAIL_TO env,
// which is rickyw@…; free-site notifications go to ricky@turnkeyweb.org).
const EMAIL_TO = "ricky@turnkeyweb.org";

// Lead-log fields (#leads card + email).
const LEAD_FIELDS = [
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
    const f = await parseBody(request);

    // honeypot — bots fill the hidden "company_url"; humans never see it
    if ((f.company_url || "").trim()) return json({ ok: true });

    if (!(f.full_name || "").trim() || !(f.business_name || "").trim() || !(f.email || "").trim()) {
      return json({ ok: false, error: "Please add your name, business, and email." }, 400);
    }

    // 1) THE BUILD TRIGGER — post the BUILD REQUEST card to #tkweb. This is the
    //    primary action: it kicks off the same auto-build the team loves.
    let buildOk = false;
    try { buildOk = await postBuildRequest(env, f); } catch (e) { console.log("build trigger:", e); }

    // 2) Lead log to #leads.
    let leadOk = false;
    try { leadOk = await postLead(env, f); } catch (e) { console.log("lead post:", e); }

    // 3) Best-effort email — never blocks.
    try { await sendEmail(env, f); } catch (e) { console.log("email:", e); }

    if (!buildOk && !leadOk && !(env.SLACK_BOT_TOKEN && (env.SLACK_CHANNEL_TKWEB || env.SLACK_CHANNEL_LEADS))) {
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
  if (ct.includes("application/json")) return await request.json().catch(() => ({}));
  const fd = await request.formData();
  const o = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") o[k] = v;
  return o;
}

/* ── BUILD REQUEST card → #tkweb (mirrors /api/build-request so the build
      agent's matcher fires identically) ─────────────────────────────────── */
async function postBuildRequest(env, f) {
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_TKWEB) {
    throw new Error("SLACK_BOT_TOKEN or SLACK_CHANNEL_TKWEB missing");
  }
  const business = (f.business_name || "New Client").trim();
  const requester = (f.full_name || "").trim();
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });

  // Compose the build agent's expected fields from the prospect's inputs.
  const descParts = [];
  if ((f.business_type || "").trim()) descParts.push((f.business_type).trim());
  if ((f.location || "").trim()) descParts.push("based in " + (f.location).trim());
  let description = descParts.join(" ");
  if ((f.services_offered || "").trim()) description += (description ? ". " : "") + "Services: " + (f.services_offered).trim();
  if (!description) description = "(no description provided)";

  const links = (f.existing_website || "").trim();
  const vibe = (f.details || "").trim();
  const contact = [f.email, f.phone].map((x) => (x || "").trim()).filter(Boolean).join(" · ");

  // NOTE: only build-agent field labels go in the parsed body (contact lives in
  // the context block below, so it never pollutes the "Brand notes / vibe" parse).
  const fieldLines = [
    ["Submitted by", requester],
    ["Business", business],
    ["Links to research", links],
    ["What they do", description],
    ["Brand notes / vibe", vibe],
  ]
    .filter(([, v]) => v)
    .map(([l, v]) => `*${l}:* ${v.length > 1200 ? v.slice(0, 1200) + "…" : v}`)
    .join("\n");

  // The literal trigger phrase the turnkey-web-site-builder skill watches for.
  const text = `**BUILD REQUEST** — ${business}\n*Turnkey web site - ${business}*\n\n${fieldLines}\n\n_Submitted ${ts} CT · turnkeyweb.org/free-website (free-site offer)_`;

  const blocks = [
    { type: "header", text: { type: "plain_text", text: `🛠️ Build Request — ${business}`.slice(0, 150) } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `*Trigger:* \`Turnkey web site - ${business}\`\n` +
          `_Free-site landing-page request — the build agent will research the business, draft the site, iterate to 9/10, and post a *DRAFT* preview link back to this channel._`,
      },
    },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: fieldLines.length > 2900 ? fieldLines.slice(0, 2900) + "…" : fieldLines } },
    { type: "context", elements: [{ type: "mrkdwn", text: `Submitted by *${requester}* · ${contact || "no contact"} · ${ts} CT · turnkeyweb.org/free-website` }] },
  ];

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.SLACK_BOT_TOKEN, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ channel: env.SLACK_CHANNEL_TKWEB, text, blocks, unfurl_links: false, unfurl_media: false }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error("tkweb chat.postMessage: " + (data.error || res.status));
  return true;
}

/* ── Lead log → #leads ───────────────────────────────────────────────────── */
async function postLead(env, f) {
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_LEADS) return false;
  const business = (f.business_name || f.full_name || "New lead").trim();
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
  const lines = LEAD_FIELDS
    .map(([k, label]) => {
      const v = (f[k] || "").trim();
      return v ? `*${label}:* ${v.length > 800 ? v.slice(0, 800) + "…" : v}` : null;
    })
    .filter(Boolean)
    .join("\n");

  const blocks = [
    { type: "header", text: { type: "plain_text", text: `🆓 Free Site Request — ${business}`.slice(0, 150) } },
    { type: "section", text: { type: "mrkdwn", text: lines || "(no details)" } },
    { type: "context", elements: [{ type: "mrkdwn", text: `Auto-building now → see #tkweb for the DRAFT · ${ts} CT · turnkeyweb.org/free-website` }] },
  ];

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.SLACK_BOT_TOKEN, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ channel: env.SLACK_CHANNEL_LEADS, text: `Free site request — ${business}`, blocks }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error("leads chat.postMessage: " + (data.error || res.status));
  return true;
}

/* ── Best-effort email ───────────────────────────────────────────────────── */
async function sendEmail(env, f) {
  const need = ["AZURE_TENANT_ID", "AZURE_APPLICATION_ID", "AZURE_CLIENT_SECRET_VALUE", "INTAKE_EMAIL_FROM"];
  if (need.some((k) => !env[k])) return;
  const token = await getGraphToken(env);
  const business = (f.business_name || f.full_name || "New lead").trim();
  const from = encodeURIComponent(env.INTAKE_EMAIL_FROM);
  const rows = LEAD_FIELDS.map(([k, label]) => {
    const v = (f[k] || "").trim();
    if (!v) return "";
    return `<tr><td style="padding:6px 14px 6px 0;font:600 13px/1.5 Arial,sans-serif;color:#5b6478;vertical-align:top;white-space:nowrap;">${esc(label)}</td><td style="padding:6px 0;font:400 13px/1.5 Arial,sans-serif;color:#1d2335;">${esc(v)}</td></tr>`;
  }).join("");
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
  const html =
    `<div style="background:#f4f6fb;padding:24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(13,22,71,0.08);">` +
    `<tr><td style="background:linear-gradient(135deg,#2E1065,#5B21B6);padding:24px 30px;"><div style="font:800 12px/1 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.6);">Turnkey WEB</div><div style="font:800 20px/1.3 Arial,sans-serif;color:#fff;margin-top:6px;">New Free Site Request</div><div style="font:400 13px Arial,sans-serif;color:rgba(255,255,255,.75);margin-top:4px;">Auto-build kicked off · ${esc(ts)} CT</div></td></tr>` +
    `<tr><td style="padding:14px 30px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr></table></div>`;
  const draft = {
    subject: `New Free Site Request — ${business}`,
    body: { contentType: "HTML", content: html },
    toRecipients: [{ emailAddress: { address: EMAIL_TO } }],
  };
  const submitter = (f.email || "").trim();
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
