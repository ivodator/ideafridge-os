const BODY_LIMIT = 12000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SINGLE_LINE_CONTROLS = /[\u0000-\u001f\u007f]/;
const TEXT_CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export function validatePayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const limits = { name: 100, email: 254, company: 150, message: 2000, turnstileToken: 4096, requestId: 36 };
  const data = {};
  for (const [field, limit] of Object.entries(limits)) {
    if (typeof value[field] !== 'string') return null;
    const text = value[field].trim();
    if (text.length > limit || (field !== 'message' && !text)) return null;
    if ((field === 'message' ? TEXT_CONTROLS : SINGLE_LINE_CONTROLS).test(text)) return null;
    data[field] = text;
  }
  if (value.website !== undefined && (typeof value.website !== 'string' || value.website.trim())) return null;
  if (!EMAIL_PATTERN.test(data.email) || !UUID_PATTERN.test(data.requestId)) return null;
  data.email = data.email.toLowerCase();
  return data;
}

async function readLimitedBody(request) {
  const advertised = Number(request.headers.get('content-length'));
  if (advertised > BODY_LIMIT) throw new RangeError('Payload too large');
  if (!request.body) throw new SyntaxError('Body required');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let length = 0; let text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > BODY_LIMIT) { await reader.cancel(); throw new RangeError('Payload too large'); }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } finally { reader.releaseLock(); }
}

async function hashEmail(email, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(email));
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function createContactHandler(config, dependencies = {}) {
  const fetcher = dependencies.fetch || fetch;
  const allowedOrigins = new Set(config.allowedOrigins);
  const allowedHosts = new Set(config.allowedOrigins.map(origin => {
    try { return new URL(origin).hostname; } catch { return ''; }
  }).filter(Boolean));
  const supabaseUrl = config.supabaseUrl.replace(/\/$/, '');
  const ready = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl) && !!config.supabaseSecretKey && !!config.turnstileSecretKey && config.rateLimitSecret.length >= 32 && allowedOrigins.size > 0;

  return async request => {
    const origin = request.headers.get('origin') || '';
    const allowed = allowedOrigins.has(origin);
    const headers = {
      'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', Vary: 'Origin',
      ...(allowed ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info', 'Access-Control-Max-Age': '600' } : {}),
    };
    const respond = (status, body) => new Response(JSON.stringify(body), { status, headers });
    if (!allowed) return respond(403, { ok: false });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return respond(405, { ok: false });
    if (!ready) return respond(503, { ok: false });
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) return respond(415, { ok: false });
    let data;
    try { data = validatePayload(await readLimitedBody(request)); }
    catch (error) { return respond(error instanceof RangeError ? 413 : 400, { ok: false }); }
    if (!data) return respond(400, { ok: false });

    try {
      const verification = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: config.turnstileSecretKey, response: data.turnstileToken }),
        signal: AbortSignal.timeout(6000),
      });
      if (!verification.ok) return respond(503, { ok: false });
      const challenge = await verification.json();
      if (challenge.success !== true || challenge.action !== 'connect' || !allowedHosts.has(challenge.hostname)) return respond(400, { ok: false });

      const databaseHeaders = { apikey: config.supabaseSecretKey, 'Content-Type': 'application/json' };
      const emailHash = await hashEmail(data.email, config.rateLimitSecret);
      // Durable database counters avoid isolate-local limits and untrusted client IP headers.
      for (const [bucket, limit] of [[`email:${emailHash}`, 3], ['global:connect', 120]]) {
        const check = await fetcher(`${supabaseUrl}/rest/v1/rpc/consume_contact_limit`, {
          method: 'POST', headers: databaseHeaders,
          body: JSON.stringify({ p_bucket: bucket, p_limit: limit, p_window_seconds: 3600 }),
          signal: AbortSignal.timeout(5000),
        });
        if (!check.ok) return respond(503, { ok: false });
        if (await check.json() !== true) return respond(429, { ok: false });
      }

      const saved = await fetcher(`${supabaseUrl}/rest/v1/contact_requests?on_conflict=request_id`, {
        method: 'POST',
        headers: { ...databaseHeaders, Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify({ request_id: data.requestId, name: data.name, email: data.email, company: data.company, message: data.message, source: 'website' }),
        signal: AbortSignal.timeout(5000),
      });
      if (!saved.ok) return respond(503, { ok: false });
      return respond(201, { ok: true });
    } catch {
      // Never return upstream errors, credentials, tokens, or submitted personal information.
      return respond(503, { ok: false });
    }
  };
}
