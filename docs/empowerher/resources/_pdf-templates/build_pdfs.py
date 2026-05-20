"""Render every PDF template HTML to a real PDF in resources/downloads/."""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).parent
OUT = ROOT.parent / "downloads"
OUT.mkdir(exist_ok=True)

JOBS = [
    ("01-kickstart.html", "7-day-kickstart-guide.pdf"),
    ("02-beginner-strength.html", "beginner-strength-routine.pdf"),
    ("03-macro-cheat-sheet.html", "macro-cheat-sheet.pdf"),
    ("04-home-workout.html", "home-workout-no-equipment.pdf"),
    ("05-grocery-list.html", "grocery-list-fat-loss.pdf"),
    ("06-mindset-reset.html", "mindset-reset-5-habits.pdf"),
]

with sync_playwright() as p:
    browser = p.chromium.launch()
    ctx = browser.new_context()
    page = ctx.new_page()
    for src, dest in JOBS:
        url = (ROOT / src).resolve().as_uri()
        page.goto(url, wait_until="networkidle")
        # Make sure fonts loaded
        page.wait_for_timeout(800)
        out_path = OUT / dest
        page.pdf(
            path=str(out_path),
            format="Letter",
            margin={"top": "0.6in", "bottom": "0.7in", "left": "0.7in", "right": "0.7in"},
            print_background=True,
        )
        size_kb = out_path.stat().st_size // 1024
        print(f"[pdf] {dest} -> {size_kb} KB")
    browser.close()

print("[v3] step 4: all PDFs generated")
