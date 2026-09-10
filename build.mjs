import { build } from 'esbuild';
import fs from 'node:fs';
await build({entryPoints:['scene.js'],bundle:true,format:'iife',minify:true,outfile:'app.bundle.js'});
let css=fs.readFileSync('style.css','utf8').replace(/url\('([^']+\.woff2)'\)/g,(_,f)=>`url('data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}')`);
let html=fs.readFileSync('index.html','utf8').replace('<link rel="stylesheet" href="style.css">',`<style>${css}</style>`);
html=html.replace(/<script src="([^"]+)"><\/script>/g,(_,f)=>`<script>${fs.readFileSync(f,'utf8').replace(/<\/script/gi,'<\\/script')}</script>`);
fs.writeFileSync('OPEN_ME.html',html);
console.log('Built app.bundle.js and OPEN_ME.html');
