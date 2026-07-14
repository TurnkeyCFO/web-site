# Turnkey Web — Industry Landing Page Build Spec

Build deeply-tailored vertical landing pages for Turnkey Web (a website design/dev
business, Austin TX). Each page sells **why that specific industry needs a great
website** and pitches Turnkey Web's service. Model: the tailoring depth of
`turnkeycfo.com/churches`, but for website development.

## Copy source / quality bar

**EXEMPLAR:** `docs/industries/plumber/index.html` — already built and verified.
Copy its full structure, `<head>`, `<style>` block, and section skeleton **exactly**.
Then **rewrite 100% of the content** for your assigned industry. Never just swap the
word "plumber" — every section is written fresh for the industry.

## Output

`docs/industries/<slug>/index.html` (one folder per industry). Create the folder.

## Hard rules

- **Reuse the design system.** Link `../../styles.css?v=8`, `../../site.js?v=13`,
  `../../assets/tkweb-logo.png`, `../../assets/tkweb-logo-white.png`. Keep the
  exemplar's page-specific `<style>` block. Do NOT invent colors or fonts — the
  brand is purple/blue, already in `styles.css`. Never use Turnkey CFO emerald.
- **Relative paths** from `docs/industries/<slug>/index.html`: root pages = `../../`
  (e.g. `../../pricing.html`, `../../work.html`, `../../index.html`); hub = `../index.html`.
- **Pricing facts are FIXED — never alter:** $250 flat setup (any size site),
  $50/mo (hosting + management + unlimited updates), first draft in 7 days, live in
  2–3 weeks, unlimited revisions, cancel anytime, free 15-min Calendly call.
- **Company facts:** Turnkey Web, Austin TX, serves Texas. `areaServed` = Texas.
- **No fabricated measured stats.** Use directional framing ("most", "≈", "typically",
  "industry studies suggest"). Testimonials are tasteful + clearly generic
  (first name + last initial + generic role, e.g. "Owner · Local HVAC Company").
- **Do NOT touch** any file outside your assigned `docs/industries/<slug>/` folders.
- **No emojis in body copy.** Icon glyphs inside cards (the `.ic` span, proof items,
  process `.step-icon`) are fine — match the exemplar's usage.

## Required page structure (every page, in this order)

1. `<head>` — full SEO block (see below)
2. Energy background `<div class="energy-bg">` — copy verbatim
3. Nav + mobile-nav — copy verbatim (links are industry-agnostic; keep the
   `Industries` link to `../index.html`)
4. **Hero** — breadcrumb, eyebrow `Websites for <industry>`, H1 hook (industry-specific,
   with one `<span class="shimmer">` phrase), `.hero-text`, 3 `.hero-actions`,
   `.trust-bar` (4 pills), `.hero-metrics` (3 `.metric-card`)
5. **Proof banner** — 5 `.proof-item`s (tailor 1–2 to the industry)
6. **Problem section** — `.section-heading` + `.compare-grid`: a "good" column
   (6 items: what a Turnkey Web site does) and a "bad" column (6 items: what's
   costing them jobs/clients today). THE core "why you need a website" section —
   make it sharply industry-specific.
7. **What we build** — `.section-heading` + `.insight-grid` (6 `.insight-card`,
   each `.ic` icon + `<h3>` + `<p>`), tailored to the industry's real needs.
8. **Deeper why** — `.section-heading` + `.case-grid` (4 `.case-card`): why a
   website wins *for this industry specifically* (the buying behavior, the trust
   dynamic, the search behavior, the seasonality/visual/booking angle).
9. **Live example** — `.showcase-stack` with one `.showcase-row`. If your industry
   has a demo (see brief table), link it. Otherwise link `../../work.html` and use a
   relevant Unsplash photo (`https://images.unsplash.com/photo-XXXXX?auto=format&fit=crop&w=1200&q=70`).
10. **Process** — 6-step `.process-track` — copy structure; tailor step 03
    (questionnaire) wording to the industry.
11. **Testimonials** — `.reviews-section` with 3 `.review-card`s, industry-relevant.
12. **Value band** — dark `.value-band`: $250 / $50/mo / "1 job/client pays for it".
13. **FAQ** — `.faq-accordion` with 7 `.faq-item`s answering that industry's real
    objections, then the `.closing-cta`.
14. **Footer** — copy; tailor only the `.footer-bottom` industry tag line.

## `<head>` SEO requirements

- `<title>`: `<Industry> Website Design | Turnkey Web — <short benefit>`
- `<meta name="description">`: industry-specific, mentions "$250" and "7 days"
- `<link rel="canonical" href="https://turnkeyweb.org/industries/<slug>/">`
- `<meta name="robots" content="index, follow, max-image-preview:large">`
- Open Graph + Twitter card tags (industry-specific title/description)
- **3 JSON-LD blocks:** `ProfessionalService`, `BreadcrumbList`, `FAQPage`.
  The `FAQPage` entries must mirror the 7 visible FAQ Q&As **word for word**.
- Calendly helper script (copy verbatim; change the `utm_source` slug)

## Playwright iteration — REQUIRED, do not skip

After writing each page:
1. Run: `python _qa/shot.py docs/industries/<slug>/index.html`
   (run from the `TurnkeyWEB-launchpad` directory)
2. Read `_qa/shots/<slug>_desktop.png` and `_qa/shots/<slug>_mobile.png`
3. Critically review both: broken layout? text overflow? empty/cramped sections?
   weak contrast? mobile too tight? missing CTA? misaligned grid? placeholder text?
4. Fix the HTML and re-screenshot. **Iterate as many times as needed** until both
   desktop and mobile are genuinely beautiful, functional, and perfect.
5. A page is "done" only after you have visually confirmed it on both viewports.

## Industry brief table

`plumber` is already built (the exemplar). Build your assigned slugs below.

| slug | Display name | Primary keyword | Angle / key pains / what to emphasize | Demo to link |
|---|---|---|---|---|
| electrician | Electrician | electrician website design | Safety + licensed-trust; emergency outages, panel upgrades, code work. Emphasize licensed/insured/permits, emergency response, "electrician near me". | turnkeycfo.github.io/site-capital-electric-atx |
| hvac | HVAC | HVAC website design | Seasonal urgency (no AC in a TX summer / no heat); maintenance plans; financing on installs. Emphasize seasonal lead capture, maintenance-plan signups, financing, fast booking. | turnkeycfo.github.io/site-capital-hvac |
| roofing | Roofing | roofing website design | Storm damage + insurance claims; big-ticket trust; free inspections. Emphasize storm response, insurance-claim help, project gallery, financing, trust badges. | turnkeycfo.github.io/site-summit-roofing-atx |
| landscaping | Landscaping | landscaping website design | Visual portfolio is everything; recurring maintenance vs one-time design/install; curb appeal. Emphasize photo gallery, recurring-service signups, seasonal. | turnkeycfo.github.io/site-texas-lawn-pros |
| tree-service | Tree Service | tree service website design | High-risk work → insured/certified-arborist trust; emergency storm removal; free estimates. Emphasize insurance/certification, emergency, estimates. | turnkeycfo.github.io/site-austin-tree-service |
| general-contractor | General Contractor | general contractor website design | Big-ticket remodels; long sales cycle; project credibility + process. Emphasize project gallery, transparent process, licensing, financing. | turnkeycfo.github.io/site-lone-star-builders |
| painting | Painting | painting contractor website design | Before/after visual sells; free estimates; interior/exterior; residential vs commercial. Emphasize gallery, fast estimates, color consults. | (link ../../work.html) |
| handyman | Handyman | handyman website design | Broad service list; reliability/trust; "no job too small"; small jobs compound. Emphasize service list, easy booking, reliability, reviews. | (link ../../work.html) |
| pest-control | Pest Control | pest control website design | Recurring plans are the business model; infestation urgency; seasonal pests; safe for kids/pets. Emphasize recurring-plan signup, urgency, safety, free inspection. | (link ../../work.html) |
| garage-door | Garage Door | garage door website design | Emergency repair (broken spring, stuck door) + new install; safety. Emphasize emergency repair, install gallery, fast service. | (link ../../work.html) |
| fencing | Fencing | fencing contractor website design | Visual + material choice (wood/iron/vinyl); quotes; property value; residential/commercial. Emphasize gallery, material options, free quotes. | (link ../../work.html) |
| pool-service | Pool Service | pool service website design | Recurring maintenance/cleaning + repairs + builds; seasonal. Emphasize recurring-service signup, before/after, reliability. | (link ../../work.html) |
| flooring | Flooring | flooring company website design | Showroom feel; material types (hardwood/tile/LVP/carpet); in-home estimates. Emphasize gallery, material guide, free estimate. | (link ../../work.html) |
| concrete | Concrete | concrete contractor website design | Driveways/patios/foundations; big-ticket; durability; project proof. Emphasize project gallery, free estimates, durability/trust. | (link ../../work.html) |
| gutter | Gutter | gutter installation website design | Seasonal (fall); gutter guards; "protect your home from water damage" framing; cleaning + install. Emphasize protection messaging, seasonal, free inspection. | (link ../../work.html) |
| pressure-washing | Pressure Washing | pressure washing website design | Instant dramatic before/after; fast booking; residential/commercial; recurring. Emphasize before/after visuals, instant quotes, curb appeal. | (link ../../work.html) |
| window-cleaning | Window Cleaning | window cleaning website design | Recurring residential + commercial; streak-free; storefront/high-rise. Emphasize recurring plans, commercial accounts, easy booking. | (link ../../work.html) |
| appliance-repair | Appliance Repair | appliance repair website design | Fast diagnostic; brands serviced; same-day; cheaper than replacing. Emphasize brands list, same-day, fast booking, warranty. | (link ../../work.html) |
| locksmith | Locksmith | locksmith website design | 24/7 emergency lockout; security trust (bonded); residential/auto/commercial. Emphasize 24/7 emergency, bonded/trusted, fast response, "locksmith near me". | (link ../../work.html) |
| junk-removal | Junk Removal | junk removal website design | Instant quote; same-day haul-away; upfront pricing; eco/donation. Emphasize instant pricing, same-day, easy booking, before/after. | (link ../../work.html) |
| moving | Moving Company | moving company website design | Quote calculator; trust with belongings; local + long-distance; reviews. Emphasize instant quote, trust/reviews, transparent pricing. | (link ../../work.html) |
| house-cleaning | House Cleaning | house cleaning website design | Recurring service (weekly/biweekly); trust letting someone in the home; easy online booking; move-in/out. Emphasize online booking, recurring plans, vetted/insured trust, instant quote. | (link ../../work.html) |
| auto-repair | Auto Repair | auto repair shop website design | Customers fear getting ripped off → trust/transparency; services list; reviews; ASE-certified. Emphasize transparency, services, reviews, easy appointment booking. | (link ../../work.html) |
| hair-salon | Hair Salon | hair salon website design | Online booking is THE feature; stylist showcase; Instagram-worthy gallery; brand/ambiance. Emphasize booking integration, gallery, stylist bios, brand feel. | turnkeycfo.github.io/site-luxe-hair-studio |
| nail-salon | Nail Salon | nail salon website design | Online booking; nail-art gallery; ambiance; services menu + pricing. Emphasize booking, gallery, services menu. | turnkeycfo.github.io/site-the-nail-bar-atx |
| barber-shop | Barber Shop | barber shop website design | Booking + walk-in; brand/culture/vibe; cut gallery; loyalty. Emphasize booking, brand identity, gallery, location/hours. | (link ../../work.html) |
| med-spa | Med Spa | med spa website design | Premium + high-trust; treatments menu; before/after; consult booking; credentials. Emphasize premium feel, treatment menu, before/after, consult booking, credentials. | (link ../../work.html) |
| day-spa | Day Spa | day spa website design | Packages + gift cards; booking; relaxation/escape brand; services menu. Emphasize gift cards, packages, booking, ambiance. | (link ../../work.html) |
| pet-grooming | Pet Grooming | pet grooming website design | Online booking; adorable before/after photos; trust with people's pets; services by breed/size. Emphasize booking, gallery, trust/care, services. | (link ../../work.html) |

## Done criteria (per page)

- Valid HTML, all sections present and genuinely tailored (no copied plumber copy).
- All 3 JSON-LD blocks present; FAQPage mirrors the visible FAQ.
- Desktop + mobile screenshots reviewed and confirmed beautiful + functional.
- No file outside `docs/industries/<slug>/` modified.
