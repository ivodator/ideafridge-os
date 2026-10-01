# Install the updated website

This ZIP contains the complete website with the refined Chorus hero and consistent SVG arrow icons. The existing copy, typography, layout and service configuration are preserved.

## Preview

Open `hero-preview.html` directly in your browser for the standalone animation.

For the complete website, run this from the website folder:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. The full homepage uses ES modules, so opening it directly from disk is not a complete preview.

## Full website update

Copy the contents of `ideafridge-os-main` into the same website root as your existing version. Preserve the `assets`, `css` and `js` directories. This package does not publish automatically.

## Update only the changed production files

Replace these files together:

- `index.html`
- `privacy.html`
- `terms.html`
- `css/styles.css`
- `js/hero-signal.js`
- `js/vector-motion.js`
- `assets/signal-imprint-desktop.svg`
- `assets/signal-imprint-mobile.svg`

The three HTML pages replace font arrow characters with inline SVG line icons. The shared stylesheet sets their size and alignment. Privacy Policy and Terms text is unchanged.

The hero renderer and fallback assets contain the refined continuous ribbon animation. The shared motion controller also corrects a live reduced-motion preference change, so the static artwork and control labels update together. Headline words, timing and other section choreography are unchanged.

Keep `css/hero-signal.css`, `js/main.js`, `js/config.js`, `js/contact.js` and the other existing assets. No backend changes are needed.

The ZIP also includes updated preview, snippet, release notes and asset-generator files. These are not additional production dependencies.

## Future artwork edits

`js/hero-signal.js` contains the geometry and 13.6-second choreography. `chorusSVG()` produces the resolved static composition from the same geometry. After changing the shape, regenerate both fallback assets:

```sh
node tools/build-signal-fallbacks.mjs
```

The standalone preview embeds a snapshot of the renderer. Preview future edits through the homepage unless you also rebuild the standalone preview.

Supabase configuration, Cloudflare Turnstile, the contact handler, CSP and domain settings are unchanged. Nothing is deployed by this package.
