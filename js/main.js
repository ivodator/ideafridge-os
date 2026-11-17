import { initContact } from './contact.js';
import { initVectorMotion } from './vector-motion.js';

const header = document.querySelector('.site-header');
const updateHeader = () => header?.classList.toggle('has-scrolled', window.scrollY > 20);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();
const year = document.querySelector('#year');
if (year) year.textContent = new Date().getFullYear();
if (document.querySelector('#connect-form')) initContact();
initVectorMotion();

// Reach thread: arm the hidden start state, then play once when it scrolls into view.
const thread = document.querySelector('.thread');
if (thread && 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  thread.classList.add('will-play');
  const threadObserver = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    thread.classList.add('is-playing');
    threadObserver.disconnect();
  }, { threshold: 0.45 });
  threadObserver.observe(thread);
}
