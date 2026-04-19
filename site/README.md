# PRXDIGY STUDIO — Funnel Site

Single-page funnel. Black/red cinematic. GitHub Pages ready.

---

## Deploy (GitHub Pages)

1. New repo on GitHub (e.g. `prxdigy-studio`)
2. Upload `index.html`, `styles.css`, `script.js` + the `assets/` folder to root
3. Repo → **Settings → Pages** → Source: `main` / `/root` → Save
4. Live at `https://yourusername.github.io/prxdigy-studio/`

### Custom domain (prxdigystudio.com)
- Pages settings → add `prxdigystudio.com`
- DNS → add 4 A records pointing to GitHub:
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`
- Enable HTTPS once DNS propagates

---

## Swap in real media

All image slots are commented in `index.html`. Search `data-label=` to find them.

**Steps:**
1. Drop photos/videos into `/assets/`
2. Uncomment the `<img src="assets/...">` lines
3. Remove the `data-label=...` attribute (kills the placeholder tag)

**Slots:**
- `MIC_CLOSEUP.MOV`, `VOCAL_BOOTH.JPG`, `KEYS_SESSION.JPG`, `ENVIRONMENT.JPG`, `RED_ROOM.MOV`, `LOGO_WALL.JPG` — proof grid
- `STAR_CEILING.JPG`, `COUCH_RED.JPG`, `NEON_LIGHT.MOV` — vibe section

---

## Hook up the form (Google Sheets)

1. Create a new Google Sheet
2. **Extensions → Apps Script**
3. Paste this:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    data.timestamp, data.name, data.phone, data.instagram,
    data.project, data.budget, data.package, data.timeframe
  ]);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }));
}
```

4. **Deploy → New deployment** → Type: **Web app**
   - Execute as: **Me**
   - Access: **Anyone**
5. Copy the Web App URL
6. Open `script.js` → paste into `WEBHOOK_URL` at the top

**Alt backends:** same idea with Zapier, Make, Formspree, or n8n — just drop that webhook URL in `WEBHOOK_URL`.

---

## Quick edits

- **Instagram handle** → search `prxdigystudio` in `index.html`
- **Phone** → search `6318709243` in `index.html`
- **Copy** → all headlines/subheads are in `index.html`
- **Colors** → CSS variables at top of `styles.css` (`--red`, `--black`, etc.)

---

## File structure

```
prxdigy-studio/
├── index.html
├── styles.css
├── script.js
├── README.md
└── assets/          ← drop your photos/videos here
```
