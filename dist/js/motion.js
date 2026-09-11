const paths = [
  'M210 76L294 165L210 254L126 165Z',
  'M154 90H244L266 112V240H154Z',
  'M158 67H262V263H158Z',
  'M210 130A35 35 0 1 1 210 200A35 35 0 1 1 210 130Z',
];
const captions = [
  'Something changed. Find out why it matters.',
  'Turn the signal into a supported point of view.',
  'A clear argument. Made for a short attention span.',
  'Useful content. In the hands of your team.',
];
let activeStep = 0;
let processTrigger;
let lenis;

function setStep(index, animate = true) {
  const gsap = window.gsap;
  activeStep = index;
  document.querySelectorAll('[data-step]').forEach(button => {
    const active = Number(button.dataset.step) === index;
    button.setAttribute('aria-pressed', String(active));
    button.closest('li').classList.toggle('is-active', active);
  });
  document.querySelector('.process-progress span').style.height = `${(index + 1) * 25}%`;
  document.querySelector('#process-count').textContent = `0${index + 1} / 04`;
  document.querySelector('#process-caption').textContent = captions[index];
  document.querySelectorAll('[data-glyph]').forEach(glyph => { glyph.hidden = Number(glyph.dataset.glyph) !== index; glyph.toggleAttribute('hidden', Number(glyph.dataset.glyph) !== index); });
  const shape = document.querySelector('#morph-outline');
  if (gsap && window.MorphSVGPlugin && animate && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gsap.to(shape, { morphSVG: paths[index], duration: 0.7, ease: 'power2.inOut', overwrite: true });
    gsap.fromTo(`[data-glyph="${index}"]`, { opacity: 0 }, { opacity: 1, duration: 0.5, overwrite: true });
  } else shape.setAttribute('d', paths[index]);
}

export function initProcess() {
  document.body.classList.add('motion-ready');
  document.querySelectorAll('[data-step]').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.step);
      if (processTrigger && window.innerWidth >= 1000 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const position = processTrigger.start + (processTrigger.end - processTrigger.start) * ((index + 0.35) / 4);
        if (lenis) lenis.scrollTo(position, { duration: 0.65 });
        else window.scrollTo({ top: position, behavior: 'smooth' });
      }
      setStep(index);
    });
  });
}

export function initAnimations() {
  const { gsap, ScrollTrigger, SplitText, MorphSVGPlugin, Lenis } = window;
  if (!gsap || !ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);
  if (MorphSVGPlugin) gsap.registerPlugin(MorphSVGPlugin);
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    let ticker;
    if (Lenis && window.matchMedia('(pointer: fine)').matches) {
      lenis = new Lenis({ duration: 0.9, smoothWheel: true, syncTouch: false, anchors: false });
      lenis.on('scroll', ScrollTrigger.update);
      ticker = time => lenis.raf(time * 1000);
      gsap.ticker.add(ticker);
    }
    const onAnchor = event => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || !lenis || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -94, onComplete: () => {
        history.pushState(null, '', link.getAttribute('href'));
        const wasFocusable = target.hasAttribute('tabindex');
        if (!wasFocusable) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (!wasFocusable) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      } });
    };
    document.addEventListener('click', onAnchor);
    const splits = [];
    if (SplitText) document.querySelectorAll('[data-split]').forEach(element => {
      splits.push(SplitText.create(element, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: self => gsap.from(self.lines, {
        yPercent: 105, opacity: 0, duration: 0.95, stagger: 0.11, ease: 'power3.out',
        scrollTrigger: { trigger: element, start: 'top 91%', once: true },
      }) }));
    });
    document.querySelectorAll('[data-reveal]').forEach(element => gsap.from(element, {
      y: 22, opacity: 0, duration: 0.75, ease: 'power2.out',
      scrollTrigger: { trigger: element, start: 'top 93%', once: true },
    }));
    gsap.from('.hero-intro, .hero-description, .hero-link', { y: 12, opacity: 0, duration: 0.7, stagger: 0.1, delay: 0.15, ease: 'power2.out' });
    document.querySelectorAll('.team-paths path').forEach((path, index) => {
      const length = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 1.1, delay: index * 0.07, ease: 'power1.inOut', scrollTrigger: { trigger: '.team-network', start: 'top 80%', once: true } });
    });
    const desktop = gsap.matchMedia();
    desktop.add('(min-width: 1000px)', () => {
      gsap.to('.hero-visual', { y: 55, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } });
      processTrigger = ScrollTrigger.create({
        trigger: '.process-stage', pin: true, start: 'top 135px', end: '+=1100', anticipatePin: 1,
        onUpdate: self => { const index = Math.min(3, Math.floor(self.progress * 4)); if (index !== activeStep) setStep(index); },
      });
      return () => { processTrigger = undefined; };
    });
    ScrollTrigger.refresh();
    return () => {
      document.removeEventListener('click', onAnchor);
      if (ticker) gsap.ticker.remove(ticker);
      if (lenis) { lenis.destroy(); lenis = undefined; }
      desktop.revert();
      splits.forEach(split => split.revert());
      gsap.set('[data-reveal], .hero-intro, .hero-description, .hero-link', { clearProps: 'all' });
      setStep(activeStep, false);
    };
  });
}
