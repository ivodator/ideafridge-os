# Install the new hero

This ZIP contains the complete website. The new hero artwork is already installed. Everything else on the page is preserved.

## Preview

Open `hero-preview.html` directly in your browser for the standalone animation.

For the complete website, run this from the website folder:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. Opening the full homepage directly from disk does not load its ES modules correctly.

## Full website

Copy the contents of `ideafridge-os-main` into the same website root as your existing version, preserving the `assets`, `css` and `js` directories. This package does not deploy automatically.

## Hero-only update from the previous package

Replace:

- `js/hero-signal.js`
- `assets/signal-imprint-desktop.svg`
- `assets/signal-imprint-mobile.svg`

In `index.html`, update the existing `.signal-imprint` element's `aria-label` to:

> One idea takes shape as a series of ink ribbons, then becomes three related expressions.

The supplied `index.html` already includes that accessibility description. Its visible copy and page structure are unchanged.

Keep the existing `css/hero-signal.css`, `css/styles.css`, `js/vector-motion.js`, `js/main.js`, `js/config.js` and `js/contact.js` unchanged. The new artwork uses their existing hooks and controls.

The ZIP also updates `hero-preview.html`, `snippets/hero-signal.html`, this guide, the release notes and the static asset generator. These are not additional production dependencies.

## Future artwork changes

`js/hero-signal.js` contains the geometry and 12.8-second choreography. `chorusSVG()` produces the same resolved composition for the static fallback. After changing the shape, regenerate both fallback assets:

```sh
node tools/build-signal-fallbacks.mjs
```

The standalone preview embeds a copy of the renderer. Preview later edits through the full homepage unless you also rebuild the standalone preview.

Supabase, Cloudflare, the contact form, CSP, domain settings, Privacy Policy and Terms are unchanged.
