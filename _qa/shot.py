"""QA screenshot helper for Turnkey Web industry landing pages.
Usage: python _qa/shot.py <path-to-index.html>
Writes <slug>_desktop.png and <slug>_mobile.png into _qa/shots/
(OUTSIDE docs/ so screenshots never deploy).
Forces [data-reveal] elements visible so full-page captures are complete.
"""
import sys, asyncio
from pathlib import Path
from playwright.async_api import async_playwright

REVEAL_FIX = "[data-reveal]{opacity:1 !important;transform:none !important;}"
SHOTS_DIR = Path(__file__).resolve().parent / "shots"

async def shot(html_path):
    p = Path(html_path).resolve()
    if not p.exists():
        print(f"ERROR: not found: {p}")
        sys.exit(1)
    slug = p.parent.name
    SHOTS_DIR.mkdir(parents=True, exist_ok=True)
    url = p.as_uri()
    async with async_playwright() as pw:
        b = await pw.chromium.launch()
        for label, vp in (("desktop", {"width": 1440, "height": 900}),
                          ("mobile", {"width": 390, "height": 844})):
            pg = await b.new_page(viewport=vp)
            try:
                await pg.goto(url, wait_until="load", timeout=30000)
            except Exception as e:
                print(f"WARN goto {label}: {e}")
            await pg.wait_for_timeout(1400)
            await pg.add_style_tag(content=REVEAL_FIX)
            await pg.wait_for_timeout(300)
            shot_path = SHOTS_DIR / f"{slug}_{label}.png"
            await pg.screenshot(path=str(shot_path), full_page=True)
            print(f"{label}: {shot_path}")
            await pg.close()
        await b.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python _qa/shot.py <path-to-index.html>")
        sys.exit(1)
    asyncio.run(shot(sys.argv[1]))
