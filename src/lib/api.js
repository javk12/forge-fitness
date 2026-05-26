/**
 * Call the Claude API through our serverless proxy.
 *
 * IMPORTANT: Never call api.anthropic.com directly from the browser.
 *   - It exposes your API key to anyone who opens DevTools.
 *   - It will be blocked by CORS.
 *
 * The proxy lives at /api/claude (see ../../api/claude.js).
 * Set ANTHROPIC_API_KEY as an environment variable on your host (Vercel).
 */

export async function callClaude(payload) {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = `API ${response.status}`;
    try {
      const data = await response.json();
      message = data?.error?.message || data?.error || message;
    } catch (_) {}
    throw new Error(message);
  }

  return response.json();
}
