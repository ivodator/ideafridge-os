import { createContactHandler } from './handler.js';

let injectedSecrets: Record<string, string> = {};
try { injectedSecrets = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}'); } catch { /* Invalid configuration fails closed in the handler. */ }

Deno.serve(createContactHandler({
  supabaseUrl: Deno.env.get('SUPABASE_URL') || '',
  supabaseSecretKey: Deno.env.get('CONTACT_SUPABASE_SECRET_KEY') || injectedSecrets.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  turnstileSecretKey: Deno.env.get('TURNSTILE_SECRET_KEY') || '',
  rateLimitSecret: Deno.env.get('CONTACT_RATE_LIMIT_SECRET') || '',
  allowedOrigins: (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(value => value.trim()).filter(Boolean),
}));
