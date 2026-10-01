# Ideafridge hero reset: Chorus

Only the hero artwork has changed. The headline, word rotation, site copy, layout, typography, color scheme, approach and distribution animations, footer, legal pages and contact integration remain as supplied in the previous package.

## The idea

One recognizable ink mark opens, becomes three related expressions, holds, then returns. Its repeated curved ribbons connect the central idea with its outward expressions. Strong black shapes and deliberate white space carry the composition.

## Motion

The 12.8-second cycle includes an opening, a settled beat, the emergence of two companion marks, a longer hold and a quiet return. Companion marks become visible only after they clear the central mark. Their paths stay separate during the transitions.

The headline retains its existing words, timing and animation. The hero uses a longer independent phrase. It does not pulse in response to the rotating words.

- Nine filled ribbon paths per mark, at most three marks.
- No particles, halftone textures, video or extra animation library.
- Native Canvas drawing, driven by the existing shared animation clock.
- Responsive geometry with a more compact mobile composition.
- Shared pause/resume and offscreen suspension remain supported.
- Reduced motion and disabled JavaScript use a complete static SVG.
- No redraw during unchanged states. Device pixel ratio is capped at 2.

## Files

`hero-preview.html` opens directly from disk. The full homepage uses ES modules, so preview it through a local web server. See `INSTALL-HERO.md` for installation.

The existing `hero-signal.js` and `signal-imprint-*.svg` filenames are retained so the new artwork fits the existing integration. These files now contain Chorus, not the previous halftone animation.

This package does not deploy anything. Supabase, Cloudflare Turnstile, the form handler, security policy, domain configuration and legal pages have not changed.
