/** Ideafridge / Chorus. One idea, expressed through several voices.
 * Hero-only renderer. Uses the existing shared clock and accessibility controls.
 */
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{const t=clamp(n);return t*t*t*(t*(t*6-15)+10)};
const mix=(a,b,t)=>a+(b-a)*t;
export const SIGNAL_PERIOD=12.8;

// Nine continuous ink ribbons form one recognizable mark. Their geometry is
// shared by the live canvas and static SVG, with no textures or particle field.
export function ribbonPath(index, spread=1, voice=0) {
  const u=(index-4)/4;
  const x=u*79*spread;
  const h=155-35*Math.pow(Math.abs(u),1.4);
  const y=32*Math.sin(u*Math.PI/2);
  const bend=25+voice*5;
  const width=8.8;
  const f=n=>n.toFixed(3);
  return `M${f(x-width/2)} ${f(y-h/2)} C${f(x+bend-width/2)} ${f(y-h/6)},${f(x-bend-width/2)} ${f(y+h/6)},${f(x-width/2)} ${f(y+h/2)} L${f(x+width/2)} ${f(y+h/2)} C${f(x-bend+width/2)} ${f(y+h/6)},${f(x+bend+width/2)} ${f(y-h/6)},${f(x+width/2)} ${f(y-h/2)} Z`;
}
export function chorusState(seconds,compact=false) {
  const t=((seconds%SIGNAL_PERIOD)+SIGNAL_PERIOD)%SIGNAL_PERIOD;
  const open=ease((t-.35)/2.05)*(1-ease((t-10.7)/1.75));
  const out=ease((t-3.55)/2.3)*(1-ease((t-8.6)/2.05));
  const middle=compact?[210,170]:[300,265];
  const mainScale=compact?1.16:1.62;
  const main={x:middle[0],y:middle[1],scale:mix(mainScale,compact?.69:.9,ease(out/.4)),spread:mix(.63,1,open),opacity:1,voice:0};
  const destinations=compact?[[91,100],[329,240]]:[[138,155],[462,375]];
  const echoes=destinations.map((p,i)=>{
    const travel=ease((t-3.55-i*.22)/2.15)*(1-ease((t-8.6-i*.12)/1.85));
    const arc=0;
    return {x:mix(middle[0],p[0],travel)+arc,y:mix(middle[1],p[1],travel),scale:compact?.53:.76,spread:mix(.63,1,open),opacity:ease((travel-.88)/.12),voice:i===0?-.7:.85};
  });
  return {width:compact?420:600,height:compact?340:530,main,echoes};
}
export function chorusSVG(compact=false) {
  const state=chorusState(7,compact);
  const mark=m=>`<g transform="translate(${m.x} ${m.y}) scale(${m.scale})">${Array.from({length:9},(_,i)=>`<path d="${ribbonPath(i,m.spread,m.voice)}"/>`).join('')}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${state.width} ${state.height}"><g fill="#171817">${state.echoes.map(mark).join('')}${mark(state.main)}</g></svg>`;
}
export function createHeroSignal(host) {
  const canvas=host.querySelector('canvas'),ctx=canvas?.getContext('2d');
  if(!ctx)return{render(){},reset(){},onHeadline(){}};
  const narrow=matchMedia('(max-width: 650px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let time=0,scale=1,lastKey='',staticMode=false;
  const paths=new Map();
  const path=(i,spread,voice)=>{
    const key=`${i}:${spread.toFixed(4)}:${voice}`;
    if(!paths.has(key)){
      if(paths.size>500)paths.clear();
      paths.set(key,new Path2D(ribbonPath(i,spread,voice)));
    }
    return paths.get(key);
  };
  function render(seconds,force=false){
    time=seconds;
    if(staticMode){staticMode=false;lastKey='';}
    const s=chorusState(seconds,narrow.matches);
    const key=JSON.stringify(s);
    if(!force&&key===lastKey)return;
    lastKey=key;
    ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,s.width,s.height);
    ctx.fillStyle='#171817';
    function mark(m){
      if(m.opacity<.001)return;
      ctx.save();ctx.translate(m.x,m.y);ctx.scale(m.scale,m.scale);ctx.globalAlpha=m.opacity;
      for(let i=0;i<9;i++)ctx.fill(path(i,m.spread,m.voice));
      ctx.restore();
    }
    s.echoes.forEach(mark);mark(s.main);
    host.classList.add('is-ready');
  }
  function resize(){
    const s=chorusState(time,narrow.matches),w=host.getBoundingClientRect().width;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(w*s.height/s.width*dpr));
    scale=canvas.width/s.width;lastKey='';
    if(!staticMode&&!reduced.matches)render(time,true);
  }
  function reset(){staticMode=true;time=0;lastKey='';host.classList.remove('is-ready');}
  // The headline keeps its own established rhythm. This identity opens and
  // resolves on a longer phrase, without reacting to every word.
  function onHeadline(){}
  new ResizeObserver(resize).observe(host);narrow.addEventListener('change',resize);resize();
  return{render,reset,onHeadline};
}
