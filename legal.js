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
        threshold: 0.05
    };

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target); // Run once per element
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
   2. SMOOTH SCROLLING FOR TOC LINKS
   ========================================================================== */
function initSmoothScrolling() {
    const tocLinks = document.querySelectorAll('.toc a');
    
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Offset for fixed navbar (64px) plus some breathing room (32px)
                const offset = 96;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                // Optional: Update URL without jumping
                history.pushState(null, null, targetId);
            }
        });
    });
}

/* ==========================================================================
   3. TOC SCROLLSPY (Highlights active section)
   ========================================================================== */
function initScrollspy() {
    const sections = document.querySelectorAll('.doc-section');
    const navLinks = document.querySelectorAll('.toc a');
    
    if (!sections.length || !navLinks.length) return;

    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = window.pageYOffset;
        
        // Find the current section
        sections.forEach(section => {
            // 120px offset to trigger highlight slightly before the section hits the top
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        // Remove active class from all, add to current
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}