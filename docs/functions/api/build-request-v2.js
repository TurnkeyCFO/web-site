/**
 * Cloudflare Pages Function — Turnkey Web BUILD REQUEST handler (V2)
 * Route:  POST /api/build-request-v2   (turnkeyweb.org/api/build-request-v2)
 *
 * IDENTICAL to /api/build-request, except it posts to the #approvals Slack
 * channel (SLACK_CHANNEL_APPROVALS) instead of #tkweb. The build-request-v2
 * form on turnkeyweb.org/build-request-v2/ submits here; the
 * build-request-listener-v2 watches #approvals, picks up the card, and the
 * DRAFT preview link comes back into #approvals in the same thread.
 *
 * Required environment variables (Cloudflare dashboard > Pages > Settings >
 * Variables and Secrets):
 *   SLACK_BOT_TOKEN         Slack bot token (xoxb-...)            [type: Secret]
 *   SLACK_CHANNEL_APPROVALS Slack channel id for #approvals       e.g. C0BBY3T4C3Y
 *
 * The endpoint never blocks on Slack — if SLACK_BOT_TOKEN is missing the
 * request still returns ok:true (the requester sees the success state) and
 * the failure is logged for the operator to investigate.
 */

const FIELD_LABELS = {
  requester_name:       "Submitted by",
  business_name:        "Business",
  hubspot_link:         "HubSpot profile",
  business_links:       "Links to research",
  business_description: "What they do",
  brand_vibe:           "Brand notes / vibe",
};

const FIELD_ORDER = [
  "requester_name",
  "business_name",
  "hubspot_link",
  "business_links",
  "business_description",
  "brand_vibe",
];

export async function onRequestPost({ request, env }) {
  try {
    const ct = request.headers.get("content-type") || "";
    let fields = {};
    if (ct.includes("multipart/form-data") || ct.includes("application/x-www-form-urlencoded")) {
      const fd = await request.formData();
      for (const [k, v] of fd.entries()) {
        if (typeof v === "string") fields[k] = (fields[k] ? fields[k] + ", " : "") + v;
      }
    } else if (ct.includes("application/json")) {
      fields = await request.json();
    } else {
      const fd = await request.formData().catch(() => null);
      if (fd) for (const [k, v] of fd.entries()) if (typeof v === "string") fields[k] = v;
    }

    // Minimal validation — protect against empty submits.
    const business = (fields.business_name || "").trim();
    const requester = (fields.requester_name || "").trim();
    if (!business || !requester) {
      return json({ ok: false, error: "Business name and your name are required." }, 400);
    }

    // Slack post is best-effort but logged loudly if it fails.
    try {
      await postSlack(env, fields);
    } catch (e) {
      console.log("Slack post failed: " + (e && e.message || e));
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String((err && err.message) || err) }, 502);
  }
}

export async function onRequest() {
  return new Response("This endpoint accepts POST submissions from the Turnkey Web build-request V2 form.", {
    status: 405,
    headers: { Allow: "POST", "Content-Type": "text/plain" },
  });
}

async function postSlack(env, fields) {
  if (!env.SLACK_BOT_TOKEN || !env.SLACK_CHANNEL_APPROVALS) {
    throw new Error("SLACK_BOT_TOKEN or SLACK_CHANNEL_APPROVALS missing");
  }
  const business = (fields.business_name || "New Client").trim();
  const requester = (fields.requester_name || "").trim();
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });

  // Headline first — the literal trigger phrase the `turnkey-web-site-builder`
  // skill watches for. Keep "Turnkey web site - <business>" in the top text so
  // the skill matcher fires on the exact phrase.
  const headerLine = `**BUILD REQUEST** — ${business}`;
  const triggerLine = `*Turnkey web site - ${business}*`;

  const sections = FIELD_ORDER
    .map((k) => {
      const v = (fields[k] || "").trim();
      if (!v) return null;
      const label = FIELD_LABELS[k] || k;
      const safe = v.length > 1200 ? v.slice(0, 1200) + "…" : v;
      return `*${label}:* ${safe}`;
    })
    .filter(Boolean)
    .join("\n");

  const text = `${headerLine}\n${triggerLine}\n\n${sections}\n\n_Submitted ${ts} CT · turnkeyweb.org/build-request-v2_`;

  const blocks = [
    { type: "header", text: { type: "plain_text", text: `🛠️ Build Request — ${business}`.slice(0, 150) } },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Trigger:* \`Turnkey web site - ${business}\`\n` +
              `_The build agent will pick this up, research the business, draft the site, iterate with Playwright until it hits 9/10, and post a *DRAFT* preview link back to this channel._`,
      },
    },
    { type: "divider" },
    { type: "section", text: { type: "mrkdwn", text: sections.length > 2900 ? sections.slice(0, 2900) + "…" : sections } },
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `Submitted by *${requester}* · ${ts} CT · turnkeyweb.org/build-request-v2` }],
    },
  ];

  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.SLACK_BOT_TOKEN,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel: env.SLACK_CHANNEL_APPROVALS,
      text,
      blocks,
      unfurl_links: false,
      unfurl_media: false,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error("chat.postMessage: " + (data.error || res.status));
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
