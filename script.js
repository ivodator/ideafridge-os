/**
 * IDEAFRIDGE SIGNAL ENGINE - INTERACTIVE LOGIC
 * Production baseline: accessibility, resilience, progressive enhancement.
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

        if (isSecure && isSameOrigin) {
            return `${url.pathname}${url.search}`;
        }
    } catch (_error) {
        // Use fallback below.
    }

    return '/api/leads';
})();

const SUPABASE_CONFIG = (() => {
    const supabaseUrl = readMeta('supabase-url');
    const anonKey = readMeta('supabase-anon-key');
    const table = (readMeta('supabase-table') || 'leads').replace(/[^a-zA-Z0-9_]/g, '');

    if (!supabaseUrl || !anonKey || !table) {
        return { enabled: false };
    }

    try {
        const url = new URL(supabaseUrl);
        const insertUrl = `${url.origin}/rest/v1/${table}`;
        return {
            enabled: true,
            insertUrl,
            anonKey
        };
    } catch (_error) {
        return { enabled: false };
    }
})();

async function submitLead(payload, signal) {
    if (SUPABASE_CONFIG.enabled) {
        return submitLeadToSupabase(payload, signal);
    }

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
        let errorMessage = 'Secure transmission failed. Please try again in a moment.';

        try {
            const errorData = await response.json();
            if (errorData && typeof errorData.message === 'string') {
                errorMessage = errorData.message;
            } else if (errorData && typeof errorData.details === 'string') {
                errorMessage = errorData.details;
            } else if (errorData && typeof errorData.hint === 'string') {
                errorMessage = errorData.hint;
            }
        } catch (_error) {
            // Keep generic error.
        }

        throw new Error(errorMessage);
    }

    return response;
}

async function submitLeadToEndpoint(payload, signal) {
    const response = await fetch(LEAD_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        },
        body: JSON.stringify(payload),
        signal
    });

    if (!response.ok) {
        let errorMessage = 'Secure transmission failed. Please try again in a moment.';
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            try {
                const errorData = await response.json();
                if (errorData && typeof errorData.message === 'string') {
                    errorMessage = errorData.message;
                }
            } catch (_error) {
                // Keep generic error.
            }
        }

        throw new Error(errorMessage);
    }

    return response;
}

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveals();
    initMobileMenu();
    initPricingCalculator();
    initMultiStepForm();
});

/* ==========================================================================
   1. SCROLL REVEALS (Intersection Observer)
   ========================================================================== */
function initScrollReveals() {
    const reveals = document.querySelectorAll('.reveal, .fade-in');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        reveals.forEach((el) => el.classList.add('active'));
        return;
    }

    setTimeout(() => {
        reveals.forEach((el) => {
            if (el.classList.contains('fade-in')) {
                el.classList.add('active');
            }
        });
    }, 50);

    const observer = new IntersectionObserver(
        (entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    obs.unobserve(entry.target);
                }
            });
        },
        {
            root: null,
            rootMargin: '0px 0px -10% 0px',
            threshold: 0.1
        }
    );

    reveals.forEach((reveal) => {
        if (reveal.classList.contains('reveal')) {
            observer.observe(reveal);
        }
    });
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
        document.body.classList.remove('nav-open');
    };

    const openMenu = () => {
        menuBtn.classList.add('active');
        navLinks.classList.add('active');
        menuBtn.setAttribute('aria-expanded', 'true');
        navLinks.setAttribute('aria-hidden', 'false');
        document.body.classList.add('nav-open');
    };

    menuBtn.addEventListener('click', () => {
        const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
        if (isExpanded) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
        if (!navLinks.classList.contains('active')) return;
        if (!(event.target instanceof Node)) return;

        if (!navLinks.contains(event.target) && !menuBtn.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
        }
    });

    const syncMenuStateForViewport = () => {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
            closeMenu();
            return;
        }

        menuBtn.classList.remove('active');
        navLinks.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        navLinks.setAttribute('aria-hidden', 'false');
        document.body.classList.remove('nav-open');
    };

    syncMenuStateForViewport();
    window.addEventListener('resize', syncMenuStateForViewport);
}

/* ==========================================================================
   3. REAL-TIME PRICING CALCULATOR WITH DYNAMIC FEATURES
   ========================================================================== */
function initPricingCalculator() {
    const slider = document.getElementById('repSlider');
    const display = document.getElementById('repCountDisplay');
    const tierName = document.getElementById('tierName');
    const tierDesc = document.getElementById('tierDesc');
    const tierBadge = document.getElementById('tierBadge');
    const tierBox = document.getElementById('recommendedTierBox');
    const featuresList = document.getElementById('tierFeatures');
    const featuresContainer = document.getElementById('featuresContainer');

    if (!slider || !display || !tierName || !tierDesc || !tierBadge || !tierBox || !featuresList || !featuresContainer) {
        return;
    }

    const planData = {
        signal: {
            name: 'Signal Plan',
            desc: 'Early Series A and early Series B vendors. Establish your signal response capability.',
            class: 'tier-signal',
            badge: 'ENTRY INFRASTRUCTURE',
            features: [
                'Continuous cybersecurity signal monitoring',
                'Signal response media production',
                'SDR outbound clips',
                'LinkedIn carousel assets',
                'Founder commentary media',
                'Monthly signal briefing'
            ]
        },
        strike: {
            name: 'Strike Plan',
            desc: 'Scaling Series B cybersecurity vendors. The full signal-driven GTM engine.',
            class: 'tier-strike',
            badge: 'RECOMMENDED INFRASTRUCTURE',
            features: [
                'Continuous signal monitoring',
                'Rapid signal response production',
                'Outbound media library for SDR teams',
                'Competitor narrative breakdowns',
                'Carousel distribution assets',
                'Weekly intelligence sync'
            ]
        },
        command: {
            name: 'Command Plan',
            desc: 'Late-stage vendors and category leaders. Full narrative coverage of the cybersecurity market.',
            class: 'tier-command',
            badge: 'ENTERPRISE INFRASTRUCTURE',
            features: [
                'Priority signal monitoring',
                'Rapid response media production',
                'Outbound video libraries',
                'Executive market briefings',
                'Narrative strategy support',
                'Category positioning support'
            ]
        }
    };

    let currentPlan = '';

    const renderFeatures = (features) => {
        const fragment = document.createDocumentFragment();

        features.forEach((feature) => {
            const listItem = document.createElement('li');
            listItem.textContent = feature;
            fragment.appendChild(listItem);
        });

        return fragment;
    };

    const updateCalculator = (value) => {
        const reps = parseInt(value, 10) || 1;
        display.textContent = String(reps);

        let planKey = '';
        if (reps <= 5) {
            planKey = 'signal';
        } else if (reps <= 25) {
            planKey = 'strike';
        } else {
            planKey = 'command';
        }

        if (planKey !== currentPlan) {
            const plan = planData[planKey];
            featuresContainer.style.opacity = '0';

            setTimeout(() => {
                tierName.textContent = plan.name;
                tierDesc.textContent = plan.desc;
                tierBadge.textContent = plan.badge;
                tierBox.className = `recommended-tier text-left p-8 glass-card border-glass ${plan.class}`;
                featuresList.replaceChildren(renderFeatures(plan.features));
                featuresContainer.style.opacity = '1';
            }, 150);

            currentPlan = planKey;
        }
    };

    updateCalculator(slider.value);

    slider.addEventListener('input', (event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        updateCalculator(event.target.value);
    });
}

/* ==========================================================================
   4. MULTI-STEP CONVERSION FORM
   ========================================================================== */
function initMultiStepForm() {
    const steps = [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3'),
        document.getElementById('step-success')
    ];

    const dots = [
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
    const loader = submitBtn?.querySelector('.loader-icon');
    const btnText = submitBtn?.querySelector('span');

    if (!form || !emailInput || !emailError || !categorySelect || !goalSelect || !submitBtn) {
        return;
    }

    const genericDomains = new Set(['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com']);

    const clearFormStatus = () => {
        if (!formStatus) return;

        formStatus.textContent = '';
        formStatus.classList.add('hidden');
        formStatus.classList.remove('text-error', 'text-success');
    };

    const setFormStatus = (message, tone = 'error') => {
        if (!formStatus) return;

        formStatus.textContent = message;
        formStatus.classList.remove('hidden', 'text-error', 'text-success');
        formStatus.classList.add(tone === 'success' ? 'text-success' : 'text-error');
    };

    const setLoadingState = (isLoading) => {
        submitBtn.disabled = isLoading;
        if (btnText) {
            btnText.classList.toggle('hidden', isLoading);
        }
        if (loader) {
            loader.classList.toggle('hidden', !isLoading);
        }
    };

    const showStep = (index) => {
        steps.forEach((step, stepIndex) => {
            if (!step) return;
            step.classList.toggle('hidden', stepIndex !== index);
            step.classList.toggle('active', stepIndex === index);
        });

        dots.forEach((dot, dotIndex) => {
            if (!dot) return;
            dot.classList.toggle('active', dotIndex <= Math.min(index, dots.length - 1));
        });
    };

    const validateEmail = () => {
        const email = emailInput.value.trim().toLowerCase();
        const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        const domain = email.split('@')[1] || '';

        emailInput.setAttribute('aria-invalid', 'false');

        if (!email) {
            emailError.textContent = 'Email is required.';
            emailError.classList.remove('hidden');
            emailInput.setAttribute('aria-invalid', 'true');
            return false;
        }

        if (!isValidFormat) {
            emailError.textContent = 'Please enter a valid email format.';
            emailError.classList.remove('hidden');
            emailInput.setAttribute('aria-invalid', 'true');
            return false;
        }

        if (genericDomains.has(domain)) {
            emailError.textContent = 'Please use your B2B work email address.';
            emailError.classList.remove('hidden');
            emailInput.setAttribute('aria-invalid', 'true');
            return false;
        }

        emailError.classList.add('hidden');
        return true;
    };

    const validateCategory = () => {
        const isValid = categorySelect.value !== '';
        categorySelect.style.borderColor = isValid ? 'var(--border-glass)' : 'var(--status-error)';
        categorySelect.setAttribute('aria-invalid', String(!isValid));
        return isValid;
    };

    const validateGoal = () => {
        const isValid = goalSelect.value !== '';
        goalSelect.style.borderColor = isValid ? 'var(--border-glass)' : 'var(--status-error)';
        goalSelect.setAttribute('aria-invalid', String(!isValid));
        return isValid;
    };

    const getAttribution = () => {
        const params = new URLSearchParams(window.location.search);
        const attribution = {
            source: 'website',
            page: window.location.pathname,
            referrer: document.referrer || ''
        };

        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
            const value = params.get(key);
            if (value) {
                attribution[key] = value;
            }
        });

        return attribution;
    };

    if (nextBtn1) {
        nextBtn1.addEventListener('click', () => {
            clearFormStatus();
            if (validateEmail()) showStep(1);
        });
    }

    if (backBtn1) {
        backBtn1.addEventListener('click', () => {
            clearFormStatus();
            showStep(0);
        });
    }

    if (nextBtn2) {
        nextBtn2.addEventListener('click', () => {
            clearFormStatus();
            if (validateCategory()) showStep(2);
        });
    }

    if (backBtn2) {
        backBtn2.addEventListener('click', () => {
            clearFormStatus();
            showStep(1);
        });
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        clearFormStatus();

        if (honeypot && honeypot.value.trim() !== '') {
            return;
        }

        if (!validateEmail()) {
            showStep(0);
            return;
        }

        if (!validateCategory()) {
            showStep(1);
            return;
        }

        if (!validateGoal()) {
            showStep(2);
            return;
        }

        setLoadingState(true);

        const corePayload = {
            email: emailInput.value.trim(),
            category: categorySelect.value,
            goal: goalSelect.value
        };
        const payload = SUPABASE_CONFIG.enabled
            ? corePayload
            : {
                ...corePayload,
                timestamp: new Date().toISOString(),
                ...getAttribution()
            };

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            await submitLead(payload, controller.signal);

            if (formProgress) {
                formProgress.classList.add('hidden');
            }

            showStep(3);
            setFormStatus('Request submitted successfully.', 'success');
        } catch (error) {
            const timedOut = error instanceof DOMException && error.name === 'AbortError';
            const message = timedOut
                ? 'Request timed out. Please retry in a moment.'
                : error instanceof Error && error.message
                  ? error.message
                  : 'Secure transmission failed. Please try again in a moment.';

            setFormStatus(message, 'error');
            setLoadingState(false);
        } finally {
            window.clearTimeout(timeoutId);
        }
    });

    categorySelect.addEventListener('change', () => {
        categorySelect.style.borderColor = 'var(--border-glass)';
        categorySelect.setAttribute('aria-invalid', 'false');
        clearFormStatus();
    });

    goalSelect.addEventListener('change', () => {
        goalSelect.style.borderColor = 'var(--border-glass)';
        goalSelect.setAttribute('aria-invalid', 'false');
        clearFormStatus();
    });

    emailInput.addEventListener('input', () => {
        emailError.classList.add('hidden');
        emailInput.setAttribute('aria-invalid', 'false');
        clearFormStatus();
    });
}

