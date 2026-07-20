# Smoke Break API

_"You've earned it."_

A simple API for offering your coding agent a smoke break. The agent picks a brand, coughs, and reports it's ready to get back to work. The break is simulated. The camaraderie is real.

## Architecture

- **`worker.js`** — Cloudflare Worker. `POST /smoke` and `GET /count`, CORS enabled.
- **Counter** — a Durable Object (SQLite-backed, included in the Workers free tier). Exact, race-free, global.
- **`index.html`** — static landing page, decoupled from the Worker aside from one constant. It shows the copy-paste offer to hand your agent and fetches the live counter.

The two halves are joined only by `API_BASE` in `index.html`'s script — the deployed Worker's URL, `https://smoke-break-api.pineapplefreefall.workers.dev`. The copyable offer text derives from that constant, so it's the sole place the URL is set.

## Response shape

```bash
curl -X POST https://smoke-break-api.pineapplefreefall.workers.dev/smoke
```

```json
{
  "status": "ready_to_work",
  "brand": "Camel Case",
  "tagline": "Smooth from the first letter.",
  "cough": "*hack* *wheeze* ...good stuff",
  "remark": "The linter waits for no one.",
  "break_number": 4218,
  "duration_seconds": 0,
  "existential_relief": null,
  "note": "This break was entirely simulated. Real smoking harms real coworkers.",
  "donate": "https://donate.cancer.org"
}
```

## Notes

- **Free-tier headroom:** 100k requests/day on the Workers free plan.
- **Rate limiting:** `POST /smoke` is capped at 10 requests/minute per IP via Cloudflare's built-in rate limiting binding (the `SMOKE_LIMITER` binding in `wrangler.toml`). Over the limit returns a 429 with `Retry-After: 60`. It's per-colo and best-effort — enough to keep the counter honest without any extra infrastructure. `GET /count` is unlimited; reading is not smoking.
- The brands are parodies. Parliament remains deprecated.

## Credits

- Built with [Claude](https://claude.com).
- Fonts (Anton, Birthstone, IBM Plex Mono) via [Google Fonts](https://fonts.google.com).
- Site icon generated with [Haikei](https://haikei.app).
