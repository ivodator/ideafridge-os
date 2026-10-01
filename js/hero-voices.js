/** One idea. Many voices.
 * A single mark becomes five distinct editorial compositions.
 * Driven by the existing scene clock: no extra rAF, observers, or event listeners.
 */
export function createHeroVoices(svg) {
  const clamp = n => Math.max(0, Math.min(1, n));
  const ease = n => {const t=clamp(n);return t*t*t*(t*(t*6-15)+10);};
  const mix = (a,b,t) => a+(b-a)*t;
  const centre = [300,262];
  const seed = svg.querySelector('[data-idea]');
  const seedLines = [...seed.querySelectorAll('[data-idea-line]')];
  const signature = [[-22,-11,44],[-22,0,34],[-22,11,24]];
  const cache = new WeakMap();
  const set = (el,key,value) => {
    const v=typeof value==='number'?value.toFixed(3):value;
    let previous=cache.get(el);
    if(!previous){previous={};cache.set(el,previous);}
    if(previous[key]===v)return;
    previous[key]=v;
    el.setAttribute(key,v);
  };
  const voices = [...svg.querySelectorAll('[data-voice]')].map(group=>({
    group,
    x:+group.dataset.x, y:+group.dataset.y,
    start:+group.dataset.start, duration:2.55,
    bend:+group.dataset.bend,
    lines:[...group.querySelectorAll('[data-signature]')].map((el,i)=>({el,i,x:+el.dataset.x,y:+el.dataset.y,width:+el.dataset.width})),
    details:[...group.querySelectorAll('[data-detail]')].map((el,i)=>({el,i,x:+el.dataset.x,y:+el.dataset.y,width:+el.dataset.width}))
  }));
  const original=[seed,...seedLines,...voices.flatMap(v=>[v.group,...v.lines.map(l=>l.el),...v.details.map(l=>l.el)])].map(el=>({el,attrs:['opacity','transform'].map(name=>[name,el.getAttribute(name)])}));
  const stroke = (el,x,y,width) => set(el,'transform',`translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${width.toFixed(3)} 1)`);

  return {
    render(seconds) {
      const t=seconds%12.4;
      const dissolve=1-ease((t-10.15)/1.65);
      const returnToStart=1-ease((t-11.35)/1.0);
      const focus=ease((t-.12)/1.3)*returnToStart;
      const distributed=ease((t-4.0)/2.6)*dissolve;
      set(seed,'opacity',.56+.44*focus-.24*distributed);
      set(seed,'transform',`translate(300 262) scale(${(.98+.02*focus).toFixed(4)})`);
      seedLines.forEach((el,i)=>{
        const reveal=ease((t-.16-i*.13)/.95)*returnToStart;
        const [x,y,width]=signature[i];
        stroke(el,x,y,width*(.72+.28*reveal));
      });
      voices.forEach(voice=>{
        const u=(t-voice.start)/voice.duration;
        const travel=ease(u);
        const reshape=ease((u-.28)/.72);
        const arc=Math.sin(Math.PI*travel)*voice.bend;
        const dx=voice.x-centre[0],dy=voice.y-centre[1];
        const length=Math.hypot(dx,dy);
        const x=mix(centre[0],voice.x,travel)-dy/length*arc;
        const y=mix(centre[1],voice.y,travel)+dx/length*arc;
        set(voice.group,'transform',`translate(${x.toFixed(3)} ${y.toFixed(3)})`);
        set(voice.group,'opacity',ease((u-.06)/.27)*dissolve);
        voice.lines.forEach(line=>{
          const [sx,sy,sw]=signature[line.i];
          stroke(line.el,mix(sx,line.x,reshape),mix(sy,line.y,reshape),mix(sw,line.width,reshape));
        });
        voice.details.forEach(line=>{
          const reveal=ease((t-voice.start-voice.duration+.12-line.i*.065)/.85);
          stroke(line.el,line.x,line.y,line.width*(.62+.38*reveal));
          set(line.el,'opacity',reveal);
        });
      });
    },
    reset() {
      original.forEach(({el,attrs})=>{
        attrs.forEach(([name,value])=>value===null?el.removeAttribute(name):el.setAttribute(name,value));
        cache.delete(el);
      });
    }
  };
}
