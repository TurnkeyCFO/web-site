from playwright.sync_api import sync_playwright
sites = {
  "aurora": "https://turnkeyweb.org/previews/aurora-studio/",
  "odyssey": "https://turnkeyweb.org/previews/odyssey/",
  "kinetic": "https://turnkeyweb.org/previews/kinetic-lab/",
}
import os
os.makedirs("_audit", exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,url in sites.items():
        pg=b.new_page(viewport={"width":1440,"height":900})
        errs=[]
        pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(url, wait_until="networkidle"); pg.wait_for_timeout(2500)
        h = pg.evaluate("() => document.body.scrollHeight")
        steps=6
        for i in range(steps):
            y = int((h-900) * i/(steps-1))
            pg.evaluate(f"window.scrollTo(0,{y})"); pg.wait_for_timeout(900)
            pg.screenshot(path=f"_audit/{name}-{i}.png")
        print(f"{name}: height={h} errors={len(errs)} {errs[:2]}")
        pg.close()
    b.close()
