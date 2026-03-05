/**
 * Animation and interaction logic for Legal Protocol pages (Privacy & Terms)
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // Smooth reveal animation using IntersectionObserver
    const animatedElements = document.querySelectorAll('.fade-in');
    
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after showing so it only animates once
                observer.unobserve(entry.target);
            }
        });
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    animatedElements.forEach(el => observer.observe(el));
});