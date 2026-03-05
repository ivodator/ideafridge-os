document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Animation System (IntersectionObserver) ---
    const animatedElements = document.querySelectorAll('.fade-in, .reveal');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    animatedElements.forEach(el => observer.observe(el));
    
    // --- 2. Spotlight Effect (Mouse Tracking) ---
    const spotlightCards = document.querySelectorAll('.spotlight-card');
    
    const handleMouseMove = (e) => {
        spotlightCards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    };

    document.addEventListener('mousemove', handleMouseMove);

    // --- 3. Mobile Menu Toggle ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    const closeMobileMenu = () => {
        if (!navLinks || !mobileBtn) return;
        navLinks.classList.remove('active');
        mobileBtn.classList.remove('is-open');
        mobileBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    };

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            const isActive = navLinks.classList.toggle('active');
            mobileBtn.classList.toggle('is-open', isActive);
            mobileBtn.setAttribute('aria-expanded', String(isActive));
            document.body.style.overflow = isActive ? 'hidden' : '';
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        document.addEventListener('click', (e) => {
            if (
                navLinks.classList.contains('active') &&
                !navLinks.contains(e.target) &&
                !mobileBtn.contains(e.target)
            ) {
                closeMobileMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                closeMobileMenu();
                mobileBtn.focus();
            }
        });
    }

    // --- 4. Smooth Scroll ---
    document.querySelectorAll('a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (!targetId || !targetId.startsWith('#')) return;
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- 5. Secure Form Handling (Supabase Integration structure) ---
    const form = document.querySelector('.waitlist-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const honeyInput = form.querySelector('#honeypot');
            const button = form.querySelector('button');
            const btnText = button.querySelector('span');
            
            const email = form.querySelector('input[name="email"]').value;
            const category = form.querySelector('input[name="category"]').value;

            if (honeyInput && honeyInput.value !== '') {
                console.log('Spam detected');
                return; 
            }

            btnText.innerText = 'SECURING ALLOCATION...';
            button.disabled = true;
            button.style.opacity = '0.7';

            try {
                // SUPABASE INTEGRATION
                const SUPABASE_URL = 'https://itfjnqmwfjhptcopfacd.supabase.co';   // <-- Replace
                const SUPABASE_ANON_KEY = 'sb_publishable_a7UeootOqf0KFd9rrroytQ_dbTSqNOg'; // <-- Replace

                /* Uncomment out the actual fetch logic when deploying your keys:
                const response = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ email: email, category: category })
                });
                if (!response.ok) throw new Error('Network response was not ok');
                */

                // Simulated Success State for display purposes
                setTimeout(() => {
                    btnText.innerText = 'APPLICATION RECEIVED';
                    button.style.background = '#fff'; 
                    button.style.color = '#000';
                    button.style.borderColor = '#fff';
                    
                    setTimeout(() => {
                        form.reset();
                        btnText.innerText = 'Request Access';
                        button.disabled = false;
                        button.style.background = ''; 
                        button.style.color = '';
                        button.style.borderColor = '';
                        button.style.opacity = '1';
                    }, 4000);
                }, 1000);
                
            } catch (error) {
                console.error('Submission failed', error);
                btnText.innerText = 'Error. Retry.';
                button.disabled = false;
                button.style.opacity = '1';
            }
        });
    }
});