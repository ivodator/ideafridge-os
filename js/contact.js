import { config } from './config.js';

function publicKeyIsValid(key) {
  if (key.startsWith('sb_publishable_')) return true;
  if (!key.startsWith('eyJ')) return false;
  try { return JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'anon'; } catch { return false; }
}

function isConfigured() {
  try {
    const url = new URL(config.supabaseUrl);
    return url.protocol === 'https:' && /^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) && publicKeyIsValid(config.supabasePublishableKey) && !!config.turnstileSiteKey && /^[a-z0-9-]+$/.test(config.contactFunction);
  } catch { return false; }
}

export function initContact() {
  const form = document.querySelector('#connect-form');
  const status = document.querySelector('#form-status');
  const submit = form.querySelector('button[type="submit"]');
  const buttonLabel = submit.querySelector('span');
  const idleLabel = buttonLabel.textContent;
  const configured = isConfigured();
  let botToken = ''; let widgetId; let widgetPromise; let submitting = false;
  let requestId = crypto.randomUUID();
  let previousPayload = '';

  function loadBotCheck() {
    if (!configured) return Promise.resolve();
    if (widgetPromise) return widgetPromise;
    widgetPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => {
        try {
          widgetId = window.turnstile.render('#bot-check', {
            sitekey: config.turnstileSiteKey, theme: 'light', action: 'connect', appearance: 'interaction-only',
            callback: token => { botToken = token; if (status.dataset.botError) { status.textContent = ''; delete status.dataset.botError; } },
            'expired-callback': () => { botToken = ''; },
            'error-callback': () => { botToken = ''; status.textContent = 'The security check could not load. Please refresh and try again.'; status.dataset.botError = 'true'; },
          });
          resolve();
        } catch (error) { reject(error); }
      };
      script.onerror = () => { widgetPromise = undefined; reject(new Error('Bot check unavailable')); };
      document.head.append(script);
    });
    return widgetPromise;
  }
  if (configured) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { loadBotCheck().catch(() => {}); observer.disconnect(); }
    }, { rootMargin: '500px' });
    observer.observe(form);
  }

  function validate() {
    let firstInvalid;
    ['name', 'email', 'company', 'message'].forEach(name => {
      const input = form.elements[name];
      const value = input.value.trim();
      let error = '';
      if (input.required && !value) error = name === 'name' ? 'Please enter your name.' : name === 'company' ? 'Please enter your company.' : 'Please enter your work email.';
      else if (name === 'email' && (input.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) error = 'Please enter a valid email address.';
      else if (value.length > input.maxLength) error = `Please use ${input.maxLength} characters or fewer.`;
      input.setAttribute('aria-invalid', String(!!error));
      document.getElementById(`${name}-error`).textContent = error;
      if (error && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }
  form.addEventListener('input', event => {
    if (!event.target.name || !document.getElementById(`${event.target.name}-error`)) return;
    event.target.removeAttribute('aria-invalid');
    document.getElementById(`${event.target.name}-error`).textContent = '';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting) return;
    status.textContent = '';
    if (!validate()) return;
    if (!configured) { status.textContent = 'This form is not accepting requests yet. Please check back soon.'; return; }
    submitting = true; submit.disabled = true; buttonLabel.textContent = 'Sending…'; form.setAttribute('aria-busy', 'true');
    let controller; let timeout;
    try {
      await loadBotCheck();
      if (!botToken) { status.textContent = 'Please complete the security check, then send your request.'; status.dataset.botError = 'true'; return; }
      const payload = {
        name: form.elements.name.value.trim(), email: form.elements.email.value.trim(),
        company: form.elements.company.value.trim(), message: form.elements.message.value.trim(),
        website: form.elements.website.value,
      };
      const signature = JSON.stringify(payload);
      if (previousPayload && previousPayload !== signature) requestId = crypto.randomUUID();
      previousPayload = signature;
      controller = new AbortController(); timeout = setTimeout(() => controller.abort(), 15000);
      const endpoint = `${config.supabaseUrl.replace(/\/$/, '')}/functions/v1/${config.contactFunction}`;
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: config.supabasePublishableKey },
        body: JSON.stringify({ ...payload, turnstileToken: botToken, requestId }),
        signal: controller.signal, credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin',
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.ok !== true) {
        if (response.status === 429) status.textContent = 'You’ve sent a few requests recently. Please try again later.';
        else if (response.status === 400) status.textContent = 'Please check your details and complete the security check again.';
        else status.textContent = 'Your request could not be sent. Please try again shortly.';
        return;
      }
      form.hidden = true;
      const success = document.querySelector('#form-success');
      success.hidden = false; success.focus(); form.reset(); requestId = crypto.randomUUID();
    } catch (error) {
      status.textContent = error.name === 'AbortError' ? 'The request timed out. Please try again.' : 'Your request could not be sent. Check your connection and try again.';
    } finally {
      clearTimeout(timeout); submitting = false; submit.disabled = false; buttonLabel.textContent = idleLabel; form.removeAttribute('aria-busy');
      botToken = '';
      if (widgetId !== undefined && window.turnstile) window.turnstile.reset(widgetId);
    }
  });
}
