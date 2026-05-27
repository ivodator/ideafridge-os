/**
 * IDEAFRIDGE SIGNAL ENGINE
 * Interaction Logic (Softened Technical Design)
 */

'use strict';

const REQUEST_TIMEOUT_MS = 10000;
const MOBILE_BREAKPOINT = 768;

function readMeta(name) {
    return document.querySelector(`meta[name="${name}"]`)?.getAttribute('content')?.trim() || '';
}

const LEAD_ENDPOINT = (() => {
    const configured = readMeta('lead-endpoint') || '/api/leads';
    try {
        const url = new URL(configured, window.location.origin);
        const isSecure = window.location.protocol === 'https:' ? url.protocol === 'https:' : true;
        const isSameOrigin = url.origin === window.location.origin;
        if (isSecure && isSameOrigin) return `${url.pathname}${url.search}`;
    } catch (_error) {}
    return '/api/leads';
})();

const SUPABASE_CONFIG = (() => {
    const supabaseUrl = readMeta('supabase-url');
    const anonKey = readMeta('supabase-anon-key');
    const table = (readMeta('supabase-table') || 'leads').replace(/[^a-zA-Z0-9_]/g, '');

    if (!supabaseUrl || !anonKey || !table) return { enabled: false };
    try {
        const url = new URL(supabaseUrl);
        const insertUrl = `${url.origin}/rest/v1/${table}`;
        return { enabled: true, insertUrl, anonKey };
    } catch (_error) {
        return { enabled: false };
    }
})();

async function submitLead(payload, signal) {
    if (SUPABASE_CONFIG.enabled) return submitLeadToSupabase(payload, signal);
    return submitLeadToEndpoint(payload, signal);
}

async function submitLeadToSupabase(payload, signal) {
    const response = await fetch(SUPABASE_CONFIG.insertUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            apikey: SUPABASE_CONFIG.anonKey,
            Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
            Prefer: 'return=minimal'
        },
        body: JSON.stringify(payload),
        signal
    });

    if (!response.ok) {
        let errorMessage = 'ERR: SECURE TRANSMISSION FAILED.';
        try {
            const errorData = await response.json();
            if (errorData && typeof errorData.message === 'string') errorMessage = errorData.message;
        } catch (_error) {}
        throw new Error(errorMessage);
    }
    return response;
}

async function submitLeadToEndpoint(payload, signal) {
    const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal
    });

    if (!response.ok) {
        let errorMessage = 'ERR: SECURE TRANSMISSION FAILED.';
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try {
                const errorData = await response.json();
                if (errorData && typeof errorData.message === 'string') errorMessage = errorData.message;
            } catch (_error) {}
        }
        throw new Error(errorMessage);
    }
    return response;
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveals();
    initMobileMenu();
    initMultiStepForm();
});

/* ==========================================================================
   1. SCROLL REVEALS
   ========================================================================== */
function initScrollReveals() {
    const reveals = document.querySelectorAll('.reveal, .fade-in');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        reveals.forEach((el) => el.classList.add('active'));
        return;
    }

    setTimeout(() => {
        reveals.forEach((el) => { if (el.classList.contains('fade-in')) el.classList.add('active'); });
    }, 100);

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target);
                }
            });
        },
        { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
    );

    reveals.forEach((reveal) => { if (reveal.classList.contains('reveal')) observer.observe(reveal); });
}

/* ==========================================================================
   2. MOBILE NAVIGATION
   ========================================================================== */
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (!menuBtn || !navLinks) return;

    const closeMenu = () => {
        menuBtn.classList.remove('active');
        navLinks.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        navLinks.setAttribute('aria-hidden', window.innerWidth <= MOBILE_BREAKPOINT ? 'true' : 'false');
    };

    const openMenu = () => {
        menuBtn.classList.add('active');
        navLinks.classList.add('active');
        menuBtn.setAttribute('aria-expanded', 'true');
        navLinks.setAttribute('aria-hidden', 'false');
    };

    menuBtn.addEventListener('click', () => {
        menuBtn.getAttribute('aria-expanded') === 'true' ? closeMenu() : openMenu();
    });

    navLinks.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('click', (event) => {
        if (!navLinks.classList.contains('active')) return;
        if (!(event.target instanceof Node)) return;
        if (!navLinks.contains(event.target) && !menuBtn.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenu(); });

    const syncMenuStateForViewport = () => {
        if (window.innerWidth <= MOBILE_BREAKPOINT) { closeMenu(); return; }
        menuBtn.classList.remove('active');
        navLinks.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        navLinks.setAttribute('aria-hidden', 'false');
    };

    syncMenuStateForViewport();
    window.addEventListener('resize', syncMenuStateForViewport);
}

/* ==========================================================================
   3. MULTI-STEP CONVERSION FORM
   ========================================================================== */
function initMultiStepForm() {
    const steps =[
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3'),
        document.getElementById('step-success')
    ];

    const dots =[
        document.getElementById('dot-1'),
        document.getElementById('dot-2'),
        document.getElementById('dot-3')
    ];

    const emailInput = document.getElementById('workEmail');
    const emailError = document.getElementById('emailError');
    const categorySelect = document.getElementById('companyCategory');
    const goalSelect = document.getElementById('primaryGoal');
    const honeypot = document.getElementById('gotcha');

    const nextBtn1 = document.getElementById('nextBtn1');
    const nextBtn2 = document.getElementById('nextBtn2');
    const backBtn1 = document.getElementById('backBtn1');
    const backBtn2 = document.getElementById('backBtn2');
    const form = document.getElementById('accessForm');
    const formProgress = form?.querySelector('.form-progress');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');
    const loader = submitBtn?.querySelector('.loader-text');
    const btnText = submitBtn?.querySelector('span:first-child');

    if (!form || !emailInput || !categorySelect || !goalSelect || !submitBtn) return;

    const genericDomains = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com']);

    const clearFormStatus = () => {
        if (!formStatus) return;
        formStatus.textContent = '';
        formStatus.classList.add('hidden');
    };

    const setFormStatus = (message) => {
        if (!formStatus) return;
        formStatus.textContent = message;
        formStatus.classList.remove('hidden');
    };

    const setLoadingState = (isLoading) => {
        submitBtn.disabled = isLoading;
        if (btnText) btnText.classList.toggle('hidden', isLoading);
        if (loader) loader.classList.toggle('hidden', !isLoading);
    };

    const showStep = (index) => {
        steps.forEach((step, stepIndex) => {
            if (!step) return;
            if (stepIndex === index) {
                step.classList.remove('hidden');
                setTimeout(() => step.classList.add('active'), 10);
            } else {
                step.classList.remove('active');
                step.classList.add('hidden');
            }
        });

        dots.forEach((dot, dotIndex) => {
            if (!dot) return;
            dot.classList.toggle('active', dotIndex <= Math.min(index, dots.length - 1));
            dot.classList.toggle('text-muted', dotIndex > Math.min(index, dots.length - 1));
        });
    };

    const validateEmail = () => {
        const email = emailInput.value.trim().toLowerCase();
        const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const domain = email.split('@')[1] || '';

        if (!email || !isValidFormat) {
            emailError.textContent = 'ERR: INVALID EMAIL FORMAT.';
            emailError.classList.remove('hidden');
            return false;
        }

        if (genericDomains.has(domain)) {
            emailError.textContent = 'ERR: REQUIRES B2B DOMAIN.';
            emailError.classList.remove('hidden');
            return false;
        }

        emailError.classList.add('hidden');
        return true;
    };

    const validateCategory = () => {
        const isValid = categorySelect.value !== '';
        categorySelect.style.borderColor = isValid ? 'var(--border-color)' : '#D93025';
        return isValid;
    };

    const validateGoal = () => {
        const isValid = goalSelect.value !== '';
        goalSelect.style.borderColor = isValid ? 'var(--border-color)' : '#D93025';
        return isValid;
    };

    const getAttribution = () => {
        const params = new URLSearchParams(window.location.search);
        const attribution = { source: 'website', page: window.location.pathname, referrer: document.referrer || '' };['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
            const value = params.get(key);
            if (value) attribution[key] = value;
        });
        return attribution;
    };

    if (nextBtn1) nextBtn1.addEventListener('click', () => { clearFormStatus(); if (validateEmail()) showStep(1); });
    if (backBtn1) backBtn1.addEventListener('click', () => { clearFormStatus(); showStep(0); });
    if (nextBtn2) nextBtn2.addEventListener('click', () => { clearFormStatus(); if (validateCategory()) showStep(2); });
    if (backBtn2) backBtn2.addEventListener('click', () => { clearFormStatus(); showStep(1); });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearFormStatus();

        if (honeypot && honeypot.value.trim() !== '') return;
        if (!validateEmail()) { showStep(0); return; }
        if (!validateCategory()) { showStep(1); return; }
        if (!validateGoal()) { showStep(2); return; }

        setLoadingState(true);

        const corePayload = { email: emailInput.value.trim(), category: categorySelect.value, goal: goalSelect.value };
        const payload = SUPABASE_CONFIG.enabled ? corePayload : { ...corePayload, timestamp: new Date().toISOString(), ...getAttribution() };
        
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            await submitLead(payload, controller.signal);
            if (formProgress) formProgress.classList.add('hidden');
            showStep(3);
        } catch (error) {
            const timedOut = error instanceof DOMException && error.name === 'AbortError';
            const message = timedOut ? 'ERR: TIMEOUT. RETRY.' : (error.message || 'ERR: TRANSMISSION FAILED.');
            setFormStatus(message);
            setLoadingState(false);
        } finally {
            window.clearTimeout(timeoutId);
        }
    });

    categorySelect.addEventListener('change', () => { categorySelect.style.borderColor = 'var(--border-color)'; clearFormStatus(); });
    goalSelect.addEventListener('change', () => { goalSelect.style.borderColor = 'var(--border-color)'; clearFormStatus(); });
    emailInput.addEventListener('input', () => { emailError.classList.add('hidden'); clearFormStatus(); });
}
