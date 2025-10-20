# iOS8-lite Platform (Tube + Elizabeth)

**What's inside**
- `public/platform-lite.html` — ES5 + XHR + Flex (iOS8 friendly), search + platform filter
- `api/search.js` — builds station list for **tube + elizabeth-line** (accepts 940G metro + 910G rail)
- `api/platform.js` — arrivals for **tube + elizabeth-line**, supports `?platform=` and exposes `availablePlatforms`
- `package.json` — minimal; **no `vercel.json`** to avoid runtime version error

**Deploy on Vercel**
1) New Project → Import this folder (or upload the zip).
2) Environment Variables:
   - `TFL_API_KEY` (required)
   - `TFL_APP_ID`  (optional)
3) Open: `https://<your-domain>/platform-lite.html`
   - Search: “Hammersmith / King's Cross / Liverpool Street / Paddington”
   - Or direct link: `/platform-lite.html?id=940GZZLUKSX&limit=8`
4) For very old iOS (≤9) needing TLS 1.0, front with Cloudflare on a dedicated subdomain.

Generated at 2025-10-20T21:50:22.513037Z
