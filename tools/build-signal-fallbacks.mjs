/** From the website root: node tools/build-signal-fallbacks.mjs */
import fs from 'node:fs';
import {chorusSVG} from '../js/hero-signal.js';
for(const compact of [false,true]){
 const url=new URL(`../assets/signal-imprint-${compact?'mobile':'desktop'}.svg`,import.meta.url);
 fs.writeFileSync(url,chorusSVG(compact));
}
