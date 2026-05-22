/* ═══════════════════════════════════════════════════
   TURNKEY WEB — site.js
   Pricing model: $250 one-time setup + $50/mo
   - Setup fee is FLAT across every project type and tier
   - Monthly tier covers hosting, management, and UNLIMITED pages + UNLIMITED updates
   - Tier (Launch/Growth/Authority) is chosen by site complexity, not by build cost
   ═══════════════════════════════════════════════════ */

/* ── FLAT SETUP FEE (one-time, all project types) ── */
const SETUP_FEE = 250;

/* ── MONTHLY TIER PRICES (recurring, hosting + unlimited updates) ── */
const TIER_MONTHLY = {
  launch:    50,
  growth:    50,
  authority: 50
};

/* ── COMPLEXITY SIGNALS — drive which tier is RECOMMENDED, not the price ── */
const pageCountComplexity = {
  "1 page":    0,
  "2-3 pages": 0,
  "4-5 pages": 1,
  "6-8 pages": 2,
  "9+ pages":  3
};

const featureComplexity = {
  "Contact forms":           0,
  "Calendar booking":        0,
  "Blog/resources":          0,
  "Portfolio/case studies":  0,
  "Testimonials":            0,
  "Quote request flow":      0,
  "CRM/email integration":   1,
  "Analytics and tracking":  0,
  "Local SEO pages":         1,
  "E-commerce / payments":   2
};

const goalComplexity = {
  "Generate leads":              0,
  "Look more credible":          0,
  "Book appointments":           0,
  "Launch paid ads":             1,
  "Improve SEO/local discovery": 1,
  "Refresh branding":            0
};

/* ── TIER FEATURES ──
   Every tier (every project type) ALREADY includes:
     • $250 one-time setup — covers design, build, and launch of your site
     • Unlimited pages
     • Unlimited content & design updates
     • Managed hosting, SSL, uptime & security monitoring
     • Mobile-responsive design, on-page SEO foundations
     • First draft within 7 days, unlimited revisions until launch
   Tiers differ in depth of ongoing service, response time, and strategic support.
*/
const tierFeatures = {
  "business-website-build": {
    launch: [
      "$250 one-time setup — any size site, any number of pages",
      "Unlimited pages and unlimited updates — forever",
      "Managed hosting, SSL, domain & uptime monitoring",
      "Mobile-responsive design + on-page SEO foundations",
      "First draft within 7 days · unlimited revisions to launch",
      "Email support with 48-hour response"
    ],
    growth: [
      "Everything in Launch, plus:",
      "Priority turnaround on update requests",
      "Calendly or booking widget integration",
      "Blog or resources section ready to publish",
      "Monthly conversion review & improvement suggestions",
      "Email support with 24-hour response"
    ],
    authority: [
      "Everything in Growth, plus:",
      "Same-day response on update requests",
      "CRM / email integration (Mailchimp, HubSpot, etc.)",
      "Microsoft Clarity heatmaps + session recordings installed",
      "Monthly heatmap & behavior report — what's getting clicked, where users drop off",
      "Quarterly full site audit & performance tune-up"
    ]
  },
  "landing-page-sprint": {
    launch: [
      "$250 one-time setup — your launch page built, designed, and shipped",
      "Unlimited pages added later at no extra setup cost",
      "Managed hosting, SSL & uptime monitoring",
      "Mobile-responsive design + clean conversion structure",
      "First draft within 5 days · unlimited revisions to launch",
      "Email support with 48-hour response"
    ],
    growth: [
      "Everything in Launch, plus:",
      "A/B headline & layout variants for testing",
      "Trust section: logos, reviews, proof badges",
      "Calendly / booking embed integration",
      "Priority turnaround on updates",
      "Email support with 24-hour response"
    ],
    authority: [
      "Everything in Growth, plus:",
      "Full-scroll multi-section storytelling layout",
      "Video embed or product walkthrough section",
      "CRM / email automation connection",
      "Microsoft Clarity heatmaps + session recordings installed",
      "Monthly heatmap & behavior report — what's getting clicked, where users drop off",
      "Same-day response on update requests"
    ]
  },
  "website-refresh": {
    launch: [
      "$250 one-time setup — full refresh of your existing site",
      "Unlimited pages and unlimited updates — forever",
      "Managed hosting, SSL & uptime monitoring",
      "Updated typography, colors, spacing & mobile fixes",
      "First draft within 7 days · unlimited revisions to launch",
      "Email support with 48-hour response"
    ],
    growth: [
      "Everything in Launch, plus:",
      "Priority turnaround on update requests",
      "Improved CTA placement & conversion flow",
      "Contact form rebuild or repair",
      "Calendly booking integration",
      "Email support with 24-hour response"
    ],
    authority: [
      "Everything in Growth, plus:",
      "Full brand alignment across all pages",
      "Core Web Vitals performance optimization",
      "Portfolio or case study section built out",
      "Microsoft Clarity heatmaps + session recordings installed",
      "Monthly heatmap & behavior report — what's getting clicked, where users drop off",
      "Same-day response on update requests"
    ]
  },
  "website-care-plan": {
    launch: [
      "$250 one-time setup — onboard your existing site onto our managed hosting",
      "Unlimited pages and unlimited updates — forever",
      "Uptime, SSL & security monitoring included",
      "Plugin & platform updates handled for you",
      "Routine content edits & design updates",
      "Email support with 48-hour response"
    ],
    growth: [
      "Everything in Launch, plus:",
      "Priority turnaround on update requests",
      "Monthly conversion review & improvement suggestions",
      "Google Analytics monthly performance report",
      "New section or page element added each month",
      "Email support with 24-hour response"
    ],
    authority: [
      "Everything in Growth, plus:",
      "Microsoft Clarity heatmaps + session recordings installed",
      "Monthly heatmap & behavior report — what's getting clicked, where users drop off",
      "Proactive UX improvement recommendations",
      "New blog post drafting assistance (1 per month)",
      "Quarterly full site audit",
      "Same-day priority support response"
    ]
  }
};

/* ── STATE ── */
let estimateUnlocked = false;
let selectedTierName = null;
let selectedTierPrice = null;

/* ── DOM REFS ── */
const quoteForm       = document.getElementById("estimate-form");
const statusNode      = document.getElementById("estimate-form-status");
const estimateCard    = document.getElementById("estimate-result");
const successPanel    = document.getElementById("estimate-success-panel");
const offerDialog     = successPanel?.querySelector(".offer-letter-shell");
const offerCloseBtn   = document.getElementById("offer-close");
const emailInput      = document.getElementById("email");
const isStaticMode    = window.location.hostname.includes("github.io");
const OFFER_STORAGE   = "turnkey-web-offer-data";

/* ── UTILITIES ── */
function formatCurrency(v){
  return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:0,maximumFractionDigits:0}).format(Number(v||0));
}
function roundTo50(v){ return Math.max(0, Math.round(Number(v||0)/50)*50); }
function setText(id,v){ const n=document.getElementById(id); if(n) n.textContent=v; }
function escapeHtml(v){
  return String(v??"")
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
function collectMultiSelect(name){
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(i=>i.value);
}
function humanizeProjectType(v){
  return String(v||"").split("-").map(p=>`${p[0].toUpperCase()}${p.slice(1)}`).join(" ");
}
function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||"").trim()); }

/* ── GET FORM PAYLOAD ── */
function getPayload(){
  if(!quoteForm) return null;
  const fd = new FormData(quoteForm);
  const p  = Object.fromEntries(fd.entries());
  p.goals    = collectMultiSelect("goals");
  p.features = collectMultiSelect("features");
  return p;
}

/* ── COMPUTE ESTIMATE ──
   New model: flat $250 setup + monthly tier price ($50/mo all tiers).
   Inputs influence which tier is RECOMMENDED, not the setup fee.
*/
function computeEstimate(payload){
  const pt  = payload.projectType    || "business-website-build";
  const pcb = payload.pageCountBand  || "2-3 pages";
  const sel = payload.features       || [];
  const gls = payload.goals          || [];

  let complexity = pageCountComplexity[pcb] || 0;
  sel.forEach(f => { complexity += featureComplexity[f] || 0; });
  gls.forEach(g => { complexity += goalComplexity[g]    || 0; });

  /* Tier recommendation thresholds */
  let recommendedTierIndex = 1; // Growth by default
  if(complexity <= 1) recommendedTierIndex = 0;          // Launch
  else if(complexity >= 4 || sel.includes("E-commerce / payments")) recommendedTierIndex = 2; // Authority

  const monthlyLow  = TIER_MONTHLY.launch;
  const monthlyHigh = TIER_MONTHLY.authority;
  const recommendedMonthly = [TIER_MONTHLY.launch, TIER_MONTHLY.growth, TIER_MONTHLY.authority][recommendedTierIndex];

  const addOns = [];
  if(gls.includes("Improve SEO/local discovery")) addOns.push("SEO foundations included");
  if(sel.includes("CRM/email integration"))       addOns.push("CRM integration");
  if(sel.includes("Local SEO pages"))             addOns.push("Local SEO page set");
  if(sel.includes("E-commerce / payments"))       addOns.push("Payments setup");
  if(gls.includes("Launch paid ads"))             addOns.push("Campaign landing page support");
  if(gls.includes("Refresh branding"))            addOns.push("Brand polish");

  return {
    setupFee: SETUP_FEE,
    monthlyRange: { low: monthlyLow, high: monthlyHigh },
    recommendedTierIndex,
    recommendedMonthly,
    recommendedPackage: humanizeProjectType(pt),
    formattedSetup: `${formatCurrency(SETUP_FEE)} setup`,
    formattedMonthlyRange: `${formatCurrency(recommendedMonthly)}/mo`,
    formattedRange: `${formatCurrency(SETUP_FEE)} setup + ${formatCurrency(recommendedMonthly)}/mo`,
    confidence: complexity <= 2 ? "high" : "medium",
    addOns,
    rationale: [
      `${humanizeProjectType(pt)} on the Turnkey Web managed plan`,
      "$250 one-time setup, any size site, unlimited pages",
      "Unlimited updates included in your monthly plan"
    ],
    /* legacy fields kept for downstream payload compatibility */
    range: { low: monthlyLow, high: monthlyHigh }
  };
}

/* ── BUILD TIER OPTIONS ──
   Always three tiers: Launch / Growth / Authority.
   Price format on every tier: "$250 setup + $X/mo".
   The recommended (highlighted) tier comes from estimate.recommendedTierIndex.
*/
function buildTierOptions(estimate, payload){
  const pt = payload.projectType || "business-website-build";
  const features = tierFeatures[pt] || tierFeatures["business-website-build"];

  const needsSEO     = (payload.goals||[]).includes("Improve SEO/local discovery") || (payload.features||[]).includes("Local SEO pages");
  const needsAds     = (payload.goals||[]).includes("Launch paid ads");
  const needsBooking = (payload.goals||[]).includes("Book appointments") || (payload.features||[]).includes("Calendar booking");
  const needsCRM     = (payload.features||[]).includes("CRM/email integration");

  function valueLine(tier){
    if(tier === "launch"){
      if(needsBooking) return "Get a clean, professional site live fast with a working booking path — covered by the same flat $250 setup.";
      if(needsAds)     return "A solid, ad-ready page with clean structure and clear CTAs — $250 setup, fully managed monthly.";
      return "The simplest path: a professional site live fast, with hosting and unlimited updates rolled in.";
    }
    if(tier === "growth"){
      if(needsSEO)     return "The strongest balance of trust, proof, and SEO — with priority turnaround on every update.";
      if(needsBooking) return "More polish, more proof, and faster updates — the level most small businesses get the clearest ROI on.";
      if(needsCRM)     return "Integrated with your CRM so every lead is captured and followed up automatically — with priority response.";
      return "More polish, deeper conversion structure, and priority turnaround — the level most small businesses choose.";
    }
    if(needsSEO) return "Maximum depth: SEO page sets, CRM integration, strategy calls, and same-day response on updates.";
    if(needsAds) return "Built for scale: ad-ready, CRM-connected, with monthly strategy calls and same-day update response.";
    return "The most complete monthly plan — fastest response, monthly strategy calls, and quarterly audits.";
  }

  const tierNames    = ["Launch", "Growth", "Authority"];
  const tierBadges   = ["Simplest", "Most balanced", "Most complete"];
  const tierFitLines = [
    "Best for businesses that want a clean, credible site live fast.",
    "Best for most small businesses — stronger trust + faster response.",
    "Best for businesses where depth, SEO, and same-day support matter most."
  ];
  const tierKeys     = ["launch","growth","authority"];
  const tierMonthly  = [TIER_MONTHLY.launch, TIER_MONTHLY.growth, TIER_MONTHLY.authority];
  const tierPrices   = tierMonthly.map(m => `${formatCurrency(SETUP_FEE)} setup + ${formatCurrency(m)}/mo`);
  const tierSummaries = [
    "Your site, professionally built and launched — then hosted, monitored, and updated by us every month.",
    "Everything in Launch, plus priority updates, integrations, and monthly conversion review.",
    "Everything in Growth, plus monthly strategy calls, quarterly audits, and same-day update response."
  ];

  return tierNames.map((name, i) => ({
    badge:    tierBadges[i],
    name,
    priceLabel: tierPrices[i],
    fit:      tierFitLines[i],
    summary:  tierSummaries[i],
    valueLine: valueLine(tierKeys[i]),
    points:   features[tierKeys[i]] || [],
    recommended: i === estimate.recommendedTierIndex
  }));
}

/* ── RENDER TIER CARDS ── */
function renderTierOptions(tiers){
  const container = document.getElementById("offer-tier-grid");
  if(!container) return;

  container.innerHTML = tiers.map((tier, index) => `
    <article class="offer-tier${tier.recommended?" offer-tier-featured":""}">
      ${tier.recommended ? '<div class="tier-highlight">⭐ Recommended for your scope</div>' : ""}
      <div class="tier-topline">
        <span class="tier-step">Option ${String(index+1).padStart(2,"0")}</span>
        <div class="tier-badge">${escapeHtml(tier.badge)}</div>
      </div>
      <div class="tier-head">
        <div class="tier-title-block">
          <h4>${escapeHtml(tier.name)}</h4>
          <p class="tier-summary">${escapeHtml(tier.summary)}</p>
        </div>
        <div class="tier-price-block">
          <span class="tier-price-prefix">$250 one-time +</span>
          <div class="tier-price">${escapeHtml(tier.priceLabel.split('+ ')[1] || tier.priceLabel)}</div>
        </div>
      </div>
      <div class="tier-fit">${escapeHtml(tier.valueLine)}</div>
      <ul>
        ${tier.points.map(pt=>`<li>${escapeHtml(pt)}</li>`).join("")}
      </ul>
      <button
        class="tier-select-btn"
        type="button"
        data-tier-index="${index}"
        data-tier-name="${escapeHtml(tier.name)}"
        data-tier-price="${escapeHtml(tier.priceLabel)}"
        onclick="selectTier(this)"
      >Select ${escapeHtml(tier.name)}</button>
    </article>
  `).join("");
}

/* ── TIER SELECTION ── */
window.selectTier = function(btn){
  document.querySelectorAll(".tier-select-btn").forEach(b => {
    b.classList.remove("selected");
    b.textContent = b.textContent.replace(/^✓ /, "").replace(" Selected","");
    b.textContent = "Select " + b.dataset.tierName;
  });
  btn.classList.add("selected");
  selectedTierName  = btn.dataset.tierName;
  selectedTierPrice = btn.dataset.tierPrice;
  btn.textContent = `✓ ${selectedTierName} Selected`;

  /* Enable submit button */
  const submitBtn = document.getElementById("result-submit-btn");
  if(submitBtn){ submitBtn.disabled = false; }

  /* Hide the helper note */
  const note = document.getElementById("result-lead-id");
  if(note){ note.style.display = "none"; }
};

/* ── PERSIST / READ OFFER DATA ── */
function persistOfferData(data){
  try{ window.localStorage.setItem(OFFER_STORAGE, JSON.stringify(data)); }
  catch(e){ console.warn("Unable to persist offer data", e); }
}
function readOfferData(){
  try{ const r=window.localStorage.getItem(OFFER_STORAGE); return r?JSON.parse(r):null; }
  catch(e){ return null; }
}


/* ── BUILD LEAD-CAPTURE PAYLOAD (for "Get My Quote") ── */
function buildLeadCapturePayload(payload, estimate){
  return {
    source:          "TK Web Lead Capture",
    submittedAt:     new Date().toISOString(),
    firstName:       payload.firstName   || "",
    company:         payload.company     || "",
    phone:           payload.phone       || "",
    industry:        (payload.industry === "Other" ? (payload.otherIndustry || "").trim() || "Other" : payload.industry) || "",
    existingWebsite: payload.existingWebsite || "",
    projectType:     estimate.recommendedPackage,
    pageCount:       payload.pageCountBand || "",
    timeline:        payload.timeline    || "",
    budgetBand:      payload.budgetBand  || "",
    goals:           (payload.goals    ||[]).join(", "),
    features:        (payload.features ||[]).join(", "),
    notes:           payload.notes       || "",
    email:           payload.email       || "",
    estimateRange:   estimate.formattedRange
  };
}

/* ── SUBMIT TO WEBHOOK HELPER ── */
function submitToWebhook(data){
  return fetch(SHEETS_WEBHOOK, {
    method: "POST",
    mode: "no-cors",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(data)
  });
}

/* ── SUBMIT QUOTE — sheets + slack ── */
const SHEETS_WEBHOOK = "https://script.google.com/macros/s/AKfycby3WTNHSphNeqvrSBYyFilCvP2hYRV8YCCpSgLOCThC6PheZ2hflDtLUTUmgOxBCoPT/exec";
const SLACK_CHANNEL  = "C0AQVEW4KK8"; /* notified via GAS */

async function submitQuoteLead(){
  const btn = document.getElementById("result-submit-btn");
  if(!btn || !selectedTierName) return;

  /* Gather stored offer data */
  const stored = readOfferData() || {};
  const payload = stored.payload || {};
  const estimate = stored.estimate || {};

  /* Update button state */
  btn.disabled = true;
  btn.textContent = "Sending…";

  const submittedAt = new Date().toLocaleString("en-US", { timeZone:"America/Chicago" });

  /* ── 1. Google Sheets ── */
  const sheetsRow = {
    sheetName:      "Turnkey Web",
    timestamp:      submittedAt,
    firstName:      payload.firstName || "",
    company:        payload.company   || "",
    email:          payload.email     || "",
    phone:          payload.phone     || "",
    industry:       payload.industry === "Other" ? (payload.otherIndustry || "Other") : (payload.industry || ""),
    existingWebsite:payload.existingWebsite || "",
    projectType:    payload.projectType || "",
    pageCount:      payload.pageCountBand || "",
    timeline:       payload.timeline || "",
    budget:         payload.budgetBand || "",
    goals:          (payload.goals    || []).join(", "),
    features:       (payload.features || []).join(", "),
    notes:          payload.notes     || "",
    estimateRange:  estimate.formattedRange || "",
    selectedTier:   selectedTierName,
    selectedPrice:  selectedTierPrice
  };

  try{
    fetch(SHEETS_WEBHOOK, {
      method:"POST",
      mode:"no-cors",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(sheetsRow)
    });
  } catch(e){ console.warn("Sheets webhook error", e); }

  /* ── 1b. TK Web tier update — updates the lead row with selected tier ── */
  try{
    const tierUpdateData = {
      source:          "TK Web Tier Selection",
      email:           payload.email || "",
      estimateRange:   estimate.formattedRange,
      selectedTier:    `${selectedTierName} (${selectedTierPrice})`,
      tierOptions:     (stored.tiers || []).map(t => `${t.name}: ${t.priceLabel}`).join(" | "),
      submittedAt:     new Date().toISOString(),
      name:            payload.firstName || "",
      company:         payload.company   || "",
      phone:           payload.phone     || "",
      industry:        (payload.industry === "Other" ? (payload.otherIndustry || "").trim() || "Other" : payload.industry) || "",
      existingWebsite: payload.existingWebsite || "",
      projectType:     estimate.recommendedPackage || "",
      pageCount:       payload.pageCountBand || "",
      timeline:        payload.timeline    || "",
      budgetBand:      payload.budgetBand  || "",
      goals:           (payload.goals    ||[]).join(", "),
      features:        (payload.features ||[]).join(", "),
      notes:           payload.notes       || ""
    };
    submitToWebhook(tierUpdateData).catch(err =>
      console.warn("Tier update webhook error:", err)
    );
  } catch(e){ console.warn("Tier update error", e); }

  /* ── 2. Slack notification — routed via GAS webhook ── */
  try{
    fetch(SHEETS_WEBHOOK, {
      method:"POST",
      mode:"no-cors",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...sheetsRow, _slackNotify: true,
        slackText: `:zap: *New Turnkey Web Quote*\n*${payload.firstName || "Lead"} · ${payload.company || ""}*  |  ${payload.email || "—"}  |  ${payload.phone || "—"}\n*Project:* ${payload.projectType || "—"} · ${payload.pageCountBand || ""}  |  *Timeline:* ${payload.timeline || "—"}\n*Estimate:* ${estimate.formattedRange || "—"}  |  *Selected:* ${selectedTierName} (${selectedTierPrice})${payload.notes ? "\n*Notes:* " + payload.notes : ""}\n_${submittedAt} CT_`
      })
    });
  } catch(e){ console.warn("Slack relay error", e); }

  /* ── 3. Success state ── */
  btn.textContent = "✓ Quote Submitted!";
  btn.style.background = "linear-gradient(135deg,#10B981,#059669)";

  const addonsEl = document.getElementById("result-addons");
  if(addonsEl){
    addonsEl.textContent = "We've got your quote — Ricky will be in touch within one business day to confirm your scope and next steps.";
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  const submitBtn = document.getElementById("result-submit-btn");
  if(submitBtn) submitBtn.addEventListener("click", submitQuoteLead);
});

/* ── OPEN / CLOSE OFFER SHEET ── */
function openOfferExperience(){
  if(!successPanel) return;
  successPanel.classList.remove("hidden");
  successPanel.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  setTimeout(()=>{
    successPanel.classList.add("is-visible");
    offerDialog?.focus();
    setTimeout(()=>{ offerDialog?.classList.add("shell-visible"); }, 60);
    setTimeout(()=>{
      document.querySelectorAll(".offer-tier").forEach(c=>{ c.classList.add("tier-visible"); });
    }, 200);
  }, 0);
}
function closeOfferExperience(){
  if(!successPanel) return;
  successPanel.classList.remove("is-visible");
  successPanel.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
  setTimeout(()=>{
    if(!successPanel.classList.contains("is-visible")) successPanel.classList.add("hidden");
  }, 420);
}

/* ── BUILD MAILTO (includes selected tier) ── */
function buildMailto(payload, estimate, tiers=[]){
  const name = [payload.firstName, payload.lastName].filter(Boolean).join(" ") || payload.company || "Project lead";
  const tierSummary = tiers.length
    ? tiers.map(t=>`${t.name}: ${t.priceLabel}`).join(" | ")
    : "Not generated";
  const subject = encodeURIComponent(`Turnkey Web estimate — ${estimate.recommendedPackage} — ${estimate.formattedRange}`);
  const body = encodeURIComponent(
`Hi Ricky,

I completed the Turnkey Web quote builder and would like to move forward.

CONTACT DETAILS
---------------
Name:         ${name}
Company:      ${payload.company || ""}
Email:        ${payload.email   || ""}
Phone:        ${payload.phone   || ""}
Industry:     ${payload.industry|| ""}

PROJECT DETAILS
---------------
Project type: ${estimate.recommendedPackage}
Timeline:     ${payload.timeline    || ""}
Budget band:  ${payload.budgetBand  || ""}
Page count:   ${payload.pageCountBand|| ""}
Goals:        ${(payload.goals    ||[]).join(", ") || "None listed"}
Features:     ${(payload.features ||[]).join(", ") || "None listed"}
Notes:        ${payload.notes || ""}

QUOTE
-----
Estimate range: ${estimate.formattedRange}
Tier options:   ${tierSummary}
Selected tier:  [not yet selected — please reply with your preferred option]
Add-ons noted:  ${estimate.addOns.join(", ") || "None"}

Please send me the next steps to get started.
`
  );
  return `mailto:rickyw@turnkeyweb.org?subject=${subject}&body=${body}`;
}

/* ── RENDER PREVIEW CARD ── */
function renderPreview(payload){
  const est = computeEstimate(payload);
  setText("preview-package",       est.recommendedPackage);
  setText("preview-range",         est.formattedRange);
  setText("preview-confidence",    est.confidence.toUpperCase());
  setText("preview-pages",         payload.pageCountBand || "2-3 pages");
  setText("preview-timeline",      payload.timeline      || "Next 30-60 days");
  setText("preview-goals-count",   String(payload.goals.length));
  setText("preview-features-count",String(payload.features.length));
  setText("preview-addons",        est.addOns.length ? est.addOns.join(", ") : "No extra add-ons suggested yet.");
  setText("preview-rationale",     est.rationale.join(" – "));
  setText("preview-monthly", `$250 setup + $50/mo`);
  return est;
}

/* ── UPDATE LOCK STATE ── */
function updateLockState(){
  const hasEmail = validEmail(emailInput?.value);
  const unlocked = estimateUnlocked && hasEmail;
  estimateCard?.classList.toggle("locked",!unlocked);
  if(statusNode){
    if(!hasEmail) statusNode.textContent = "Enter your email last and press Complete estimate to reveal your three quote options.";
    else if(!estimateUnlocked) statusNode.textContent = "Press Complete estimate to open your custom quote page.";
    else statusNode.textContent = "Your custom quote page is ready — choose your tier above.";
  }
  return unlocked;
}
function updateChoicePills(){
  document.querySelectorAll(".choice-pill").forEach(pill=>{
    pill.classList.toggle("is-selected", Boolean(pill.querySelector("input")?.checked));
  });
}

/* ── RENDER SUCCESS / OFFER PAGE ── */
function renderSuccess(estimate, payload){
  const tiers = buildTierOptions(estimate, payload);
  renderTierOptions(tiers);

  setText("result-package", `Here's your custom quote${payload.firstName ? ", " + payload.firstName : ""}.`);
  setText("result-range", `$250 setup + $50/mo`);
  setText("result-addons",
    estimate.addOns.length
      ? `Already included in your monthly plan: ${estimate.addOns.join(", ")}. Unlimited pages and unlimited updates are part of every tier.`
      : "Unlimited pages, unlimited updates, hosting, and on-page SEO are part of every tier — no add-ons needed."
  );
  setText("result-rationale",
    `One flat $250 setup fee for any size site, then $50/mo covering hosting, management, and unlimited updates. Pick a tier below and email to lock it in.`
  );
  const noteEl = document.getElementById("result-lead-id"); if(noteEl) noteEl.style.display="none";

  const link = document.getElementById("result-onboarding-link");
  if(link){
    link.href = buildMailto(payload, estimate, tiers);
    link.textContent = "Email to lock in your quote";
  }

  persistOfferData({ payload, estimate, tiers, mailto: link?.href, generatedAt: new Date().toISOString() });
  openOfferExperience();
}

/* ── SUBMIT HANDLER ── */
async function submitEstimate(e){
  e.preventDefault();
  const payload = getPayload();
  if(!payload || !quoteForm.reportValidity()) return;

  estimateUnlocked = true;
  const unlocked = updateLockState();
  if(!unlocked){ emailInput?.focus(); return; }

  const estimate = renderPreview(payload);
  const btn = document.getElementById("estimate-submit");
  if(btn){ btn.disabled=true; btn.textContent="Preparing quote..."; }

  try{
    /* Fire lead capture to TK Web sheet (non-blocking) */
    const leadData = buildLeadCapturePayload(payload, estimate);
    submitToWebhook(leadData).catch(err =>
      console.warn("Lead capture webhook error:", err)
    );

    renderSuccess(estimate, payload);
    if(statusNode) statusNode.textContent = "Opening your custom quote now.";
  } catch(err){
    renderSuccess(estimate, payload);
  } finally{
    if(btn){ btn.disabled=false; btn.textContent="Complete estimate"; }
  }
}

/* ── EVENT LISTENERS ── */
quoteForm?.addEventListener("input", ()=>{
  updateChoicePills();
  const p = getPayload();
  if(p) renderPreview(p);
  if(!validEmail(emailInput?.value)){ estimateUnlocked=false; }
  updateLockState();
});
quoteForm?.addEventListener("change", updateChoicePills);
quoteForm?.addEventListener("submit", submitEstimate);

offerCloseBtn?.addEventListener("click", closeOfferExperience);
successPanel?.addEventListener("click", e=>{
  if(e.target?.hasAttribute("data-offer-close")) closeOfferExperience();
});
document.addEventListener("keydown", e=>{
  if(e.key==="Escape" && successPanel?.classList.contains("is-visible")) closeOfferExperience();
});

/* ── SCROLL REVEAL ── */
function revealOnScroll(){
  document.querySelectorAll("[data-reveal-delay]").forEach(n=>{
    n.style.setProperty("--reveal-delay",`${Number(n.dataset.revealDelay||0)}ms`);
  });
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){ entry.target.classList.add("in-view"); obs.unobserve(entry.target); }
    });
  },{threshold:0.12});
  document.querySelectorAll("[data-reveal]").forEach(n=>obs.observe(n));
}

/* ── GLOW CARDS ── */
function bindGlowCards(){
  document.querySelectorAll(".glow-card").forEach(card=>{
    card.addEventListener("pointermove", e=>{
      const r = card.getBoundingClientRect();
      card.style.setProperty("--glow-x",`${((e.clientX-r.left)/r.width)*100}%`);
      card.style.setProperty("--glow-y",`${((e.clientY-r.top)/r.height)*100}%`);
    });
  });
}

/* ── PARALLAX ── */
function bindParallax(){
  const nodes = Array.from(document.querySelectorAll("[data-parallax]"));
  if(!nodes.length || window.innerWidth<900) return;
  const apply = ()=>{
    const vh = window.innerHeight||1;
    nodes.forEach(n=>{
      const r = n.getBoundingClientRect();
      const s = Number(n.dataset.parallax||10);
      const t = Math.max(Math.min((r.top+r.height/2-vh/2)/vh,1),-1)*s;
      n.style.transform=`translate3d(0,${t}px,0)`;
    });
  };
  apply();
  let tick=false;
  window.addEventListener("scroll",()=>{
    if(tick) return; tick=true;
    requestAnimationFrame(()=>{ apply(); tick=false; });
  },{passive:true});
}

/* ── NAV SCROLL STATE ── */
function bindNav(){
  const nav = document.querySelector(".top-nav");
  if(!nav) return;
  const check = ()=> nav.classList.toggle("scrolled", window.scrollY>20);
  window.addEventListener("scroll", check, {passive:true});
  check();

  const hb = document.querySelector(".nav-hamburger");
  const mn = document.querySelector(".mobile-nav");
  if(hb && mn){
    hb.addEventListener("click",()=>{
      hb.classList.toggle("open");
      mn.classList.toggle("open");
    });
    mn.querySelectorAll("a").forEach(a=>{
      a.addEventListener("click",()=>{ hb.classList.remove("open"); mn.classList.remove("open"); });
    });
  }
}

/* ── Sitewide ambient aurora — inject once per page ── */
function injectAurora(){
  if(document.querySelector('.tkw-aurora')) return;
  const wrap = document.createElement('div');
  wrap.className = 'tkw-aurora';
  wrap.setAttribute('aria-hidden','true');
  wrap.innerHTML =
    '<span class="aur-orb aur-1"></span>'+
    '<span class="aur-orb aur-2"></span>'+
    '<span class="aur-orb aur-3"></span>'+
    '<span class="aur-orb aur-4"></span>';
  document.body.insertBefore(wrap, document.body.firstChild);
}
injectAurora();

/* ── INIT ── */
updateChoicePills();
updateLockState();
if(quoteForm){ renderPreview(getPayload()); }
revealOnScroll();
bindGlowCards();
bindParallax();
bindNav();
