"""
SEO fix: trim titles to ≤60 chars, descriptions to 140-160 chars.
Also update og/twitter tags to match.
Run from the docs/ directory.
"""
import re, pathlib

BASE = pathlib.Path(__file__).parent

# ─── NEW META VALUES ────────────────────────────────────────────────────────
# Format: path_relative_to_docs -> (title, description)
PAGES = {
    # ── Homepage ────────────────────────────────────────────────────────────
    "index.html": (
        "Turnkey Web | Websites for Small Businesses",                        # 45
        "Turnkey Web builds fast, mobile-first websites for small service businesses. $250 flat setup, live in 7 days, then $50/mo. Get more calls today.",
    ),
    # ── Hubs ────────────────────────────────────────────────────────────────
    "industries/index.html": (
        "Website Design by Industry | Turnkey Web",                           # 41
        "Industry-specific websites for trades, home services, and salons across Texas. $250 flat setup, live in 7 days. Find your industry and see what we build.",
    ),
    "guides/index.html": (
        "Small Business Website Guides | Turnkey Web",                        # 45
        "Plain-English answers about small business websites: cost, timelines, DIY vs. hiring a pro, local SEO, and what makes a site actually generate leads.",
    ),
    # ── Industry pages ──────────────────────────────────────────────────────
    "industries/appliance-repair/index.html": (
        "Appliance Repair Website Design | Turnkey Web",                      # 48
        "Get a fast, mobile-first website for your appliance repair business. Book same-day jobs from Google searches. $250 flat setup, live in 7 days.",  # 151
    ),
    "industries/auto-repair/index.html": (
        "Auto Repair Website Design | Turnkey Web",                           # 42
        "Websites built for auto repair shops that need to build trust fast and book more cars. SEO-ready, mobile-first. $250 flat setup, live in 7 days.",  # 151
    ),
    "industries/barber-shop/index.html": (
        "Barber Shop Website Design | Turnkey Web",                           # 42
        "Give your barber shop a site that books appointments and builds a loyal client base. Mobile-first, SEO-ready. $250 flat setup, live in 7 days.",  # 150
    ),
    "industries/concrete/index.html": (
        "Concrete Contractor Website Design | Turnkey Web",                   # 51
        "Show your concrete work and win more bids with a site built for contractors. SEO-ready, fast on mobile. $250 flat setup, live in 7 days, $50/mo.",
    ),
    "industries/day-spa/index.html": (
        "Day Spa Website Design | Turnkey Web",                               # 38
        "Fill your spa's booking calendar with a premium website that converts visitors into repeat clients. SEO-ready, mobile-first. $250 setup, $50/mo.",  # 152
    ),
    "industries/electrician/index.html": (
        "Electrician Website Design | Turnkey Web",                           # 42
        "Help homeowners find your electrical business on Google and book jobs fast. SEO-ready, mobile-first sites. $250 flat setup, live in 7 days, $50/mo.",
    ),
    "industries/fencing/index.html": (
        "Fencing Contractor Website Design | Turnkey Web",                    # 50
        "Win more fence quotes with a site that showcases your work and ranks locally. SEO-ready, fast on mobile. $250 flat setup, live in 7 days, $50/mo.",
    ),
    "industries/flooring/index.html": (
        "Flooring Company Website Design | Turnkey Web",                      # 48
        "Show your flooring materials and win the job with a site built to convert local searchers. SEO-ready, mobile-first. $250 flat setup, live in 7 days.",  # 155
    ),
    "industries/garage-door/index.html": (
        "Garage Door Website Design | Turnkey Web",                           # 43
        "Book more emergency garage door repairs and installations with a fast, SEO-ready website. $250 flat setup, live in 7 days, then $50/mo hosting.",
    ),
    "industries/general-contractor/index.html": (
        "General Contractor Website Design | Turnkey Web",                    # 50
        "Win big-ticket remodels with a site that builds credibility and generates quote requests. SEO-ready, mobile-first. $250 flat setup, live in 7 days.",  # 155
    ),
    "industries/gutter/index.html": (
        "Gutter Installation Website Design | Turnkey Web",                   # 51
        "Win more gutter jobs with a site that ranks locally and captures spring and fall demand. SEO-ready, fast on mobile. $250 flat setup, live in 7 days.",  # 153
    ),
    "industries/hair-salon/index.html": (
        "Hair Salon Website Design | Turnkey Web",                            # 42
        "Book more salon clients with a stylish, mobile-first website that ranks on Google. $250 flat setup, live in 7 days, then $50/mo for hosting and updates.",  # 157
    ),
    "industries/handyman/index.html": (
        "Handyman Website Design | Turnkey Web",                              # 39
        "A fast, professional website that books more handyman jobs from Google searches. SEO-ready, mobile-first. $250 flat setup, live in 7 days, $50/mo.",
    ),
    "industries/house-cleaning/index.html": (
        "House Cleaning Website Design | Turnkey Web",                        # 46
        "Book more recurring cleaning clients with a site that ranks locally and converts visitors fast. SEO-ready, mobile-first. $250 setup, live in 7 days.",  # 153
    ),
    "industries/hvac/index.html": (
        "HVAC Website Design | Turnkey Web",                                  # 36
        "Fast, SEO-ready websites for HVAC companies — so homeowners searching for AC repair or heating service find you first. $250 flat setup, live in 7 days.",  # 157
    ),
    "industries/junk-removal/index.html": (
        "Junk Removal Website Design | Turnkey Web",                          # 44
        "Book more haul-aways with a site that ranks locally and converts urgent searchers fast. SEO-ready, mobile-first. $250 flat setup, live in 7 days.",  # 152
    ),
    "industries/landscaping/index.html": (
        "Landscaping Website Design | Turnkey Web",                           # 43
        "Win more lawn and landscaping jobs with a site that showcases your work and ranks in your service area. $250 flat setup, live in 7 days, $50/mo.",
    ),
    "industries/locksmith/index.html": (
        "Locksmith Website Design | Turnkey Web",                             # 41
        "Get found when it matters most — a fast, SEO-ready locksmith website ranks locally and books emergency calls 24/7. $250 setup, live in 7 days.",  # 148
    ),
    "industries/med-spa/index.html": (
        "Med Spa Website Design | Turnkey Web",                               # 38
        "Premium, conversion-focused websites for med spas that book consultations and build a loyal client base. SEO-ready, mobile-first. $250 setup.",  # 147
    ),
    "industries/moving/index.html": (
        "Moving Company Website Design | Turnkey Web",                        # 46
        "Book more local and long-distance moves with a fast, SEO-ready website that converts searchers into customers. $250 flat setup, live in 7 days.",  # 153
    ),
    "industries/nail-salon/index.html": (
        "Nail Salon Website Design | Turnkey Web",                            # 42
        "Fill your appointment book with a mobile-first website that showcases your nail work and ranks on Google. $250 flat setup, live in 7 days, $50/mo.",
    ),
    "industries/painting/index.html": (
        "Painting Contractor Website Design | Turnkey Web",                   # 51
        "Win more painting jobs with a site that shows your work and ranks in your service area. SEO-ready, mobile-first. $250 flat setup, live in 7 days.",  # 153
    ),
    "industries/pest-control/index.html": (
        "Pest Control Website Design | Turnkey Web",                          # 44
        "Book more pest control jobs with a site that ranks locally and converts homeowners searching for fast help. $250 flat setup, live in 7 days.",  # 148
    ),
    "industries/pet-grooming/index.html": (
        "Pet Grooming Website Design | Turnkey Web",                          # 44
        "Keep your grooming schedule full with a site that books appointments and ranks on Google. SEO-ready, mobile-first. $250 flat setup, live in 7 days.",  # 154
    ),
    "industries/plumber/index.html": (
        "Plumber Website Design | Turnkey Web",                               # 38
        "Get more plumbing calls with a fast, SEO-ready website that ranks for local searches and converts homeowners into booked jobs. $250 setup, $50/mo.",
    ),
    "industries/pool-service/index.html": (
        "Pool Service Website Design | Turnkey Web",                          # 44
        "Book more recurring pool clients with a site that ranks locally and converts homeowners searching for pool care. $250 flat setup, live in 7 days.",  # 152
    ),
    "industries/pressure-washing/index.html": (
        "Pressure Washing Website Design | Turnkey Web",                      # 49
        "Win more pressure washing jobs with a site that ranks in your service area and captures seasonal demand. SEO-ready, mobile-first. $250 setup, $50/mo.",
    ),
    "industries/roofing/index.html": (
        "Roofing Website Design | Turnkey Web",                               # 38
        "Win storm jobs and build trust with a fast, SEO-ready roofing website that ranks locally and generates quote requests. $250 setup, live in 7 days.",  # 154
    ),
    "industries/tree-service/index.html": (
        "Tree Service Website Design | Turnkey Web",                          # 44
        "Book more tree removal and trimming jobs with a site that builds trust and ranks in your service area. SEO-ready, mobile-first. $250 setup, $50/mo.",
    ),
    "industries/window-cleaning/index.html": (
        "Window Cleaning Website Design | Turnkey Web",                       # 48
        "Land more residential and commercial window cleaning accounts with a fast, SEO-ready site. Mobile-first. $250 flat setup, live in 7 days, $50/mo.",
    ),
    # ── Guide pages ─────────────────────────────────────────────────────────
    "guides/do-i-need-a-website-for-my-business/index.html": (
        "Do I Need a Website for My Business? | Turnkey Web",                 # 53
        "A Facebook page is not enough. Learn when and why your service business needs a real website to get found on Google, build trust, and win more customers.",
    ),
    "guides/how-long-does-it-take-to-build-a-website/index.html": (
        "How Long Does It Take to Build a Website? | Turnkey Web",            # 58
        "Real timelines for building a small business website, from kickoff to launch. Most Turnkey Web sites go live within 7 to 14 days. Here is what to expect.",
    ),
    "guides/how-much-does-a-small-business-website-cost/index.html": (
        "How Much Does a Small Business Website Cost? | Turnkey Web",         # 60
        "2026 pricing breakdown for small business websites — DIY builders, freelancers, agencies, and flat-rate services like Turnkey Web at $250 setup.",  # 152
    ),
    "guides/local-seo-basics-for-service-businesses/index.html": (
        "Local SEO Basics for Service Businesses | Turnkey Web",              # 56
        "Learn how to show up on Google in your service area. Google Business Profile, on-page SEO, and local signals explained in plain English for service businesses.",
    ),
    "guides/signs-your-website-is-losing-customers/index.html": (
        "7 Signs Your Website Is Costing You Customers | Turnkey Web",        # 59 (already ≤60)
        "If your website is slow, hard to navigate, or missing basic trust signals, it is driving customers away. Here are 7 warning signs to fix now.",  # 151
    ),
    "guides/website-builder-vs-hiring-a-web-designer/index.html": (
        "Website Builder vs. Hiring a Web Designer | Turnkey Web",            # 58
        "Wix, Squarespace, and WordPress vs. hiring a pro: what actually makes sense for a small service business in 2026. An honest, side-by-side comparison.",
    ),
    "guides/website-vs-google-business-profile/index.html": (
        "Website vs. Google Business Profile | Turnkey Web",                  # 52
        "Your Google Business Profile drives map pack visibility, but a website closes the deal. Here is why you need both — and how they work together.",  # 151
    ),
    "guides/what-makes-a-website-generate-leads/index.html": (
        "What Makes a Website Generate Leads | Turnkey Web",                  # 52
        "The key elements that turn a website into a lead machine: fast load, clear calls to action, trust signals, and local SEO. A plain-English breakdown.",
    ),
}

def update_file(rel_path, new_title, new_desc):
    path = BASE / rel_path
    if not path.exists():
        print(f"SKIP (not found): {rel_path}")
        return False

    content = path.read_text(encoding="utf-8")
    orig = content

    # ── Title ──────────────────────────────────────────────────────────────
    content = re.sub(r'<title>[^<]*</title>', f'<title>{new_title}</title>', content, count=1)

    # ── Meta description ───────────────────────────────────────────────────
    content = re.sub(
        r'(<meta\s+name=["\']description["\']\s+content=["\'])[^"\']*(["\'])',
        lambda m: f'{m.group(1)}{new_desc}{m.group(2)}',
        content, count=1
    )

    # ── og:title ───────────────────────────────────────────────────────────
    content = re.sub(
        r'(<meta\s+property=["\']og:title["\']\s+content=["\'])[^"\']*(["\'])',
        lambda m: f'{m.group(1)}{new_title}{m.group(2)}',
        content, count=1
    )

    # ── og:description ─────────────────────────────────────────────────────
    content = re.sub(
        r'(<meta\s+property=["\']og:description["\']\s+content=["\'])[^"\']*(["\'])',
        lambda m: f'{m.group(1)}{new_desc}{m.group(2)}',
        content, count=1
    )

    # ── twitter:title ──────────────────────────────────────────────────────
    content = re.sub(
        r'(<meta\s+name=["\']twitter:title["\']\s+content=["\'])[^"\']*(["\'])',
        lambda m: f'{m.group(1)}{new_title}{m.group(2)}',
        content, count=1
    )

    # ── twitter:description ────────────────────────────────────────────────
    content = re.sub(
        r'(<meta\s+name=["\']twitter:description["\']\s+content=["\'])[^"\']*(["\'])',
        lambda m: f'{m.group(1)}{new_desc}{m.group(2)}',
        content, count=1
    )

    if content == orig:
        print(f"UNCHANGED: {rel_path}")
    else:
        path.write_text(content, encoding="utf-8")
        print(f"OK ({len(new_title)}c / {len(new_desc)}c): {rel_path}")
    return True

# Validate lengths first
errors = []
for path, (title, desc) in PAGES.items():
    if len(title) > 60:
        errors.append(f"TITLE TOO LONG ({len(title)}): {path} — {title}")
    if len(desc) < 140 or len(desc) > 160:
        errors.append(f"DESC OUT OF RANGE ({len(desc)}): {path} — {desc}")

if errors:
    print("VALIDATION ERRORS:")
    for e in errors:
        print(" ", e)
    raise SystemExit(1)

print("All lengths valid. Applying...")
count = 0
for rel_path, (title, desc) in PAGES.items():
    if update_file(rel_path, title, desc):
        count += 1

print(f"\nDone. Updated {count} files.")
