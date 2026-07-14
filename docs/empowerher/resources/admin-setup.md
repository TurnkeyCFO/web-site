# EmpowerHer admin setup — internal doc (not linked from the public site)

This is for Ricky + Kendra. Two free integrations to activate before launch.

---

## 1. Live chat via Tawk.to (~60 seconds, free forever)

Tawk.to is the most-used live chat tool in the world. 100% free, unlimited
agents, mobile + desktop apps so Kendra can reply from her phone.

**Kendra's steps:**

1. Go to https://www.tawk.to/ and click **Sign up free**.
2. Create an account (email + password). No credit card.
3. When prompted for a property:
   - Property name: `EmpowerHer Fitness`
   - Site URL: `https://turnkeyweb.org/empowerher/`
4. Skip / dismiss any upsells. Stay on the free plan.
5. Download the Tawk.to mobile app (iOS + Android) so chats ring her phone.
6. In the Tawk.to dashboard, go to **Administration → Property Settings → Property ID**.
7. Copy the property ID (looks like `66a1f2c3a8e4...`).
8. Send the property ID to Ricky in a text or Slack message.

**Ricky's steps after receiving the property ID:**

1. Edit `assets/js/chat.js`.
2. Replace `'PLACEHOLDER_FOR_KENDRAS_ID'` with Kendra's actual property ID.
3. (Optional) If Tawk.to also provided a custom widget ID, set
   `window.EH_TAWK_WIDGET_ID` in `assets/js/site.js` before `chat.js` loads.
4. Commit + push. Chat live in <5 minutes.

While the placeholder is in place, the Tawk widget does not load. The in-page
contact form is the fallback (works fine on its own — see below).

---

## 2. In-page contact form via formsubmit.co (free, no signup)

The homepage `Message Kendra` block has a real chat-style form (name + email +
message) that POSTs to https://formsubmit.co.

**Kendra's steps:**

1. First time anyone submits the form, formsubmit.co sends Kendra an email to
   `healthcoachingask@gmail.com` asking her to **confirm she wants to receive
   forwarded messages**. She clicks the confirm link.
2. From that point on, every form submission lands in her inbox automatically.
   No login, no dashboard, no fees.

To change the recipient email later, edit `KENDRA_EMAIL` near the top of
`assets/js/chat.js`.

---

## 3. PDFs

Six free PDFs live under `resources/downloads/`. They're real Letter-size
PDFs styled in EmpowerHer brand. To regenerate them after editing the source
HTML in `resources/_pdf-templates/`:

```bash
cd resources/_pdf-templates
python build_pdfs.py
```

Requires Python + Playwright (`pip install playwright && playwright install chromium`).

---

## Notes

- The Tawk.to embed degrades gracefully — if Tawk has an outage, the in-page
  form still works.
- Both tools are free at the volumes EmpowerHer will see.
- No PII is stored on Turnkey's infrastructure.
