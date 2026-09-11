# Connect the Ideafridge website

Your project URL and publishable key have been added to `dist/js/config.js`. The project URL is `https://itfjnqmwfjhptcopfacd.supabase.co`. The `/rest/v1/` path is the REST API endpoint, so it is not part of the base URL in this configuration.

The publishable key is intended for browser use. The table still needs private access rules and a server function. The form stays inactive until Turnstile and the server are configured.

## What each service does

| Service | Purpose |
| --- | --- |
| GitHub Pages | Hosts the HTML, CSS, JavaScript, fonts, and animations. |
| Supabase | Stores connection requests and runs the server function that accepts them. |
| Cloudflare Turnstile | Checks submissions for bots and spam. It works with GitHub Pages. |
| Resend, proposed addition | Sends an email notification after a connection request is saved. |

## 1. Create the database tables

1. Open your Supabase project in the dashboard.
2. Choose **SQL Editor**, then create a new query.
3. Open `supabase/migrations/20260910000000_contact_requests.sql` from this project. Paste its full contents into the query editor and run it.
4. Check **Table Editor** for `contact_requests`. The migration enables Row Level Security, removes public access, and adds a separate private rate-limit table.

If tables with these names already exist, review them before running the migration. Do not add public insert or read policies to make the form work. The server function handles inserts after checking each request.

## 2. Set up Turnstile

1. Create or sign in to a Cloudflare account. The Turnstile Free plan is enough to start.
2. Open **Turnstile** and add a widget called **Ideafridge contact form**.
3. Add the hostname where the website will actually run. For your current GitHub repository, that would be `ivodator.github.io`. If you use your own domain, add that hostname as well. Enter hostnames without `https://` or a page path.
4. Choose **Managed** mode and create the widget.
5. Copy its **site key** into `turnstileSiteKey` in `dist/js/config.js`. This key is public.
6. Keep the **secret key** for the next step. Enter it directly into Supabase's secrets settings.

Turnstile usually completes its check in the background. Managed mode may ask a visitor to click a checkbox. You do not need to move your hosting or domain's DNS to Cloudflare to use it.

## 3. Add the server settings

In Supabase, open **Edge Functions > Secrets**. Add these settings:

| Name | Value |
| --- | --- |
| `TURNSTILE_SECRET_KEY` | The private secret key from the Turnstile widget. |
| `CONTACT_RATE_LIMIT_SECRET` | A new random secret, at least 32 characters long. Generate it with a password manager. This protects the email identifiers used for rate limiting. |
| `ALLOWED_ORIGINS` | Use `https://ideafridge.com`. Include `https://www.ideafridge.com` if the form is served there, and `https://ivodator.github.io` if you also test there. Separate origins with commas, without trailing slashes or paths. |

The function uses Supabase's injected server credential. If that is unavailable, add a Supabase secret key as `CONTACT_SUPABASE_SECRET_KEY` in the same secrets screen. The provided publishable key does not replace that server credential.

Private keys belong in Supabase's secrets settings. They do not belong in website files, GitHub source, or chat.

## 4. Deploy the contact function

1. Open **Edge Functions > Deploy a new function > Via Editor**.
2. Name the function **connect**.
3. Replace the editor's example code with the full contents of `supabase/dashboard-connect.ts`. This is a single-file copy of the implementation, prepared for the dashboard.
4. Deploy the function.
5. In the function's settings, disable **Verify JWT** for this public contact endpoint. The visitor is not signing into an account. Turnstile verification, validation, allowed origins, and database rate limits are enforced inside the function.

The resulting endpoint should be:

```text
https://itfjnqmwfjhptcopfacd.supabase.co/functions/v1/connect
```

The separate `index.ts` and `handler.js` files remain the source for CLI deployments. If those files change later, regenerate the dashboard copy with `node scripts/prepare-dashboard-function.mjs` before pasting it into the editor.

## 5. Publish the public configuration and test

1. Publish the website with the updated `dist/js/config.js`, including the Turnstile site key.
2. Submit the form from a hostname you configured in both Turnstile and `ALLOWED_ORIGINS`.
3. Check that a row appears in **Supabase > Table Editor > contact_requests**.
4. Check that the website displays success only after the row is saved.

The dashboard's generic function tester will not provide a real Turnstile token. Use the website for the complete test. A deployment being marked successful is not a substitute for this submission test.

## Email notifications

Email notifications are a proposed addition and are not wired into the current handler yet. The recommended flow is to save the connection request first, then send an alert through Resend. An email delivery failure must not discard the stored request.

To enable this addition:

1. Create a Resend account.
2. Add and verify a sending domain you control. Resend gives you the DNS records to add at your domain's DNS provider.
3. Create a sending API key and store it directly in Supabase's secrets as `RESEND_API_KEY`.
4. Choose the inbox that should receive alerts and a sender address on the verified domain.
5. Add the notification step to the server handler, with duplicate prevention and delivery failure handling, then test it after configuration.

An alert can contain the visitor's name, work email, company, and message. This is a notification about a connection request. The form does not create a user account or subscribe the visitor to a mailing list.

## Official setup references

- [Supabase dashboard function setup](https://supabase.com/docs/guides/functions/quickstart-dashboard)
- [Supabase function secrets](https://supabase.com/docs/guides/functions/secrets)
- [Turnstile widget setup](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/)
- [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/)
- [Sending email with Supabase and Resend](https://resend.com/docs/send-with-supabase-edge-functions)
