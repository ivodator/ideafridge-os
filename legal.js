/**
 * IDEAFRIDGE LEGAL PAGES - INTERACTIVE LOGIC
 * Architecture: ES6+, Smooth Scroll, Scrollspy, Observers
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveals();
    initSmoothScrolling();
    initScrollspy();
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

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.05
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, observerOptions);

    reveals.forEach((reveal) => {
        if (reveal.classList.contains('reveal')) {
            observer.observe(reveal);
        }
    });
}

/* ==========================================================================
   2. SMOOTH SCROLLING FOR TOC LINKS
   ========================================================================== */
function initSmoothScrolling() {
    const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    tocLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();

            const targetId = link.getAttribute('href');
            if (!targetId) return;

            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            const offset = 96;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });

            history.replaceState(null, '', targetId);
        });
    });
}

/* ==========================================================================
   3. TOC SCROLLSPY (Highlights active section)
   ========================================================================== */
function initScrollspy() {
    const sections = Array.from(document.querySelectorAll('.doc-section[id]'));
    const navLinks = Array.from(document.querySelectorAll('.toc a[href^="#"]'));

    if (!sections.length || !navLinks.length) return;

    const linkById = new Map();
    navLinks.forEach((link) => {
        const id = link.getAttribute('href')?.slice(1);
        if (id) {
            linkById.set(id, link);
        }
    });

    const setActiveLink = (id) => {
        navLinks.forEach((link) => link.classList.remove('active'));
        const activeLink = linkById.get(id);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    };

    const initialHash = window.location.hash.slice(1);
    if (initialHash && linkById.has(initialHash)) {
        setActiveLink(initialHash);
    } else {
        setActiveLink(sections[0].id);
    }

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveLink(entry.target.id);
                    }
                });
            },
            {
                root: null,
                rootMargin: '-20% 0px -65% 0px',
                threshold: [0, 0.25, 0.5]
            }
        );

        sections.forEach((section) => observer.observe(section));
        return;
    }

    const fallbackUpdate = () => {
        let currentId = sections[0].id;
        const scrollPosition = window.pageYOffset + 120;

        sections.forEach((section) => {
            if (section.offsetTop <= scrollPosition) {
                currentId = section.id;
            }
        });

        setActiveLink(currentId);
    };

    window.addEventListener('scroll', fallbackUpdate, { passive: true });
    fallbackUpdate();
}

