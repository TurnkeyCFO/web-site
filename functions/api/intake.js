/**
 * Cloudflare Pages Function — Turnkey Web intake form handler
 * Route:  POST /api/intake   (turnkeyweb.org/api/intake)
 *
 * When the intake form is submitted this endpoint:
 *   1. Parses the multipart form (text fields + uploaded brand files)
 *   2. Uploads each file to OneDrive via Microsoft Graph (client-credentials)
 *      into:  <ONEDRIVE_USER>/Turnkey Web Intake/<Business> - <Industry>/<YYYY-MM-DD>/
 *   3. Emails the full submission to INTAKE_EMAIL_TO via Graph sendMail,
 *      with Reply-To set to the prospect so a reply goes straight to them
 *   4. Returns { ok: true, folderUrl } as JSON
 *
 * Required environment variables
 * (Cloudflare dashboard > Pages project > Settings > Variables and Secrets).
 * The three AZURE_* values are the SAME app/secret as the workspace .env —
 * copy them straight across:
 *   AZURE_TENANT_ID            Entra tenant id
 *   AZURE_APPLICATION_ID       App registration (client) id
 *   AZURE_CLIENT_SECRET_VALUE  App registration client secret        [type: Secret]
 *   ONEDRIVE_USER              UPN whose OneDrive stores the files    e.g. ricky@turnkeycfo.com
 *   INTAKE_EMAIL_FROM          Mailbox the notification is sent from  e.g. ricky@turnkeycfo.com
 *   INTAKE_EMAIL_TO            Where the submission email lands       e.g. rickyW@turnkeyweb.org
 *
 * The (existing, shared) Azure app registration needs these APPLICATION
 * permissions, admin-consented:  Files.ReadWrite.All  +  Mail.Send
 */

const GRAPH = "https://graph.microsoft.com/v1.0";
const MAX_FILE_BYTES = 25 * 1024 * 1024; // defense-in-depth; the form UI caps at 10 MB

/* ── Field labels + section grouping (mirrors the form) ──────────────── */
const LABELS = {
  selected_package: "Package",
  full_name: "Name",
  business_name: "Business",
  email: "Email",
  phone: "Phone",
  industry: "Industry",
  business_description: "Business Description",
  location: "Location",
  target_audience: "Target Audience",
  audience_type: "Audience Type",
  competitors: "Competitors",
  differentiator: "Differentiator",
  primary_goal: "Primary Goal",
  primary_cta: "Primary CTA",
  existing_website: "Existing Website",
  current_site_dislikes: "Current Site Dislikes",
  has_brand: "Existing Brand",
  brand_colors: "Brand Colors",
  style: "Visual Style",
  inspiration_sites: "Inspiration Sites",
  has_photos: "Photography",
  pages: "Pages Needed",
  other_pages: "Other Pages",
  copy_owner: "Copy Writer",
  existing_content: "Existing Content",
  features: "Features Needed",
  integrations: "Integrations",
  ecommerce_details: "E-Commerce Details",
  has_domain: "Domain Status",
  domain_info: "Domain Info",
  self_manage: "Self-Manage Site",
  growth_services: "Growth Services",
  timeline: "Timeline",
  hard_deadline: "Hard Deadline",
  ongoing_plan: "Ongoing Plan",
  comms_pref: "Communication Preference",
  decision_maker: "Decision Maker",
  other_approvers: "Other Approvers",
  prior_web_exp: "Prior Web Experience",
  prior_web_issues: "Prior Web Issues",
  success_vision: "Success Vision",
  other: "Other Notes",
};

const SECTIONS = [
  { header: "Package", keys: ["selected_package"] },
  { header: "About the Business", keys: ["full_name", "business_name", "email", "phone", "industry", "business_description", "location"] },
  { header: "Target Audience", keys: ["target_audience", "audience_type", "competitors", "differentiator"] },
  { header: "Website Goals", keys: ["primary_goal", "primary_cta", "existing_website", "current_site_dislikes"] },
  { header: "Design & Brand", keys: ["has_brand", "brand_colors", "style", "inspiration_sites", "has_photos"] },
  { header: "Pages & Content", keys: ["pages", "other_pages", "copy_owner", "existing_content"] },
  { header: "Features & Functionality", keys: ["features", "integrations", "ecommerce_details"] },
  { header: "Technical", keys: ["has_domain", "domain_info", "self_manage", "growth_services"] },
  { header: "Timeline", keys: ["timeline", "hard_deadline", "ongoing_plan"] },
  { header: "Communication", keys: ["comms_pref", "decision_maker", "other_approvers", "prior_web_exp", "prior_web_issues"] },
  { header: "Anything Else", keys: ["success_vision", "other"] },
];

/* ── Entry points ────────────────────────────────────────────────────── */
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const missing = ["AZURE_TENANT_ID", "AZURE_APPLICATION_ID", "AZURE_CLIENT_SECRET_VALUE", "ONEDRIVE_USER", "INTAKE_EMAIL_FROM", "INTAKE_EMAIL_TO"]
      .filter((k) => !env[k]);
    if (missing.length) {
      return json({ ok: false, error: "Server not configured — missing: " + missing.join(", ") }, 500);
    }

    const formData = await request.formData();
    const fields = {};
    const files = [];
    for (const [key, value] of formData.entries()) {
      if (value && typeof value === "object" && typeof value.arrayBuffer === "function") {
        if (value.size > 0 && value.name) files.push(value);
      } else {
        fields[key] = fields[key] === undefined ? value : [].concat(fields[key], value).join(", ");
      }
    }

    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        return json({ ok: false, error: `File "${f.name}" is too large.` }, 413);
      }
    }

    const business = (fields.business_name || "New Client").trim();
    const industry = (fields.industry || "").trim();
    const token = await getGraphToken(env);

    // ── Upload files to OneDrive ──
    let folderUrl = "";
    const uploaded = [];
    if (files.length) {
      const folder = await ensureFolders(env, token, business, industry);
      folderUrl = folder.webUrl;
      for (const file of files) {
        const item = await uploadFile(env, token, folder.id, file);
        uploaded.push({ name: file.name, url: item.webUrl, size: file.size });
      }
    }

    // ── Email the submission ──
    await sendEmail(env, token, fields, uploaded, folderUrl);

    return json({ ok: true, folderUrl });
  } catch (err) {
    return json({ ok: false, error: String((err && err.message) || err) }, 502);
  }
}

// Any non-POST method.
export async function onRequest() {
  return new Response("This endpoint accepts POST submissions from the Turnkey Web intake form.", {
    status: 405,
    headers: { Allow: "POST", "Content-Type": "text/plain" },
  });
}

/* ── Microsoft Graph helpers ─────────────────────────────────────────── */
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
  if (!res.ok) throw new Error("Graph auth failed: " + (data.error_description || res.status));
  return data.access_token;
}

/**
 * Build the OneDrive folder tree for a submission and return the folder the
 * files go into. Layout, in the OneDrive of ONEDRIVE_USER:
 *
 *   Turnkey Web Intake/
 *     <Business> - <Industry>/      <- one custom folder per client
 *       <YYYY-MM-DD>/               <- one folder per submission
 *         <uploaded files>
 *
 * The base + client folders are reused if they already exist; the dated
 * submission folder is always created fresh (renamed on a same-day collision).
 */
async function ensureFolders(env, token, business, industry) {
  const user = encodeURIComponent(env.ONEDRIVE_USER);
  const base = "Turnkey Web Intake";
  const client = industry ? `${sanitize(business)} - ${sanitize(industry)}` : sanitize(business);
  const submission = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" }); // YYYY-MM-DD

  // Level 1 — base folder (reused if it already exists)
  await createFolder(token, `/users/${user}/drive/root`, base, "fail");
  // Level 2 — per-client folder, name + industry (reused if it already exists)
  await createFolder(token, `/users/${user}/drive/root:/${encodeURIComponent(base)}:`, client, "fail");
  // Level 3 — per-submission dated folder (always a fresh folder)
  return createFolder(
    token,
    `/users/${user}/drive/root:/${encodeURIComponent(base)}/${encodeURIComponent(client)}:`,
    submission,
    "rename"
  );
}

// POST a child folder under parentRef. conflict "fail" tolerates an existing
// folder (409 -> returns null); "rename" always lands a fresh, uniquely-named one.
async function createFolder(token, parentRef, name, conflict) {
  const res = await fetch(`${GRAPH}${parentRef}/children`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ name, folder: {}, "@microsoft.graph.conflictBehavior": conflict }),
  });
  if (res.status === 201) return res.json();
  if (res.status === 409 && conflict === "fail") return null; // already exists — fine
  throw new Error(`Create folder "${name}" → ${res.status}: ${(await res.text()).slice(0, 250)}`);
}

// Simple upload — reliable for the form's 10 MB cap (Graph simple upload handles far larger).
async function uploadFile(env, token, folderId, file) {
  const user = encodeURIComponent(env.ONEDRIVE_USER);
  const name = encodeURIComponent(file.name);
  const res = await fetch(`${GRAPH}/users/${user}/drive/items/${folderId}:/${name}:/content`, {
    method: "PUT",
    headers: { Authorization: "Bearer " + token, "Content-Type": file.type || "application/octet-stream" },
    body: await file.arrayBuffer(),
  });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Upload "${file.name}" → ${res.status}: ${(await res.text()).slice(0, 250)}`);
  }
  return res.json();
}

async function sendEmail(env, token, fields, uploaded, folderUrl) {
  const business = (fields.business_name || "New Client").trim();
  const message = {
    subject: `New Website Project Questionnaire — ${business}`,
    body: { contentType: "HTML", content: buildEmailHtml(fields, uploaded, folderUrl) },
    toRecipients: [{ emailAddress: { address: env.INTAKE_EMAIL_TO } }],
  };
  const submitter = (fields.email || "").trim();
  if (/^\S+@\S+\.\S+$/.test(submitter)) {
    message.replyTo = [{ emailAddress: { address: submitter } }];
  }
  const res = await fetch(`${GRAPH}/users/${encodeURIComponent(env.INTAKE_EMAIL_FROM)}/sendMail`, {
    method: "POST",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ message, saveToSentItems: true }),
  });
  if (res.status !== 202) {
    throw new Error(`sendMail → ${res.status}: ${(await res.text()).slice(0, 250)}`);
  }
}

/* ── Formatting helpers ──────────────────────────────────────────────── */
function sanitize(name) {
  return name.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "New Client";
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildEmailHtml(fields, uploaded, folderUrl) {
  const ts = new Date().toLocaleString("en-US", { timeZone: "America/Chicago" });
  const rows = [];
  for (const sec of SECTIONS) {
    const items = sec.keys
      .map((k) => ({ label: LABELS[k] || k, val: (fields[k] || "").trim() }))
      .filter((x) => x.val);
    if (!items.length) continue;
    rows.push(
      `<tr><td colspan="2" style="padding:18px 0 6px;font:700 12px/1 Arial,sans-serif;` +
        `letter-spacing:1.5px;text-transform:uppercase;color:#0055FF;">${esc(sec.header)}</td></tr>`
    );
    for (const it of items) {
      rows.push(
        `<tr>` +
          `<td style="padding:6px 14px 6px 0;font:600 13px/1.5 Arial,sans-serif;color:#5b6478;` +
          `vertical-align:top;white-space:nowrap;">${esc(it.label)}</td>` +
          `<td style="padding:6px 0;font:400 13px/1.5 Arial,sans-serif;color:#1d2335;">${esc(it.val)}</td>` +
        `</tr>`
      );
    }
  }

  let filesBlock;
  if (uploaded.length) {
    const links = uploaded
      .map(
        (f) =>
          `<li style="margin:3px 0;"><a href="${esc(f.url)}" style="color:#0055FF;">${esc(f.name)}</a> ` +
          `<span style="color:#8a93a6;">(${(f.size / 1024 / 1024).toFixed(2)} MB)</span></li>`
      )
      .join("");
    filesBlock =
      `<p style="font:600 13px/1.5 Arial,sans-serif;color:#1d2335;margin:6px 0;">` +
      `${uploaded.length} file(s) uploaded to OneDrive:</p>` +
      `<ul style="margin:6px 0 12px;padding-left:20px;">${links}</ul>` +
      `<p style="margin:6px 0;"><a href="${esc(folderUrl)}" ` +
      `style="display:inline-block;background:#0055FF;color:#fff;text-decoration:none;` +
      `padding:10px 20px;border-radius:8px;font:700 13px Arial,sans-serif;">Open the OneDrive folder &rarr;</a></p>`;
  } else {
    filesBlock = `<p style="font:400 13px/1.5 Arial,sans-serif;color:#8a93a6;margin:6px 0;">No files were uploaded with this submission.</p>`;
  }

  return (
    `<div style="background:#f4f6fb;padding:24px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" ` +
    `style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;` +
    `box-shadow:0 6px 24px rgba(13,22,71,0.08);">` +
    `<tr><td style="background:linear-gradient(135deg,#0d1647,#0a0070);padding:26px 32px;">` +
    `<div style="font:800 12px/1 Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;` +
    `color:rgba(255,255,255,0.6);">Turnkey WEB</div>` +
    `<div style="font:800 21px/1.3 Arial,sans-serif;color:#fff;margin-top:6px;">New Website Project Questionnaire</div>` +
    `<div style="font:400 13px/1.5 Arial,sans-serif;color:rgba(255,255,255,0.75);margin-top:4px;">` +
    `Submitted ${esc(ts)} CT</div></td></tr>` +
    `<tr><td style="padding:8px 32px 24px;">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>` +
    `<hr style="border:none;border-top:1px solid #e6e9f2;margin:20px 0;">` +
    `<div style="font:700 12px/1 Arial,sans-serif;letter-spacing:1.5px;text-transform:uppercase;` +
    `color:#0055FF;margin-bottom:10px;">Brand Files</div>${filesBlock}` +
    `</td></tr></table></div>`
  );
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
