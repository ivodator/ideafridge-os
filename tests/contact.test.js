import test from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler, validatePayload } from '../supabase/functions/connect/handler.js';

const origin = 'https://example.com';
const settings = { supabaseUrl: 'https://example.supabase.co', supabaseSecretKey: 'server-only-test-value', turnstileSecretKey: 'turnstile-test-value', rateLimitSecret: 'a'.repeat(40), allowedOrigins: [origin] };
const payload = { name: 'Sam Rivera', email: 'SAM@example.com', company: 'Example Company', message: 'We are building our SDR team.', website: '', turnstileToken: 'test-token', requestId: '7e541010-78df-4658-9762-058283755689' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const makeRequest = (body = payload, extras = {}) => new Request('https://example.supabase.co/functions/v1/connect', { method: 'POST', headers: { origin, 'content-type': 'application/json', ...extras.headers }, body: typeof body === 'string' ? body : JSON.stringify(body) });

function backend(overrides = {}) {
  const calls = [];
  return { calls, fetch: async (url, options) => {
    calls.push({ url, options });
    if (url.includes('siteverify')) return json(overrides.challenge || { success: true, action: 'connect', hostname: 'example.com' });
    if (url.includes('consume_contact_limit')) return json(overrides.limit ?? true, overrides.limitStatus || 200);
    if (url.includes('contact_requests')) return new Response(null, { status: overrides.saveStatus || 201 });
    throw new Error('Unexpected external request');
  } };
}

test('accepts Unicode names, normalizes email, and preserves message as plain text', () => {
  const value = validatePayload({ ...payload, name: 'José O’Neill', message: '<script>not executed</script>\nSecond line' });
  assert.equal(value.name, 'José O’Neill');
  assert.equal(value.email, 'sam@example.com');
  assert.equal(value.message, '<script>not executed</script>\nSecond line');
});

test('rejects blank required fields, oversized fields, malformed email, arrays, and invalid request IDs', () => {
  for (const invalid of [[], null, { ...payload, company: ' ' }, { ...payload, email: 'invalid' }, { ...payload, name: 'x'.repeat(101) }, { ...payload, message: 'x'.repeat(2001) }, { ...payload, requestId: 'not-a-uuid' }]) assert.equal(validatePayload(invalid), null);
});

test('rejects honeypot submissions and control characters before any external request', async () => {
  const mock = backend();
  const handler = createContactHandler(settings, mock);
  for (const input of [{ ...payload, website: 'spam' }, { ...payload, email: 'x\r\n@example.com' }, { ...payload, message: 'test\0test' }]) assert.equal((await handler(makeRequest(input))).status, 400);
  assert.equal(mock.calls.length, 0);
});

test('unapproved origins are rejected without permissive CORS or external calls', async () => {
  const mock = backend();
  const response = await createContactHandler(settings, mock)(makeRequest(payload, { headers: { origin: 'https://example.com.attacker.test' } }));
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('access-control-allow-origin'), null);
  assert.equal(mock.calls.length, 0);
});

test('preflight only allows the configured origin and expected methods', async () => {
  const response = await createContactHandler(settings)(new Request('https://example.supabase.co/functions/v1/connect', { method: 'OPTIONS', headers: { origin } }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
  assert.equal(response.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
});

test('missing server configuration fails closed', async () => {
  const mock = backend();
  const response = await createContactHandler({ ...settings, turnstileSecretKey: '' }, mock)(makeRequest());
  assert.equal(response.status, 503);
  assert.equal(mock.calls.length, 0);
});

test('rejects unsupported methods and content types', async () => {
  const handler = createContactHandler(settings, backend());
  assert.equal((await handler(new Request('https://example.supabase.co/functions/v1/connect', { headers: { origin } }))).status, 405);
  assert.equal((await handler(makeRequest(payload, { headers: { 'content-type': 'text/plain' } }))).status, 415);
});

test('limits actual request body bytes and rejects malformed JSON', async () => {
  const mock = backend();
  const handler = createContactHandler(settings, mock);
  assert.equal((await handler(makeRequest('x'.repeat(12001)))).status, 413);
  assert.equal((await handler(makeRequest('{bad json'))).status, 400);
  assert.equal(mock.calls.length, 0);
});

test('a valid token must match both the intended hostname and action', async () => {
  for (const challenge of [{ success: false }, { success: true, action: 'login', hostname: 'example.com' }, { success: true, action: 'connect', hostname: 'attacker.test' }]) {
    const mock = backend({ challenge });
    assert.equal((await createContactHandler(settings, mock)(makeRequest())).status, 400);
    assert.equal(mock.calls.length, 1);
  }
});

test('database limits block inserts and rate keys do not contain submitted email', async () => {
  const mock = backend({ limit: false });
  const response = await createContactHandler(settings, mock)(makeRequest());
  assert.equal(response.status, 429);
  assert.equal(mock.calls.length, 2);
  assert.match(JSON.parse(mock.calls[1].options.body).p_bucket, /^email:[0-9a-f]{64}$/);
  assert.ok(!mock.calls[1].options.body.includes('sam@example.com'));
});

test('rate counter or database failures never return a successful submission', async () => {
  for (const overrides of [{ limitStatus: 500 }, { saveStatus: 500 }]) {
    const mock = backend(overrides);
    const response = await createContactHandler(settings, mock)(makeRequest());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { ok: false });
  }
});

test('confirmed saves enforce both durable limits and use an idempotent insert', async () => {
  const mock = backend();
  const response = await createContactHandler(settings, mock)(makeRequest());
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(mock.calls.length, 4);
  assert.equal(JSON.parse(mock.calls[2].options.body).p_bucket, 'global:connect');
  const insert = mock.calls[3];
  assert.ok(insert.url.endsWith('contact_requests?on_conflict=request_id'));
  assert.match(insert.options.headers.Prefer, /resolution=ignore-duplicates/);
  assert.equal(insert.options.headers.apikey, settings.supabaseSecretKey);
  const record = JSON.parse(insert.options.body);
  assert.equal(record.email, 'sam@example.com');
  assert.equal(record.request_id, payload.requestId);
  assert.equal(record.turnstileToken, undefined);
  assert.equal(record.website, undefined);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('upstream failures do not disclose credentials or personal information', async () => {
  const response = await createContactHandler(settings, { fetch: async () => { throw new Error(settings.supabaseSecretKey + payload.email); } })(makeRequest());
  assert.equal(response.status, 503);
  assert.equal(await response.text(), '{"ok":false}');
});
