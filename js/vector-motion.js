import { createHeroSignal } from './hero-signal.js';
import { createHeroVoices } from './hero-voices.js';

/** Ideafridge motion: selection → structure → distribution.
 * Native rAF, cached geometry, deterministic timelines, no network or dependencies.
 * Timing is in seconds. Complete static illustrations are authored in the HTML.
 */
const clamp = x => Math.max(0, Math.min(1, x));
const ease = x => { const t = clamp(x); return t*t*t*(t*(t*6-15)+10); };
const WORD_PERIOD = 5.2;
const WORD_HOLD = 4.35;
const PERIODS = { hero: 11.8, process: 10.8, reach: 9.6 };
const MOBILE_OFFSETS = [0, 2.6, 4.2];
const MOBILE_PERIODS = [5.8, 5.8, 6.8];
const OFFSETS = [[19,7],[-13,3],[24,-5],[-7,6],[17,-4],[-12,4],[22,-6],[-6,6],[14,-3]];

export function initVectorMotion() {
  const roots = [...document.querySelectorAll('[data-motion-scene]')];
  if (!roots.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = reduced.matches;
  const narrow = matchMedia('(max-width: 650px)');
  const controls = [...document.querySelectorAll('.motion-toggle')];
  const words = [...document.querySelectorAll('[data-word]')];
  const originals = [];
  const cache = new WeakMap();
  let paused = false, frame = 0, last = 0, wordTime = 0, processTime = 0, previousWord = -1;
  const set = (el, key, value, style = false) => {
    if (!el) return;
    const v = typeof value === 'number' ? value.toFixed(3) : value;
    let record = cache.get(el);
    if (!record) { record = {}; cache.set(el, record); }
    const k = (style ? 'style:' : '') + key;
    if (record[k] === v) return;
    record[k] = v;
    if (style) el.style[key] = v;
    else el.setAttribute(key, v);
  };
  roots.forEach(root => root.querySelectorAll('svg *, [data-word]').forEach(el => {
    originals.push({el, attrs:['style','transform','opacity','cx','cy','r','stroke-width','stroke-dashoffset'].map(name=>[name,el.getAttribute(name)])});
  }));
  const timed = (root, selector, startKey, durationKey, fallback) => [...root.querySelectorAll(selector)].map(el=>({el,start:+el.dataset[startKey],duration:+el.dataset[durationKey]||fallback}));
  const scenes = roots.map(root => ({
    root, kind:root.dataset.motionScene, stage:+root.dataset.stage||0, visible:false, time:0,
    signal:root.querySelector('.signal-imprint')?createHeroSignal(root.querySelector('.signal-imprint')):null,
    voices:root.querySelector('.voices-art')?createHeroVoices(root.querySelector('.voices-art')):null,
    draws:timed(root,'[data-draw-start]','drawStart','drawDuration',1.5),
    trails:timed(root,'[data-trail-start]','trailStart','trailDuration',1.5),
    reveals:timed(root,'[data-reveal-start]','revealStart','revealDuration',.95),
    fragments:timed(root,'[data-align]','alignStart','alignDuration',.95),
    units:timed(root,'[data-unit-start]','unitStart','unitDuration',.65),
    terminals:timed(root,'[data-terminal-start]','terminalStart','terminalDuration',.48),
    arrivals:timed(root,'[data-arrival-start]','arrivalStart','arrivalDuration',1.1),
    routes:[...root.querySelectorAll('[data-route]')].map(dot=>{
      const path=document.getElementById(dot.dataset.route);
      const length=path.getTotalLength();
      const samples=Array.from({length:161},(_,i)=>{const p=path.getPointAtLength(length*i/160);return[p.x,p.y];});
      return {dot,samples,start:+dot.dataset.start,duration:+dot.dataset.duration};
    }),
    fields:[...root.querySelectorAll('[data-field]')],
    aperture:root.querySelector('[data-aperture]'),
    focus:root.querySelector('[data-focus]'),
    selected:root.querySelector('[data-selection]')
  }));
  if(!reducedMotion)scenes.forEach(scene=>{scene.voices?.render(0);scene.signal?.render(0);});
  const resetStatic = () => {
    originals.forEach(({el,attrs})=>{
      attrs.forEach(([name,value])=>value===null?el.removeAttribute(name):el.setAttribute(name,value));
      cache.delete(el);
    });
    scenes.forEach(scene=>{scene.voices?.reset();scene.signal?.reset();});
    words.forEach(w=>w.classList.remove('is-moving'));
    previousWord=-1;
  };
  const renderWords = () => {
    if (!words.length) return;
    const index=Math.floor(wordTime/WORD_PERIOD)%words.length;
    const next=(index+1)%words.length;
    const phase=wordTime%WORD_PERIOD;
    if(index!==previousWord){
      words.forEach((word,i)=>{
        set(word,'opacity',i===index?1:0,true);
        set(word,'transform','translate3d(0,0,0)',true);
        set(word,'filter','blur(0px)',true);
        word.classList.remove('is-moving');
      });
      previousWord=index;
      scenes.find(s=>s.kind==='hero')?.signal?.onHeadline(Math.floor(wordTime/WORD_PERIOD));
    }
    if(phase<=WORD_HOLD)return;
    const u=(phase-WORD_HOLD)/(WORD_PERIOD-WORD_HOLD);
    const outgoing=ease(u/.82), incoming=ease((u-.12)/.88);
    words[index].classList.add('is-moving');words[next].classList.add('is-moving');
    set(words[index],'opacity',1-outgoing,true);
    set(words[index],'transform',`translate3d(0,${(-.115*outgoing).toFixed(4)}em,0)`,true);
    set(words[index],'filter',`blur(${(1.8*outgoing).toFixed(2)}px)`,true);
    set(words[next],'opacity',incoming,true);
    set(words[next],'transform',`translate3d(0,${(.15*(1-incoming)).toFixed(4)}em,0)`,true);
    set(words[next],'filter',`blur(${(2.6*(1-incoming)).toFixed(2)}px)`,true);
  };
  const renderScene = scene => {
    if(scene.signal){scene.signal.render(scene.time);return;}
    if(scene.voices){scene.voices.render(scene.time);return;}
    const mobileProcess=scene.kind==='process'&&narrow.matches;
    const period=mobileProcess?MOBILE_PERIODS[scene.stage]:PERIODS[scene.kind];
    const local=(scene.kind==='process'&&!narrow.matches?processTime:scene.time)%period;
    const t=local+(mobileProcess?MOBILE_OFFSETS[scene.stage]:0);
    const reset=1-ease((local-(period-1.35))/1.3);
    const selected=ease((t-.2)/1.45)*reset;
    scene.fields.forEach((el,i)=>{
      const scan=ease((t-.12-i*.045)/.45)*(1-ease((t-.65-i*.045)/.6));
      set(el,'strokeOpacity',.25+.34*scan-.10*selected,true);
      set(el,'transform',`translate(${((i%3-1)*4*selected).toFixed(2)} 0)`);
    });
    scene.draws.forEach(({el,start,duration})=>{
      const progress=ease((t-start)/duration);
      const settled=ease((t-start-duration-.15)/.75);
      set(el,'stroke-dashoffset',1-progress);
      set(el,'opacity',(.82-.56*settled)*ease(progress/.08)*reset,true);
    });
    scene.trails.forEach(({el,start,duration})=>{
      const u=(t-start)/duration;
      set(el,'opacity',.65*ease(u/.16)*(1-ease((u-.82)/.18)),true);
      if(u>=0&&u<=1)set(el,'stroke-dashoffset',.13-ease(u));
    });
    scene.routes.forEach(({dot,samples,start,duration})=>{
      const u=(t-start)/duration;
      set(dot,'opacity',ease(u/.1)*(1-ease((u-.91)/.09)),true);
      if(u<0||u>1)return;
      const location=ease(u)*160, i=Math.min(159,Math.floor(location)), f=location-i;
      const x=samples[i][0]+(samples[i+1][0]-samples[i][0])*f;
      const y=samples[i][1]+(samples[i+1][1]-samples[i][1])*f;
      set(dot,'transform',`translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    });
    scene.fragments.forEach(({el,start,duration})=>{
      const aligned=ease((t-start)/duration)*reset;
      const [dx,dy]=OFFSETS[+el.dataset.align%OFFSETS.length];
      set(el,'transform',`translate(${(dx*(1-aligned)).toFixed(2)} ${(dy*(1-aligned)).toFixed(2)}) scale(${(.94+.06*aligned).toFixed(4)} 1)`);
      set(el,'opacity',.27+.73*aligned,true);
    });
    // Output marks retain rigid, flush geometry throughout the loop.
    scene.units.forEach(({el,start,duration})=>{
      set(el,'opacity',.27+.73*ease((t-start)/duration)*reset,true);
    });
    scene.reveals.forEach(({el,start,duration})=>{
      set(el,'stroke-dashoffset',.36*(1-ease((t-start)/duration)*reset));
    });
    scene.terminals.forEach(({el,start,duration})=>{
      const arrival=ease((t-start)/duration)*reset;
      set(el,'opacity',.48+.52*arrival,true);
      set(el,'strokeWidth',1.1+arrival*.55,true);
    });
    scene.arrivals.forEach(({el,start,duration})=>{
      const u=(t-start)/duration;
      set(el,'opacity',.34*ease(u/.24)*(1-ease((u-.24)/.76)),true);
      if(u>=0&&u<=1)set(el,'r',+el.dataset.arrivalRadius+5*ease(u));
    });
    set(scene.aperture,'opacity',.4+.6*selected,true);
    set(scene.aperture,'transform',`translate(226 260) scale(${(1-.065*selected).toFixed(4)}) translate(-226 -260)`);
    if(scene.focus){
      set(scene.focus,'transform',`translate(150 110) scale(${(1.035-.035*selected).toFixed(4)}) translate(-150 -110)`);
      set(scene.focus,'opacity',.35+.65*selected,true);
    }
    set(scene.selected,'opacity',.5+.5*selected,true);
  };
  const active=()=>!paused&&!reducedMotion&&!document.hidden&&scenes.some(s=>s.visible);
  const tick=now=>{
    frame=0;
    if(!active()){last=0;return;}
    const delta=last?Math.min((now-last)/1000,.05):0;
    last=now;
    if(scenes.some(s=>s.kind==='process'&&s.visible))processTime+=delta;
    scenes.forEach(scene=>{
      if(!scene.visible)return;
      scene.time+=delta;
      renderScene(scene);
      if(scene.kind==='hero'){wordTime+=delta;renderWords();}
    });
    frame=requestAnimationFrame(tick);
  };
  const sync=()=>{
    if(active()){if(!frame)frame=requestAnimationFrame(tick);}
    else{cancelAnimationFrame(frame);frame=0;last=0;}
  };
  const updateControls=()=>controls.forEach(button=>{
    button.hidden=false;
    button.disabled=reducedMotion;
    button.setAttribute('aria-pressed',String(paused||reducedMotion));
    button.setAttribute('aria-label',reducedMotion?'Reduced motion enabled':paused?'Resume animations':'Pause animations');
    button.querySelector('span').textContent=reducedMotion?'Reduced motion':paused?'Play motion':'Pause motion';
    button.querySelector('path').setAttribute('d',paused?'M3 2 L10 6 L3 10 Z':'M4 2 V10 M8 2 V10');
  });
  controls.forEach(button=>button.addEventListener('click',()=>{
    paused=!paused;
    if(paused&&wordTime%WORD_PERIOD>WORD_HOLD){
      // Resolve the handoff so pause never freezes overlapping, blurred words.
      wordTime=(Math.floor(wordTime/WORD_PERIOD)+1)*WORD_PERIOD;
      renderWords();
    }
    updateControls();sync();
  }));
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{scenes.find(s=>s.root===entry.target).visible=entry.isIntersecting&&entry.intersectionRatio>=.04;});
    sync();
  },{threshold:[0,.04]});
  scenes.forEach(scene=>observer.observe(scene.root));
  reduced.addEventListener('change',event=>{
    reducedMotion=event.matches;
    if(reducedMotion){resetStatic();wordTime=0;processTime=0;scenes.forEach(s=>s.time=0);}
    updateControls();sync();
  });
  narrow.addEventListener('change',()=>{
    processTime=0;
    scenes.filter(s=>s.kind==='process').forEach(s=>s.time=0);
    sync();
  });
  document.addEventListener('visibilitychange',sync);
  updateControls();
}
