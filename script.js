/**
 * IDEAFRIDGE SIGNAL ENGINE - INTERACTIVE LOGIC
 * Architecture: ES6+, Modular Event Listeners, State Management
 */

// ==========================================
// SUPABASE CONFIGURATION PLACEHOLDER
// ==========================================
const SUPABASE_URL = 'https://itfjnqmwfjhptcopfacd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_a7UeootOqf0KFd9rrroytQ_dbTSqNOg';
// Note: If using the Supabase JS Client, you would initialize here:
// const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


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
    
    // Trigger animations instantly for elements already in view on load
    setTimeout(() => {
        reveals.forEach(el => {
            if(el.classList.contains('fade-in')) {
                el.classList.add('active');
            }
        });
    }, 50);

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target); // Run once
            }
        });
    }, observerOptions);

    reveals.forEach(reveal => {
        if(reveal.classList.contains('reveal')) {
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

    menuBtn.addEventListener('click', () => {
        const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
        menuBtn.setAttribute('aria-expanded', !isExpanded);
        menuBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuBtn.classList.remove('active');
            navLinks.classList.remove('active');
            menuBtn.setAttribute('aria-expanded', 'false');
        });
    });
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

    if (!slider) return;

    // Feature data corresponding to exact screenshots
    const planData = {
        signal: {
            name: "Signal Plan",
            desc: "Early Series A and early Series B vendors. Establish your signal response capability.",
            class: "tier-signal",
            badge: "ENTRY INFRASTRUCTURE",
            features:[
                "Continuous cybersecurity signal monitoring",
                "Signal response media production",
                "SDR outbound clips",
                "LinkedIn carousel assets",
                "Founder commentary media",
                "Monthly signal briefing"
            ]
        },
        strike: {
            name: "Strike Plan",
            desc: "Scaling Series B cybersecurity vendors. The full signal-driven GTM engine.",
            class: "tier-strike",
            badge: "RECOMMENDED INFRASTRUCTURE",
            features:[
                "Continuous signal monitoring",
                "Rapid signal response production",
                "Outbound media library for SDR teams",
                "Competitor narrative breakdowns",
                "Carousel distribution assets",
                "Weekly intelligence sync"
            ]
        },
        command: {
            name: "Command Plan",
            desc: "Late-stage vendors and category leaders. Full narrative coverage of the cybersecurity market.",
            class: "tier-command",
            badge: "ENTERPRISE INFRASTRUCTURE",
            features:[
                "Priority signal monitoring",
                "Rapid response media production",
                "Outbound video libraries",
                "Executive market briefings",
                "Narrative strategy support",
                "Category positioning support"
            ]
        }
    };

    let currentPlan = '';

    const renderFeatures = (features) => {
        return features.map(feat => `<li>${feat}</li>`).join('');
    };

    const updateCalculator = (val) => {
        const reps = parseInt(val, 10);
        display.innerText = reps; // Update rolling number

        let planKey = '';

        // Logic thresholds
        if (reps >= 1 && reps <= 5) planKey = 'signal';
        else if (reps >= 6 && reps <= 25) planKey = 'strike';
        else planKey = 'command';

        // Only update DOM if the plan tier actually changes
        if (planKey !== currentPlan) {
            const plan = planData[planKey];
            
            // Fade out
            featuresContainer.style.opacity = 0;
            
            setTimeout(() => {
                tierName.innerText = plan.name;
                tierDesc.innerText = plan.desc;
                tierBadge.innerText = plan.badge;
                
                // Swap classes for dynamic styling (CSS handles the dot/button colors based on this)
                tierBox.className = `recommended-tier text-left p-8 glass-card border-glass ${plan.class}`;
                
                // Inject new feature list
                featuresList.innerHTML = renderFeatures(plan.features);
                
                // Fade in
                featuresContainer.style.opacity = 1;
            }, 150); // matches var(--transition-fast)

            currentPlan = planKey;
        }
    };

    // Initialize the default state on load
    updateCalculator(slider.value);

    // Event listener for sliding
    slider.addEventListener('input', (e) => {
        updateCalculator(e.target.value);
    });
}

/* ==========================================================================
   4. MULTI-STEP CONVERSION FORM W/ HONEYPOT & API MOCK
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
    const honeypot = document.getElementById('gotcha'); // SPAM PROTECTION
    
    const nextBtn1 = document.getElementById('nextBtn1');
    const nextBtn2 = document.getElementById('nextBtn2');
    const backBtn1 = document.getElementById('backBtn1');
    const backBtn2 = document.getElementById('backBtn2');
    const form = document.getElementById('accessForm');
    const submitBtn = document.getElementById('submitBtn');
    const loader = submitBtn?.querySelector('.loader-icon');
    const btnText = submitBtn?.querySelector('span');

    let currentStep = 0;

    const showStep = (index) => {
        steps.forEach((step, i) => {
            if (step) {
                step.classList.toggle('hidden', i !== index);
                step.classList.toggle('active', i === index);
            }
        });
        dots.forEach((dot, i) => {
            if(dot) {
                dot.classList.toggle('active', i <= index);
            }
        });
        currentStep = index;
    };

    // B2B Email Validation logic
    const validateEmail = () => {
        const email = emailInput.value.trim();
        const genericDomains =['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'];
        const domain = email.split('@')[1];
        
        const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        
        if (!email) {
            emailError.innerText = "Email is required.";
            emailError.classList.remove('hidden');
            return false;
        } else if (!isValidFormat) {
            emailError.innerText = "Please enter a valid email format.";
            emailError.classList.remove('hidden');
            return false;
        } else if (genericDomains.includes(domain)) {
            emailError.innerText = "Please use your B2B work email address.";
            emailError.classList.remove('hidden');
            return false;
        }
        
        emailError.classList.add('hidden');
        return true;
    };

    if (nextBtn1) nextBtn1.addEventListener('click', () => { if(validateEmail()) showStep(1); });
    if (backBtn1) backBtn1.addEventListener('click', () => showStep(0));
    
    // Step 2 Validation
    if (nextBtn2) nextBtn2.addEventListener('click', () => {
        if(categorySelect.value !== "") {
            categorySelect.style.borderColor = "var(--border-glass)";
            showStep(2);
        } else {
            categorySelect.style.borderColor = "var(--status-error)";
        }
    });
    if (backBtn2) backBtn2.addEventListener('click', () => showStep(1));

    // Form Submission / Supabase API Call
    if (form) form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // HONEYPOT CHECK - If a bot fills this out, abort silently.
        if(honeypot && honeypot.value !== "") {
            console.log("Bot detected. Silently aborting.");
            return; 
        }

        if(goalSelect.value === "") {
            goalSelect.style.borderColor = "var(--status-error)";
            return;
        }

        // Setup UI for loading state
        btnText.classList.add('hidden');
        loader.classList.remove('hidden');
        submitBtn.disabled = true;

        const payload = {
            email: emailInput.value.trim(),
            category: categorySelect.value,
            goal: goalSelect.value,
            timestamp: new Date().toISOString()
        };

        try {
            // ==========================================
            // SUPABASE INSERT LOGIC GOES HERE
            // Example using Fetch API (REST):
            /*
            const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Network response was not ok');
            */
            // ==========================================

            // Simulating network delay for smooth UI
            setTimeout(() => {
                document.querySelector('.form-progress').classList.add('hidden');
                showStep(3); // Show Success State
            }, 1200);

        } catch (error) {
            console.error('Error submitting to Supabase:', error);
            // Handle error state gracefully here
            alert("Secure transmission failed. Please try again.");
            
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
            submitBtn.disabled = false;
        }
    });

    // Clear errors on typing/changing
    if(categorySelect) categorySelect.addEventListener('change', () => categorySelect.style.borderColor = "var(--border-glass)");
    if(goalSelect) goalSelect.addEventListener('change', () => goalSelect.style.borderColor = "var(--border-glass)");
    if(emailInput) emailInput.addEventListener('input', () => emailError.classList.add('hidden'));
}