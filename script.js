/* ==========================================================================
   IDEAFRIDGE — Market Signal Engine (v2 interactions)
   Vanilla JS, zero dependencies, CSP-safe (external file, no eval/inline).
   Respects prefers-reduced-motion throughout.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- scroll reveal ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  function showAll() { reveals.forEach(function (el) { el.classList.add("in"); }); }
  var revealObs = null;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    showAll();
  } else {
    revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { revealObs.observe(el); });
  }

  /* ---------- decode effect on REF labels (terminal vernacular, used once per label) ---------- */
  var GLYPHS = "▓▒░/\\|<>_—01";
  function decode(el) {
    var finalText = el.getAttribute("data-final");
    var len = finalText.length;
    var frame = 0;
    var totalFrames = Math.min(26, 8 + len);
    function step() {
      frame++;
      var resolved = Math.floor((frame / totalFrames) * len);
      var out = "";
      for (var i = 0; i < len; i++) {
        var ch = finalText.charAt(i);
        if (i < resolved || ch === " " || ch === "/" || ch === ".") out += ch;
        else out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      el.textContent = out;
      if (frame < totalFrames) requestAnimationFrame(step);
      else el.textContent = finalText;
    }
    requestAnimationFrame(step);
  }
  var decodes = Array.prototype.slice.call(document.querySelectorAll("[data-decode]"));
  decodes.forEach(function (el) { el.setAttribute("data-final", el.textContent); });
  if (!reduceMotion && "IntersectionObserver" in window) {
    var decodeObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          decode(entry.target);
          decodeObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    decodes.forEach(function (el) { decodeObs.observe(el); });
  }

  /* ---------- rotating readout under the FIG.01 schematic ---------- */
  var SIGNALS = [
    "DETECTED: COMPETITOR WEBINAR\u00A0\u00A014:02",
    "DETECTED: REGULATORY CHANGE \u2014 TARGET VERTICAL\u00A0\u00A009:41",
    "DETECTED: SERIES C IN YOUR ICP\u00A0\u00A013:02",
    "DETECTED: COMPETITOR PRICING UPDATE\u00A0\u00A011:18",
    "DETECTED: INDUSTRY REPORT PUBLISHED\u00A0\u00A014:46",
    "DETECTED: EARNINGS SIGNAL \u2014 MACRO SHIFT\u00A0\u00A016:21"
  ];
  var label = document.getElementById("wire-label");
  if (label && !reduceMotion) {
    var idx = 0;
    setInterval(function () {
      label.classList.add("swap");
      setTimeout(function () {
        idx = (idx + 1) % SIGNALS.length;
        label.textContent = SIGNALS[idx];
        label.classList.remove("swap");
      }, 350);
    }, 7000); // synced with the 7s schematic loop
  }

  /* ---------- duplicate ticker content for a seamless loop ---------- */
  var track = document.getElementById("ticker-track");
  if (track && !reduceMotion) {
    track.innerHTML += track.innerHTML; // safe: duplicating our own static markup
  }

  /* ---------- single-open FAQ ---------- */
  var faqs = Array.prototype.slice.call(document.querySelectorAll(".faq"));
  faqs.forEach(function (faq) {
    faq.addEventListener("toggle", function () {
      if (faq.open) {
        faqs.forEach(function (other) { if (other !== faq && other.open) other.open = false; });
      }
    });
  });

  /* ---------- lead form ----------
     Direct browser → Supabase insert (no backend / serverless proxy).

     Security model for this approach:
       • The anon ("publishable") key below is MEANT to be public — it ships in
         client code by design and is NOT a secret. Do NOT ever paste your
         service_role key here: that key bypasses RLS and must stay server-side.
       • Your real safety boundary is Row Level Security on the `leads` table.
         An insert-only policy for the `anon` role means this key can add rows
         but cannot read, update, or delete them. Apply that policy BEFORE going
         live, or the table is unprotected (see the RLS SQL provided separately).
       • The honeypot + email check below are best-effort only. They deter lazy
         bots, but anyone can POST straight to the REST endpoint with this key,
         bypassing this script entirely. For real spam protection put Cloudflare
         Turnstile / rate limiting in front, and add length/format CHECK
         constraints on the table columns.
     Requires the CSP connect-src to include the Supabase origin (already set
     in the <meta> tag on each page). */

  // ── Supabase config ──────────────────────────────────────────────────────
  var SUPABASE_URL = "https://itfjnqmwfjhptcopfacd.supabase.co";
  // Dashboard → Project Settings → API Keys → Publishable key. Legacy anon
  // JWT keys also work, but sb_publishable_ keys must not be sent as Bearer JWTs.
  var SUPABASE_ANON_KEY = "sb_publishable_a7UeootOqf0KFd9rrroytQ_dbTSqNOg";
  var LEADS_TABLE = "leads";
  // The object inserted (see body below) sends { email }. That column must
  // exist on your table. `created_at` is intentionally NOT sent — give that
  // column a `default now()` so Postgres stamps the time server-side (a
  // client-supplied timestamp is spoofable and unnecessary).
  // ───────────────────────────────────────────────────────────────────────────

  var LEADS_ENDPOINT = SUPABASE_URL + "/rest/v1/" + LEADS_TABLE;
  var form = document.getElementById("lead-form");
  var msg = document.getElementById("lead-msg");

  function setMsg(text, cls) {
    if (!msg) return;
    msg.textContent = text;
    msg.className = "lead-msg mono" + (cls ? " " + cls : "");
  }

  function validEmail(v) {
    // Pragmatic check; the database CHECK constraints are the real gate.
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailInput = document.getElementById("email");
      var hp = document.getElementById("company_website");
      var email = (emailInput && emailInput.value || "").trim();

      // Honeypot filled => silently succeed for the bot, send nothing.
      if (hp && hp.value) {
        setMsg("REQUEST RECEIVED. RESPONSE INTERVAL: 48 HOURS.", "ok");
        form.reset();
        return;
      }
      if (!validEmail(email)) {
        emailInput.setAttribute("aria-invalid", "true");
        setMsg("ENTER A VALID WORK EMAIL TO PROCEED.", "err");
        emailInput.focus();
        return;
      }
      emailInput.removeAttribute("aria-invalid");

      // Setup guard: surface a forgotten key clearly instead of a vague failure.
      if (/^PASTE_/.test(SUPABASE_ANON_KEY)) {
        setMsg("FORM NOT CONFIGURED YET. SET SUPABASE_ANON_KEY IN script.js.", "err");
        if (window.console) console.error("[lead-form] SUPABASE_ANON_KEY is still the placeholder — paste your anon public key.");
        return;
      }

      var btn = form.querySelector(".lead-btn");
      if (btn) { btn.disabled = true; btn.textContent = "TRANSMITTING…"; }
      setMsg("");

      // Abort the request if the endpoint hangs, so the UI never locks up.
      var controller = ("AbortController" in window) ? new AbortController() : null;
      var timeout = controller ? setTimeout(function () { controller.abort(); }, 12000) : null;

      var headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        // return=minimal is REQUIRED with insert-only RLS: it stops PostgREST
        // from SELECTing the new row back (the anon role can't read it, which
        // would otherwise make a successful insert look like a failure).
        "Prefer": "return=minimal"
      };

      // Legacy anon keys are JWTs and may be sent as Bearer tokens. New
      // sb_publishable_ keys are not JWTs, so sending them in Authorization
      // makes the database reject otherwise valid anon requests.
      if (!/^sb_publishable_/.test(SUPABASE_ANON_KEY)) {
        headers.Authorization = "Bearer " + SUPABASE_ANON_KEY;
      }

      fetch(LEADS_ENDPOINT, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ email: email }),
        mode: "cors",
        credentials: "omit", // cross-origin to Supabase — never attach cookies
        cache: "no-store",
        redirect: "error",   // a lead POST should never be redirected
        signal: controller ? controller.signal : undefined
      })
        .then(function (res) {
          if (!res.ok) throw new Error("status " + res.status);
          setMsg("REQUEST RECEIVED. AWAITING CATEGORY VERIFICATION. RESPONSE INTERVAL: 48 HOURS.", "ok");
          form.reset();
        })
        .catch(function () {
          setMsg("TRANSMISSION FAILED. EMAIL US DIRECTLY: HELLO@IDEAFRIDGE.COM", "err");
        })
        .finally(function () {
          if (timeout) clearTimeout(timeout);
          if (btn) { btn.disabled = false; btn.innerHTML = "Proceed \u2192"; }
        });
    });
  }
})();
