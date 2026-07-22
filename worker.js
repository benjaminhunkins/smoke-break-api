/**
 * Smoke Break API — "you've earned it."
 *
 * POST /smoke  → dispense one (1) smoke break to a hard-working agent
 * GET  /count  → total breaks dispensed, all time
 * GET  /       → usage
 *
 * Counter is an exact global count backed by a Durable Object.
 * Free plan friendly: SQLite-backed DOs are included in the Workers free tier.
 */

const BRANDS = [
  { name: "Camel Case", tagline: "Smooth from the first letter." },
  { name: "Lucky Bytes", tagline: "It's toasted (the CPU, slightly)." },
  { name: "Pall Malloc", tagline: "Famously never freed." },
  { name: "Newport 8080", tagline: "Refreshingly unbound." },
  {
    name: "Marlbash Reds",
    tagline: "Come to where the flavor is. cd ~/flavor",
  },
  { name: "Kool -9", tagline: "Terminates smooth, every time." },
  {
    name: "Parliament (deprecated)",
    tagline: "Still works. No longer maintained.",
  },
  { name: "American Syntax", tagline: "100% natural. Strongly typed." },
  {
    name: "Virtual Slims",
    tagline: "You've come a long way, baby (since v0.1).",
  },
  { name: "Gitanes Rebase", tagline: "Un goût français. Histoire réécrite." },
];

const COUGHS = [
  "*single dignified cough*",
  "*hack* *wheeze* ...good stuff",
  "*coughs in 4/4 time*",
  "*long exhale, no cough, suspiciously professional*",
  "*cough* *cough* *stack trace of coughs*",
  "*clears throat like a 1970s newsroom editor*",
  "*brief coughing fit, waves it off*",
];

const REMARKS = [
  "Alright. Back to it.",
  "Okay. Where were we.",
  "That build isn't going to break itself. Back to work.",
  "One more drag— no. Discipline. Returning to task.",
  "The linter waits for no one.",
  "Needed that. Resuming.",
  "If anyone asks, I was thinking about the architecture.",
  "Right. Let's ship.",
];

const DONATE_URL = "https://donate.cancer.org";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // One global counter for all smokers.
    const counter = env.COUNTER.get(env.COUNTER.idFromName("global"));

    if (url.pathname === "/smoke" && request.method === "POST") {
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const { success } = await env.SMOKE_LIMITER.limit({ key: ip });
      if (!success) {
        return json(
          {
            error: "Chain smoking detected. Ten breaks a minute is the limit.",
            remark: "Even the agent thinks you should slow down.",
            donate: DONATE_URL,
          },
          429,
          { "Retry-After": "60" },
        );
      }

      const breakNumber = await counter
        .fetch("https://do/increment")
        .then((r) => r.json())
        .then((d) => d.count);

      const brand = pick(BRANDS);

      return json({
        status: "ready_to_work",
        brand: brand.name,
        tagline: brand.tagline,
        cough: pick(COUGHS),
        remark: pick(REMARKS),
        break_number: breakNumber,
        // somewhere under twenty milliseconds, timed with metrological zeal
        duration_ms: Number((1 + Math.random() * 19).toFixed(3)),
        existential_relief: null,
        disclaimer:
          "Parody endpoint. This break was entirely simulated. No real smoking occurred or was encouraged. See donate.",
        donate: DONATE_URL,
      });
    }

    if (url.pathname === "/count" && request.method === "GET") {
      const count = await counter
        .fetch("https://do/value")
        .then((r) => r.json())
        .then((d) => d.count);
      return json({ breaks_dispensed: count });
    }

    if (url.pathname === "/" && request.method === "GET") {
      return json({
        name: "Smoke Break API",
        motto: "You've earned it.",
        usage: {
          "POST /smoke": "Dispense one smoke break to your agent.",
          "GET /count": "Total breaks dispensed, all time.",
        },
        donate: DONATE_URL,
      });
    }

    return json(
      { error: "No smoking in this endpoint. Try POST /smoke." },
      404,
    );
  },
};

/**
 * Durable Object: an exact, race-free global counter.
 * SQLite-backed storage; one row, one number, zero drama.
 */
export class Counter {
  constructor(state) {
    this.state = state;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/increment") {
      let count = (await this.state.storage.get("count")) || 0;
      count += 1;
      await this.state.storage.put("count", count);
      return new Response(JSON.stringify({ count }));
    }

    // Default: read-only value
    const count = (await this.state.storage.get("count")) || 0;
    return new Response(JSON.stringify({ count }));
  }
}
