/**
 * Serverless proxy for the Anthropic Messages API.
 * Vercel auto-discovers files in /api as serverless functions.
 *
 * Required env var: ANTHROPIC_API_KEY
 * Optional env var: RATE_LIMIT_PER_HOUR (defaults to 60)
 *
 * NOTE on rate limiting: the in-memory map below is per-instance and won't
 * be shared across Vercel function invocations or regions. For production
 * traffic, swap this for Upstash Redis or a database-backed counter.
 */

const memoryRateLimit = new Map();

function rateLimit(ip, limit) {
  const now = Date.now();
  const hourStart = Math.floor(now / 3600000) * 3600000;
  const key = `${ip}:${hourStart}`;
  const count = (memoryRateLimit.get(key) || 0) + 1;
  memoryRateLimit.set(key, count);

  if (memoryRateLimit.size > 5000) {
    for (const k of memoryRateLimit.keys()) {
      const parts = k.split(':');
      const ts = Number(parts[parts.length - 1]);
      if (Number.isFinite(ts) && ts < hourStart) memoryRateLimit.delete(k);
    }
  }
  return count <= limit;
}

export default async function handler(req, res) {
  // Preflight (browsers shouldn't need this for same-origin, but safe)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: 'Server misconfigured: ANTHROPIC_API_KEY is not set' });
  }

  // Per-IP rate limit
  const ip =
    (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';
  const limit = Number(process.env.RATE_LIMIT_PER_HOUR || 60);
  if (!rateLimit(ip, limit)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in an hour.' });
  }

  // Body comes parsed on Vercel; on raw Node it may not.
  let body = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = body ? JSON.parse(body) : {};
    } catch (_) {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  // Basic shape check — refuse anything that doesn't look like a Messages call
  if (!body.model || !body.messages) {
    return res.status(400).json({ error: 'Missing model or messages' });
  }

  // Cap max_tokens so a runaway client can't burn your credits
  body.max_tokens = Math.min(Number(body.max_tokens) || 1024, 2048);

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: err.message || 'Upstream call failed' });
  }
}
