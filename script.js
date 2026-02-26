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
    // FIX: was setting .style.transform on a NodeList (which silently fails).
    // Now we toggle a class on the button and let CSS handle each span individually.
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

        // Close menu when a nav link is clicked
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });

        // Close menu when clicking outside the drawer
        document.addEventListener('click', (e) => {
            if (
                navLinks.classList.contains('active') &&
                !navLinks.contains(e.target) &&
                !mobileBtn.contains(e.target)
            ) {
                closeMobileMenu();
            }
        });

        // Close menu on Escape key
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

    // --- 5. Secure Form Handling (Simulated) ---
    const form = document.querySelector('.waitlist-form');
    
    if (form) {
        const honeyInput = form.querySelector('#honeypot');
        const button = form.querySelector('button');
        const btnText = button.querySelector('span');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Spam trap check
            if (honeyInput && honeyInput.value !== '') {
                console.log('Spam detected');
                return; 
            }

            // Loading State
            btnText.innerText = 'INITIALIZING PROTOCOL...';
            button.disabled = true;
            button.style.opacity = '0.7';

            try {
                // Simulate Network Delay (Replace with actual Formspree/Netlify logic)
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Success State
                btnText.innerText = 'APPLICATION RECEIVED';
                button.style.background = '#fff'; 
                button.style.color = '#000';
                button.style.borderColor = '#fff';
                
                // Reset after delay
                setTimeout(() => {
                    form.reset();
                    btnText.innerText = 'Check Availability';
                    button.disabled = false;
                    button.style.background = ''; 
                    button.style.color = '';
                    button.style.borderColor = '';
                    button.style.opacity = '1';
                }, 4000);
                
            } catch (error) {
                console.error('Submission failed', error);
                btnText.innerText = 'Error. Retry.';
                button.disabled = false;
                button.style.opacity = '1';
            }
        });
    }
});
