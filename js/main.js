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
