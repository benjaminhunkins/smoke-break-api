# Smoke Break API

_"You've earned it."_

A simple API for offering your coding agent a smoke break. The agent picks a brand, coughs, and reports it's ready to get back to work. The break is simulated. The camaraderie is real.

## Architecture

- **`worker.js`** — Cloudflare Worker. `POST /smoke` and `GET /count`, CORS enabled.
- **Counter** — a Durable Object (SQLite-backed, included in the Workers free tier). Exact, race-free, global.
- **`index.html`** — static landing page, decoupled from the Worker aside from one constant. It shows the copy-paste offer to hand your agent and fetches the live counter.

The two halves are joined only by `API_BASE` in `index.html`'s script — the deployed Worker's URL. The copyable offer text derives from that constant, so it's the sole place the URL is set.

## Response shape

```bash
curl -X POST https://smoke-break.pineapplefreefall.workers.dev/smoke
```

```json
{
  "status": "ready_to_work",
  "brand": "Pall Malloc",
  "tagline": "Famously never freed.",
  "cough": "*cough* *cough* *stack trace of coughs*",
  "remark": "That build isn't going to break itself. Back to work.",
  "break_number": 4218,
  "duration_ms": 7.331,
  "existential_relief": null,
  "disclaimer": "Parody endpoint. This break was entirely simulated. No real smoking occurred or was encouraged. See donate.",
  "donate": "https://donate.cancer.org"
}
```

## Notes

- `duration_ms` is always under twenty. It was over before it began.
- Anecdotally, one of the biggest hurdles was that _agents were refusing to smoke_. The solution was full transparency in a more robust prompt.

## Credits

- Built with [Claude](https://claude.com).
- Fonts (Anton, Birthstone, IBM Plex Mono) via [Google Fonts](https://fonts.google.com).
- Site icon generated with [Haikei](https://haikei.app).
