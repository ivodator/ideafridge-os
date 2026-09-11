import { initAnimations, initProcess } from './motion.js';
import { initContact } from './contact.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.site-header');
const updateHeader = () => header.classList.toggle('has-scrolled', window.scrollY > 20);
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();
document.querySelector('#year').textContent = new Date().getFullYear();

const dialog = document.querySelector('#privacy-dialog');
document.querySelectorAll('[data-open-privacy]').forEach(button => {
  button.addEventListener('click', () => dialog.showModal());
});
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});

const scenes = [
  { kicker: '01 / The opening', lines: ['A new feature.', 'Three questions', 'worth asking.'], support: 'What a competitor’s latest release means for your next evaluation.' },
  { kicker: '02 / The perspective', lines: ['Your workflow.', 'Your controls.', 'Your real cost.'], support: 'Look at the change through the decisions your team actually needs to make.' },
  { kicker: '03 / The takeaway', lines: ['Take better', 'questions into', 'the conversation.'], support: 'A useful evaluation starts with the trade-offs that matter to your business.' },
];
document.querySelectorAll('[data-scene]').forEach(button => {
  button.addEventListener('click', () => {
    const scene = scenes[Number(button.dataset.scene)];
    document.querySelectorAll('[data-scene]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#scene-kicker').textContent = scene.kicker;
    const copy = document.querySelector('#scene-copy');
    copy.replaceChildren();
    scene.lines.forEach((line, index) => {
      if (index) copy.append(document.createElement('br'));
      copy.append(document.createTextNode(line));
    });
    document.querySelector('#scene-support').textContent = scene.support;
    if (window.gsap && !reducedMotion.matches) window.gsap.fromTo('.storyboard-content', { opacity: 0.45, y: 8 }, { opacity: 1, y: 0, duration: 0.35, overwrite: true });
  });
});

initContact();
initProcess();

const startMotion = () => {
  if (!reducedMotion.matches) initAnimations();
  if (!reducedMotion.matches && window.innerWidth >= 768) {
    import('./signal.js').then(({ initSignal }) => initSignal()).catch(() => { /* The complete SVG diagram remains available. */ });
  }
};
if (document.readyState === 'complete') document.fonts.ready.then(startMotion);
else window.addEventListener('load', () => document.fonts.ready.then(startMotion), { once: true });
