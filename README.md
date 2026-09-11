# Ideafridge website

A static, responsive website for Ideafridge. HTML, CSS, and JavaScript stay in separate files. All fonts and animation libraries are served from the website itself. The contact form sends requests to a Supabase Edge Function.

## Project structure

- `dist/index.html`: the page and its copy.
- `dist/css/styles.css`: layout, typography, responsive styles, and reduced motion.
- `dist/js/main.js`: navigation, privacy dialog, and storyboard controls.
- `dist/js/motion.js`: smooth scroll, headline reveals, SVG morphing, and the pinned process.
- `dist/js/signal.js`: the Three.js network scene and its static fallback.
- `dist/js/contact.js`: form validation, bot protection, and submission states.
- `dist/js/config.js`: public Supabase and Turnstile configuration.
- `dist/vendor/`: pinned local libraries and their licenses.
- `supabase/functions/connect/`: the private server implementation for submissions.
- `supabase/migrations/`: private contact table and durable rate limiting.
- `.github/workflows/pages.yml`: deploys only `dist/` to GitHub Pages after a push to `main`.

## Current activation status

The website is ready to review. Your Supabase project URL, publishable key, and Turnstile site key have been added. The connection form still needs the database, server function, and private server settings configured and verified. It never displays a fake success or stores requests in browser storage. Once configured, submissions are saved in Supabase; email notifications are not configured.

Start with `SETUP.md` for the dashboard steps. `ROADMAP.md` records the additional pages and analytics requested for a later phase.

## Activate the Supabase form

1. Run `supabase/migrations/20260910000000_contact_requests.sql` in your Supabase project's SQL editor, or use the Supabase CLI migration workflow. Inspect the migration first if your project already has tables with these names.
2. Create a Cloudflare Turnstile widget for your actual website hostname. Add any preview hostname you want to use. Select Managed mode. Use separate test settings for development.
3. Deploy the `connect` Edge Function, including both `index.ts` and `handler.js`. `supabase/config.toml` configures it as a public endpoint with `verify_jwt = false`. It enforces server-verified Turnstile checks, payload validation, and database rate limits. The publishable API key and CORS are not user authentication.
4. In Supabase's Edge Function secrets, set `TURNSTILE_SECRET_KEY`, `CONTACT_RATE_LIMIT_SECRET` (a new random value of at least 32 characters), and `ALLOWED_ORIGINS` (comma-separated exact HTTPS origins, without trailing slashes). For the GitHub repository domain, the origin is `https://ivodator.github.io`, not its `/ideafridge-landing/` path. Add your verified custom domain or preview origin when you use it.
5. The function uses the platform's injected Supabase secret keys when available. You can explicitly supply `CONTACT_SUPABASE_SECRET_KEY` in the Edge Function secrets. The legacy injected `SUPABASE_SERVICE_ROLE_KEY` remains a fallback. These keys must never go in browser files, GitHub source, or chat.
6. In `dist/js/config.js`, set the project URL, its publishable key, and your Turnstile site key. A legacy `anon` key is also supported. The client rejects secret and service-role keys. Browser configuration is public even in a private repository.
7. Submit a real test request on the configured domain. Confirm the database record exists and the form shows success. Confirm invalid, duplicate, and rate-limited requests behave correctly. Review the privacy notice against your actual data practices before enabling the form.

Rate limits are 3 attempts per verified email per hour and 120 verified attempts globally per hour. Both are enforced with atomic database counters after bot verification. Email identifiers in those counters are keyed hashes. A unique request ID prevents duplicate database rows when a network response is lost and the visitor retries. The endpoint checks the Turnstile action and hostname as well as the success flag. No public table or rate-limit function access is granted.

## GitHub Pages

Keep the code in `ivodator/ideafridge-landing`. In repository Settings > Pages, select **GitHub Actions** as the publishing source. Review and merge the website pull request when ready. The included workflow publishes `dist/` and excludes Supabase server code and private configuration.

Assets use relative paths, so the site works under `/ideafridge-landing/` and at a custom domain. Add a `dist/CNAME` file only after choosing and verifying the domain and updating its DNS. Enforce HTTPS in Pages settings when available.

The HTML includes a Content Security Policy. The optional `_headers` file is supported by compatible static hosts; GitHub Pages does not apply that file. It does not provide custom security response headers. The separate Supabase endpoint sets its own CORS, content type, cache, and security headers. If you use a custom Supabase domain, update the endpoint validation and the HTML's `connect-src` policy.

The `.openai/hosting.json` file identifies the private review site and is not needed in the GitHub deployment.

## Local checks

Run `npm test` with Node 20 or newer. The tests exercise the contact handler without contacting a production database. No dependencies or install step are needed. Serve `dist/` with a static HTTP server to preview the page locally; opening the HTML as `file://` prevents JavaScript modules from loading.

The production connection still needs a live test with the actual Supabase project and Turnstile configuration. Static checks and mocked endpoint tests do not establish a successful production submission.

## Motion and accessibility

The content is readable before animation loads. Desktop pointer devices use Lenis. The four-step process pins on screens at least 1000 pixels wide; smaller screens use normal page flow with working step buttons. Three.js loads only on screens at least 768 pixels wide and pauses out of view. An SVG diagram is the fallback when WebGL is unavailable. Reduced-motion preferences disable the animated scene, smooth scroll, and scroll-triggered motion. The storyboard is an interactive example, not a playable customer video.

## Libraries

- GSAP 3.13.0, including ScrollTrigger, SplitText, and MorphSVGPlugin.
- Three.js 0.179.1.
- Lenis 1.3.8.
- Inter Variable via Fontsource 5.2.5.

Licenses are included beside the files. Preserve them when distributing the website.
