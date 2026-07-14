# Turnkey Web — SEO Guide Articles Build Spec

Build long-form, buyer-intent SEO guide articles for Turnkey Web. These capture
top-of-funnel searches ("how much does a website cost", "do I need a website") and
funnel readers to the pricing + industry pages. They live at `/guides/<slug>/`.

## Copy source / quality bar

**EXEMPLAR:** `docs/guides/how-much-does-a-small-business-website-cost/index.html` — built
and verified. Copy its full structure, `<head>`, `<style>` block, and section skeleton.
Rewrite 100% of the article content for your assigned topic.

## Output

`docs/guides/<slug>/index.html` — create the folder.

## Hard rules

- Reuse the design system: link `../../styles.css?v=8`, `../../site.js?v=13`,
  `../../assets/tkweb-logo.png` / `tkweb-logo-white.png`. Keep the exemplar's `<style>`
  block verbatim. Brand is purple/blue — never Turnkey CFO emerald.
- Relative paths from `docs/guides/<slug>/index.html`: root pages `../../` (pricing.html,
  work.html, index.html, industries/), guides hub `../index.html`.
- Pricing facts FIXED: $250 flat setup, $50/mo (hosting + management + unlimited updates),
  first draft in 7 days, live in 2–3 weeks, unlimited revisions, cancel anytime.
- Turnkey Web — Austin TX, works with small businesses nationwide.
- No emojis in body copy. No fabricated statistics presented as measured fact — use
  directional framing ("most", "typically", "often"). Genuinely useful, honest content.
- Touch ONLY your assigned `docs/guides/<slug>/` folders.

## Required structure (every guide)

1. `<head>` — full SEO block (see below) + the exemplar's `<style>` block verbatim.
2. Energy background — copy verbatim.
3. Nav + mobile-nav — copy verbatim from the exemplar (note: nav-actions has a "Guides"
   ghost button + "Build your quote"; mobile-nav includes a Guides link).
4. `article-hero` — breadcrumb, eyebrow, H1 (the article title), `.article-lede`
   (2–3 sentence hook), `.article-meta` (Turnkey Web · X min read · Updated May 2026).
5. `article-body > .container.prose` — the article:
   - A 1–2 paragraph intro.
   - 6–9 `<h2>` sections of genuinely useful, specific content.
   - At least one `.prose-table` OR `.callout` where it earns its place.
   - Bullet lists where they aid scanning.
   - **Two `.inline-cta` blocks** — one mid-article, one near the end (to pricing/quote).
   - A **visible "Common questions" FAQ** section using `.faq-accordion` / `.faq-item`
     with 5 Q&As — these MUST match the FAQPage JSON-LD word-for-word.
   - A `.guide-foot-nav` block linking the guides hub + industries.
6. Footer — copy verbatim.

## `<head>` SEO requirements

- `<title>`: `<Article Title> | Turnkey Web` (keep under ~60 chars where possible)
- `<meta name="description">`: compelling, specific, ~150 chars
- `<link rel="canonical" href="https://turnkeyweb.org/guides/<slug>/">`
- robots `index, follow, max-image-preview:large`
- Open Graph + Twitter tags (`og:type` = `article`)
- **3 JSON-LD blocks:** `Article`, `BreadcrumbList`, `FAQPage`. FAQPage entries mirror the
  visible FAQ word-for-word. datePublished/dateModified = `2026-05-17`.

## Tone

Helpful, plain-English, honest, confident. Written for a small business owner, not an SEO.
Genuinely answer the question — earn the ranking. Naturally position Turnkey Web's flat-fee
model as the sensible option without being a hard sell. No jargon, no hype, no guarantees.

## Playwright iteration — REQUIRED

After writing each guide:
1. `python _qa/shot.py docs/guides/<slug>/index.html` (run from TurnkeyWEB-launchpad dir)
2. Read `_qa/shots/<slug>_desktop.png` and `_qa/shots/<slug>_mobile.png`
3. Review both: readable prose width? table/callout render? CTAs styled? mobile clean?
4. Fix and re-screenshot. Iterate until both viewports are clean and professional.

## Topic briefs

`how-much-does-a-small-business-website-cost` is the exemplar (already built).

| slug | Title | Angle / what to cover |
|---|---|---|
| do-i-need-a-website-for-my-business | Do I Need a Website for My Business? (When a Facebook Page Isn't Enough) | The owner who relies on Facebook/word-of-mouth. Why a site still matters: you don't own social, search happens on Google, credibility, control, found 24/7. Honest about when social is enough. |
| website-builder-vs-hiring-a-web-designer | Website Builder vs. Hiring a Web Designer: Which Is Right for You? | Wix/Squarespace DIY vs. hiring a pro. True cost of "free" (your time), quality/SEO gap, when DIY is fine, when it isn't. Flat-fee as the middle path. |
| how-long-does-it-take-to-build-a-website | How Long Does It Take to Build a Website? | Realistic timelines by path (DIY, freelancer, agency, flat-fee). What actually slows projects down (content, revisions, indecision). Turnkey Web's 7-day first draft. |
| signs-your-website-is-losing-customers | 7 Signs Your Website Is Costing You Customers | A checklist article: slow load, not mobile-friendly, no clear CTA, dated design, no reviews shown, hard to contact, invisible on Google. Each sign + the fix. |
| what-makes-a-website-generate-leads | What Makes a Small Business Website Actually Generate Leads? | Beyond "looking nice" — the elements that convert: fast load, one clear CTA, click-to-call, trust signals, simple forms, local SEO. The difference between a brochure and a lead machine. |
| local-seo-basics-for-service-businesses | Local SEO Basics: How to Show Up on Google in Your Service Area | Plain-English local SEO: Google Business Profile, "near me" searches, NAP consistency, reviews, local-targeted pages, on-page basics. What a service business can actually do. |
| website-vs-google-business-profile | Why Your Service Business Needs a Website (Not Just a Google Listing) | The owner who thinks a Google Business Profile is enough. What a GBP does well, what it can't do (own your brand, full story, convert, rank for non-local terms). They work together — you need both. |

## Done criteria (per guide)

- 6–9 substantive H2 sections, genuinely useful, specific to the topic.
- Visible FAQ (5 Q&As) matching the FAQPage JSON-LD word-for-word.
- All 3 JSON-LD blocks present; canonical + OG correct.
- Desktop + mobile screenshots reviewed and confirmed clean.
- No file outside `docs/guides/<slug>/` modified.
