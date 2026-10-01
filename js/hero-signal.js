/** Ideafridge / Chorus, continuous edition.
 * One ribbon field separates into three expressions. Every strip persists.
 * The existing controller owns visibility, pause and the animation clock.
 */
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{const t=clamp(n);return t*t*t*(t*(t*6-15)+10)};
const mix=(a,b,t)=>a+(b-a)*t;
const bell=(x,centre,width)=>Math.exp(-Math.pow((x-centre)/width,2));
export const SIGNAL_PERIOD=13.6;

// The curve has a slightly tapered waist: depth is expressed through shape and
// ink tone, with no gradients, blur, shadows, perspective camera or 3D library.
export function ribbonPath(r){
  const {x,y,h,bend,w,waist}=r;
  const f=n=>n.toFixed(3);
  const a=x-w/2,b=x+w/2,m=w*waist/2;
  return `M${f(a)} ${f(y-h/2)} C${f(x+bend-m)} ${f(y-h/6)},${f(x-bend-m)} ${f(y+h/6)},${f(a)} ${f(y+h/2)} L${f(b)} ${f(y+h/2)} C${f(x-bend+m)} ${f(y+h/6)},${f(x+bend+m)} ${f(y-h/6)},${f(b)} ${f(y-h/2)} Z`;
}
export function chorusState(seconds,compact=false){
  const t=((seconds%SIGNAL_PERIOD)+SIGNAL_PERIOD)%SIGNAL_PERIOD;
  const count=compact?7:9, n=count*3;
  const width=compact?420:600,height=compact?340:530;
  const cx=width/2,cy=height/2;
  // A single directional fold crosses the source, then settles. All ribbons
  // remain stationary in the holds; the cycle never empties the composition.
  const foldProgress=ease((t-.45)/1.95);
  const foldGate=ease((t-.45)/.35)*(1-ease((t-2.05)/.55));
  const ribbons=Array.from({length:n},(_,i)=>{
    const group=Math.floor(i/count), j=i%count;
    const u=(i-(n-1)/2)/((n-1)/2),v=(j-(count-1)/2)/((count-1)/2);
    const start=3.15+group*.13;
    const release=ease((t-start)/2.4);
    const gather=1-ease((t-9.0-group*.09)/2.35);
    const out=release*gather;
    const half=compact?111:150;
    const source={x:cx+u*half,y:cy+(compact?29:43)*Math.sin(u*Math.PI/2),h:(compact?146:215)-(compact?26:40)*Math.pow(Math.abs(u),1.4),bend:compact?23:34,w:compact?5.05:5.75};
    const centers=compact?[[83,100],[210,170],[337,240]]:[[132,154],[300,265],[468,376]];
    const primary=group===1;
    const target={x:centers[group][0]+v*(compact?(primary?51:44):(primary?69:57)),y:centers[group][1]+(compact?19:27)*Math.sin(v*Math.PI/2),h:(compact?(primary?109:90):(primary?151:123))-(compact?18:25)*Math.pow(Math.abs(v),1.4),bend:compact?(primary?19:15):(primary?26:21),w:compact?(primary?6.4:5.7):(primary?8.5:7.1)};
    const fold=foldGate*bell((u+1)/2,foldProgress,.19);
    // A delayed bend accompanies each separation. It resolves fully before
    // the hold, making the three shapes feel like parts of one material.
    const turn=Math.sin(out*Math.PI);
    const bend=mix(source.bend,target.bend,out)+(compact?6:10)*fold+(group-1)*7*turn;
    const tone=Math.round(23+10*(u+1)/2+12*fold+8*turn);
    return {x:mix(source.x,target.x,out),y:mix(source.y,target.y,out),h:mix(source.h,target.h,out),bend,w:mix(source.w,target.w,out)*(1-.13*fold),waist:.82+.12*turn,color:`rgb(${tone},${tone+1},${tone})`,group};
  });
  return {width,height,ribbons};
}
export function chorusSVG(compact=false){
  const state=chorusState(7,compact);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${state.width} ${state.height}">${state.ribbons.map(r=>`<path fill="${r.color}" d="${ribbonPath(r)}"/>`).join('')}</svg>`;
}
export function createHeroSignal(host){
  const canvas=host.querySelector('canvas'),ctx=canvas?.getContext('2d');
  if(!ctx)return{render(){},reset(){},onHeadline(){}};
  const narrow=matchMedia('(max-width: 650px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let time=0,scale=1,lastKey='',staticMode=false;
  function render(seconds,force=false){
    time=seconds;
    if(staticMode){staticMode=false;lastKey='';}
    const state=chorusState(seconds,narrow.matches);
    const key=JSON.stringify(state);
    if(!force&&key===lastKey)return;
    lastKey=key;
    ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,state.width,state.height);
    for(const r of state.ribbons){ctx.fillStyle=r.color;ctx.fill(new Path2D(ribbonPath(r)));}
    host.classList.add('is-ready');
  }
  function resize(){
    const state=chorusState(time,narrow.matches),w=host.getBoundingClientRect().width;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.max(1,Math.round(w*dpr));canvas.height=Math.max(1,Math.round(w*state.height/state.width*dpr));
    scale=canvas.width/state.width;lastKey='';
    if(!staticMode&&!reduced.matches)render(time,true);
  }
  function reset(){staticMode=true;time=0;lastKey='';host.classList.remove('is-ready');}
  function onHeadline(){} // Keep the existing headline rhythm independent.
  new ResizeObserver(resize).observe(host);narrow.addEventListener('change',resize);resize();
  return{render,reset,onHeadline};
}
