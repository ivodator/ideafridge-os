# Ideafridge hero refinement: Chorus

The accepted ribbon direction has been refined. The headline, its word loop, typography, page layout, content, other section choreography and integrations are preserved. This package also includes SVG arrow icons and a live reduced-motion correction.

## What improved

- One continuous field of ribbons separates into three related forms. Every strip remains visible and follows its own path. There are no duplicate shapes fading into place.
- A restrained travelling fold changes the curvature and thickness of the source ribbons before they separate.
- Tapered strokes and small variations in near-black tone create a sense of material while preserving the monochrome treatment.
- The three groups move with a small stagger, settle fully, then gather into the original form.
- The static states remain legible brand graphics. The artwork never disappears to restart the loop.

## Reference review

The live OpenAI, ElevenLabs and Cohere homepages were reviewed for the September 2026 brief. Useful cues included strong editorial hierarchy, generous space, tactile abstract forms, product relevance and transitions between clearly composed states. These are design observations from the references, not a claim that all AI companies use one visual trend.

The implementation is original and retains Ideafridge's ink ribbon motif. It does not use another company's illustration, logo, animation code, orb or product interface.

## Sequence and implementation

The cycle is 13.6 seconds. It includes a travelling fold, a settled source state, a staged separation, a longer hold and a return. The headline's existing independent timing is unchanged.

Desktop uses 27 ribbons, with nine in each final form. Mobile uses 21 ribbons, seven in each final form, and its own spacing and dimensions. The geometry is drawn with native Canvas paths and driven by the existing shared animation clock. There is no extra animation loop, video, 3D library or remote dependency.

Pause/resume, offscreen suspension and document visibility are handled by the existing controller. Unchanged states do not redraw. Pixel ratio is capped at 2. Reduced motion and disabled JavaScript use responsive SVG fallbacks generated from the same geometry.

## Included files

The ZIP includes the complete website, a standalone `hero-preview.html`, `INSTALL-HERO.md`, a replacement figure snippet and a static asset generator. Existing filenames are retained for compatibility.

Supabase configuration, Cloudflare Turnstile, form handling, security policy, domain file and legal text are unchanged. Nothing is deployed by this package.

## Mobile arrow correction

The diagonal CTA arrows on Let's talk, Let's chat and Discuss a pilot now use inline SVG paths. The same treatment is used for the legal-page links and the approach scroll arrow. Their 18-pixel size, 1.5-pixel stroke and inherited text color stay consistent across fonts and operating systems. They are hidden from screen readers and do not receive keyboard focus.

## Reduced-motion correction

The controller now updates its motion state from the media-query change event rather than reading the preference on every animation frame. Switching reduced motion on updates the static artwork, headline and pause-control state together. Switching it off resumes the existing animation system.

## Verification

Passed 36 local browser checks covering responsive widths from 320 to 1920 pixels, headline stability, pause/resume, live reduced-motion changes, static fallback, offscreen suspension, SVG icons and an intercepted form error response. A separate geometry check sampled 544 desktop/mobile frames with no intersections between adjacent ribbons and an exact loop return. No live contact request was submitted.
