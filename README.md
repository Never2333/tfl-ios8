# iOS 8 Lite with Station Search

- Static page: `/platform-lite.html` — iOS8-compatible (ES5 + XHR + Flex) with **station search**.
- API:
  - `/api/search?q=ham` — builds an in-memory station list from TfL on first request and caches (~6h).
  - `/api/platform?id=940G...&limit=8` — arrivals for a station.

## Deploy on Vercel
1) Create project from this folder.
2) Env:
   - `TFL_API_KEY` (required)
   - `TFL_APP_ID` (optional)
3) Open: `https://<domain>/platform-lite.html`
   - Search a station (e.g., "Hammersmith", "King's Cross"), tap a result to load the board.
   - Add to Home Screen on iOS 8 for full-screen app-like experience.

Generated at 2025-10-19T19:49:53.867007Z
