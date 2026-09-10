import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SVGRenderer } from 'three/addons/renderers/SVGRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const gsap=window.gsap, ScrollTrigger=window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);
const $=s=>document.querySelector(s), clamp=THREE.MathUtils.clamp;
let mobile=innerWidth<600;
let renderer,software=false;
try { renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'}); }
catch(e){software=true;renderer=new SVGRenderer();renderer.setQuality('low');const badge=document.createElement('div');badge.className='compatibility';badge.textContent='COMPATIBILITY VIEW · WEBGL UNAVAILABLE';document.querySelector('.stage').appendChild(badge);}
if(!software)renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1.5:2));
renderer.setSize(innerWidth,innerHeight);renderer.setClearColor(0x000000,0);
if(!software){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
$('#scene').appendChild(renderer.domElement);
const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(32,innerWidth/innerHeight,.1,120);
if(!software){const pmrem=new THREE.PMREMGenerator(renderer), room=new RoomEnvironment();
const env=pmrem.fromScene(room,.04);scene.environment=env.texture;scene.environmentIntensity=.8;room.dispose();pmrem.dispose();}
scene.add(new THREE.HemisphereLight(0xe5f4ff,0x718092,2.1));
const key=new THREE.DirectionalLight(0xfffbf3,4);key.position.set(-5,14,8);key.castShadow=true;key.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(key.shadow.camera,{left:-10,right:10,top:12,bottom:-10,near:.5,far:40});key.shadow.normalBias=.035;key.shadow.bias=-.0002;scene.add(key);
const fill=new THREE.DirectionalLight(0xa9dfff,2.5);fill.position.set(8,7,-7);scene.add(fill);
const materials={
 panel:new THREE.MeshStandardMaterial({color:0xe5ebed,metalness:.22,roughness:.3}),
 white:new THREE.MeshStandardMaterial({color:0xf3f5f5,metalness:.18,roughness:.25}),
 steel:new THREE.MeshStandardMaterial({color:0xaebfc9,metalness:.88,roughness:.29}),
 edge:new THREE.MeshStandardMaterial({color:0x8599a7,metalness:.88,roughness:.27}),
 dark:new THREE.MeshStandardMaterial({color:0x20333f,metalness:.6,roughness:.38}),
 glass:new THREE.MeshPhysicalMaterial({color:0x286184,metalness:.35,roughness:.12,transparent:true,opacity:.78,clearcoat:1,side:THREE.DoubleSide}),
 led:new THREE.MeshStandardMaterial({color:0xe3faff,emissive:0xa7e8ff,emissiveIntensity:1.5,roughness:.23}),
 floor:new THREE.MeshStandardMaterial({color:0xcbd8df,metalness:.4,roughness:.33})
};
const names=['HVAC_SYSTEM','TGRID_CEILING','CLEANROOM_PANELS_DOORS','RAISED_FLOORING'];
const groups=names.map(name=>{const g=new THREE.Group();g.name=name;scene.add(g);return g;});
const [hvac,ceiling,walls,floor]=groups;
// Per-system material pools permit subtle highlighting without affecting other layers.
const pools=groups.map(()=>new Map());
function mat(group,type){const i=groups.indexOf(group),pool=pools[i];if(!pool.has(type))pool.set(type,materials[type].clone());return pool.get(type);}
const unitBox=new THREE.BoxGeometry(1,1,1),roundCache=new Map();
function box(g,x,y,z,w,h,d,type='panel',rounded=false){let geo=unitBox;if(rounded){const k=[w,h,d].join(',');if(!roundCache.has(k))roundCache.set(k,new RoundedBoxGeometry(w,h,d,1,Math.min(.035,h/4,w/4,d/4)));geo=roundCache.get(k);}const mesh=new THREE.Mesh(geo,mat(g,type));mesh.position.set(x,y,z);if(!rounded)mesh.scale.set(w,h,d);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;}
function cylinder(g,x,y,z,r,h,type='steel',segments=12){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat(g,type));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
// Perforations are instanced dark insets, not hundreds of separate draw calls.
function perforate(g,x,y,z,w,d,nx=12,nz=10){if(mobile){nx=Math.ceil(nx*.65);nz=Math.ceil(nz*.65);}const mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(.022,.022,.003,6),mat(g,'dark'),nx*nz);const m=new THREE.Matrix4();let n=0;for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){m.makeTranslation(x+(i/(nx-1)-.5)*w,y,z+(j/(nz-1)-.5)*d);mesh.setMatrixAt(n++,m);}g.add(mesh);}
// 6 × 5 modular flooring on independently visible pedestals and stringers.
for(let i=0;i<=6;i++)for(let j=0;j<=5;j++){
 const x=-3+i,z=-2.5+j;cylinder(floor,x,.16,z,.035,.32);box(floor,x,.015,z,.19,.03,.19,'edge');box(floor,x,.33,z,.14,.04,.14,'steel');}
for(let i=0;i<=6;i++)box(floor,-3+i,.35,0,.055,.10,5.1,'edge');
for(let j=0;j<=5;j++)box(floor,0,.35,-2.5+j,6.1,.10,.055,'edge');
for(let i=0;i<6;i++)for(let j=0;j<5;j++){
 const x=-2.5+i,z=-2+j;box(floor,x,.44,z,.982,.12,.982,'floor',true);
 if((i===0||i===5)&&j%2===0)perforate(floor,x,.502,z,.77,.77,13,13);
}
// Wall group local bottom = 0; in the assembled state it lands exactly on floor top 0.50.
const wallH=2.30, wallT=.12;
function panelX(x,z,windowed=false){if(!windowed){box(walls,x,wallH/2,z,.99,wallH,wallT,'panel',true);return;}
box(walls,x,.36,z,.99,.72,wallT,'panel');box(walls,x,2.025,z,.99,.55,wallT,'panel');box(walls,x-.415,1.235,z,.16,1.03,wallT,'panel');box(walls,x+.415,1.235,z,.16,1.03,wallT,'panel');box(walls,x,1.235,z,.70,1.05,.09,'edge');box(walls,x,1.235,z+.049,.60,.94,.013,'glass');box(walls,x,1.235,z-.049,.60,.94,.013,'glass');}
for(let i=0;i<6;i++){panelX(-2.5+i,-2.5,false);if(i!==4)panelX(-2.5+i,2.5,i===1);}
for(let i=0;i<5;i++){
 const z=-2+i;box(walls,-3,wallH/2,z,wallT,wallH,.99,'panel',true);
 if(i!==2)box(walls,3,wallH/2,z,wallT,wallH,.99,'panel',true);
 else{box(walls,3,.36,z,wallT,.72,.99,'panel');box(walls,3,2.025,z,wallT,.55,.99,'panel');box(walls,3,1.235,z-.415,wallT,1.03,.16,'panel');box(walls,3,1.235,z+.415,wallT,1.03,.16,'panel');box(walls,3,1.235,z,.13,1.05,.70,'edge');box(walls,3.07,1.235,z,.014,.94,.60,'glass');}}
// Flush door, vision panel, frame, stainless lever and hinges.
box(walls,1.5,1.12,2.51,1.02,2.24,.14,'edge');box(walls,1.5,1.11,2.59,.91,2.17,.075,'white',true);
box(walls,1.5,1.42,2.64,.47,.73,.025,'edge');box(walls,1.5,1.42,2.659,.40,.66,.012,'glass');box(walls,1.18,.97,2.65,.05,.22,.035,'steel',true);box(walls,1.26,1.02,2.7,.19,.032,.04,'steel',true);
for(const y of [.35,1.10,1.85])box(walls,1.94,y,2.65,.025,.12,.038,'steel');box(walls,1.5,2.27,2.65,.85,.025,.026,'led');
for(const z of [-2.5,2.5]){box(walls,0,.065,z,6.1,.13,.17,'steel');box(walls,0,2.28,z,6.1,.05,.16,'edge');}
for(const x of [-3,3]){box(walls,x,.065,0,.17,.13,5,'steel');box(walls,x,2.28,0,.16,.05,5,'edge');}
// Low return-air grilles on rear internal surfaces.
for(const x of [-1.5,1.5]){box(walls,x,.38,-2.42,.72,.32,.04,'edge');for(let j=0;j<8;j++)box(walls,x,.25+j*.036,-2.39,.64,.013,.016,'dark');}
// Ceiling grid and tiles; local plane y=0 docks at wall top 2.8.
for(let i=0;i<=6;i++){box(ceiling,-3+i,0,0,.065,.095,5.1,'steel');box(ceiling,-3+i,-.05,0,.09,.018,5.1,'white');}
for(let j=0;j<=5;j++){box(ceiling,0,0,-2.5+j,6.1,.095,.065,'steel');box(ceiling,0,-.05,-2.5+j,6.1,.018,.09,'white');}
for(let i=0;i<6;i++)for(let j=0;j<5;j++){
 const x=-2.5+i,z=-2+j,isFilter=(i===1||i===4)&&(j===1||j===3),isLight=(i===2||i===5)&&j===2;
 box(ceiling,x,-.012,z,.92,.06,.92,isLight?'led':'white');
 if(isFilter){box(ceiling,x,.08,z,.84,.15,.84,'steel',true);box(ceiling,x,.16,z,.73,.012,.73,'panel');perforate(ceiling,x,.17,z,.64,.64,15,15);}
}
for(const x of [-2.9,2.9])for(const z of [-2.4,0,2.4]){cylinder(ceiling,x,.50,z,.015,1.0);cylinder(ceiling,x,.05,z,.06,.06);}
// HVAC ring: joined stainless rectangular ducts, flanges and vertical terminal drops.
for(const x of [-2.25,2.25]){box(hvac,x,.44,0,.65,.62,4.4,'steel',true);for(let j=0;j<6;j++)box(hvac,x,.44,-2.15+j*.86,.69,.67,.027,'edge');}
for(const z of [-1.9,1.9]){box(hvac,0,.44,z,4.5,.62,.65,'steel',true);for(let j=0;j<6;j++)box(hvac,-2.2+j*.88,.44,z,.025,.67,.69,'edge');}
for(const x of [-2.25,2.25])for(const z of [-1.9,1.9]){box(hvac,x,.12,z,.66,.65,.66,'steel',true);box(hvac,x,-.21,z,.77,.04,.77,'edge');box(hvac,x,.78,z,.71,.045,.71,'edge');}
// Two compact air handling modules with visible access seams, grilles, and fan guards.
for(const x of [-.87,.87]){
 box(hvac,x,.45,0,1.35,.90,1.52,'steel',true);box(hvac,x,.02,0,1.45,.12,1.63,'edge');
 box(hvac,x,.48,.773,1.14,.65,.025,'dark');for(let i=0;i<13;i++)box(hvac,x,.20+i*.042,.80,1.08,.018,.024,'edge');
 const fan=cylinder(hvac,x,.915,0,.46,.024,'dark',mobile?24:48);
 cylinder(hvac,x,.949,0,.078,.037,'steel');
 for(let i=0;i<8;i++){const a=i*Math.PI/4,b=box(hvac,x+Math.sin(a)*.22,.937,Math.cos(a)*.22,.11,.015,.36,'edge',true);b.rotation.y=a;}
 for(const r of [.22,.34,.46]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.008,6,mobile?24:48),mat(hvac,'steel'));ring.rotation.x=Math.PI/2;ring.position.set(x,.964,0);hvac.add(ring);}
 for(let i=0;i<8;i++){const a=i*Math.PI/4,b=box(hvac,x,.967,0,.009,.012,.91,'steel');b.rotation.y=a;}
 box(hvac,x-.40,.58,.832,.11,.025,.015,'led');box(hvac,x+.48,.42,.82,.025,.14,.025,'steel');
}
// Batch geometry by material INSIDE each system; all four named groups remain independent.
for(const group of groups){const buckets=new Map();for(const obj of [...group.children]){if(!obj.isMesh||obj.isInstancedMesh)continue;obj.updateMatrix();const geometry=(obj.geometry.index?obj.geometry.toNonIndexed():obj.geometry.clone()).applyMatrix4(obj.matrix);if(!buckets.has(obj.material))buckets.set(obj.material,[]);buckets.get(obj.material).push(geometry);group.remove(obj);}for(const [material,geometries] of buckets){const geometry=mergeGeometries(geometries,false);const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);geometries.forEach(g=>g.dispose());}}
// Floor-plane contact shadow plus soft ambient shadow (procedural texture, no external asset).
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=128;shadowCanvas.height=128;const ctx=shadowCanvas.getContext('2d');const gr=ctx.createRadialGradient(64,64,7,64,64,62);gr.addColorStop(0,'rgba(35,66,86,.28)');gr.addColorStop(1,'rgba(35,66,86,0)');ctx.fillStyle=gr;ctx.fillRect(0,0,128,128);
const blob=new THREE.Mesh(new THREE.PlaneGeometry(12,10),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));blob.rotation.x=-Math.PI/2;blob.position.y=-.63;scene.add(blob);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:.11}));ground.rotation.x=-Math.PI/2;ground.position.y=-.62;ground.receiveShadow=true;scene.add(ground);
if(software){scene.traverse(o=>{if(o.isLight)o.intensity*=.22;});scene.remove(ground,blob);const converted=new Map();scene.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh){const m=o.material;if(!converted.has(m)){const n=new THREE.MeshPhongMaterial({color:m.color,shininess:45,transparent:m.transparent,opacity:m.opacity,side:m.side,emissive:m.emissive});converted.set(m,n);}o.material=converted.get(m);}if(o.isInstancedMesh)o.visible=false;});pools.forEach(pool=>pool.forEach((m,k)=>{if(converted.has(m))pool.set(k,converted.get(m));}));}
const assembly={hvac:7.35,ceiling:5.15,walls:1.15,floor:-.55,camera:0,final:0};
let progress=0,queued=false;
const buttons=[...document.querySelectorAll('.system-nav button')],labels=[0,1,2,3].map(i=>$('#label'+i));
const anchors=[new THREE.Vector3(2.5,.4,1.9),new THREE.Vector3(-2.8,0,2.4),new THREE.Vector3(-2.7,1.2,2.5),new THREE.Vector3(2.8,.43,2.4)];
function requestRender(){if(!queued){queued=true;requestAnimationFrame(render);}}
function render(){queued=false;
 hvac.position.y=assembly.hvac;ceiling.position.y=assembly.ceiling;walls.position.y=assembly.walls;floor.position.y=assembly.floor;
 const t=assembly.camera;mobile=innerWidth<600;
 const target=new THREE.Vector3(mobile?.35:-1.65-t*.35,mobile?4.5-t*1.5:3.8-t*1.65,0);
 const dir=new THREE.Vector3(1-t*.10,.64-t*.18,1.30).normalize();const distance=mobile?35-t*4:27-t*4;
 camera.fov=mobile?36:32;camera.aspect=innerWidth/innerHeight;camera.position.copy(target).addScaledVector(dir,distance);camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const active=Math.min(3,Math.floor(progress*4));
 for(let i=0;i<4;i++){
  const intensity=(i===active ? .065 : .004)*(1-assembly.final);
  pools[i].forEach((m,type)=>{if(type!=='led'){m.emissive?.setHex(0x379dd1);if(software)m.emissive.multiplyScalar(intensity);m.emissiveIntensity=intensity;}});
  labels[i].classList.toggle('active',i===active);buttons[i].setAttribute('aria-current',i===active?'step':'false');
 }
 const fade=1-clamp((progress-.45)/.36,0,1)*.92;
 $('#leaders').style.opacity=fade*(1-assembly.final);$('.annotations').style.opacity=fade*(1-assembly.final);
 $('.intro').style.opacity=1-clamp((progress-.72)/.16,0,1);$('.final').style.opacity=assembly.final;$('.final').style.visibility=assembly.final>0?'visible':'hidden';$('.final').setAttribute('aria-hidden',assembly.final<.5?'true':'false');
 // Project labels into screen space; endpoints follow actual component positions.
 scene.updateMatrixWorld(true);
 const w=innerWidth,h=document.querySelector(".stage").clientHeight;
 for(let i=0;i<4;i++){
  const p=groups[i].localToWorld(anchors[i].clone()).project(camera),ax=(p.x*.5+.5)*w,ay=(-p.y*.5+.5)*h;
  let lx,ly,left;
  if(mobile){left=i%2===0;lx=left?w*.06:w*.54;ly=h- (i<2?220:140);}
  else{left=i===1||i===2;lx=left?w*.04:w*.745;ly=left?Math.max(document.querySelector(".intro").offsetTop+document.querySelector(".intro").offsetHeight+40,h*.52)+(i===2?120:0):(i===0?Math.max(180,h*.28):h-160);}
  labels[i].style.transform=`translate(${lx}px,${ly}px)`;
  const lw=labels[i].offsetWidth,endX=left?lx+lw+12:lx-12,endY=ly+11;
  $('#line'+i).setAttribute('d',`M ${ax} ${ay} L ${endX+(left?22:-22)} ${endY} L ${endX} ${endY}`);$('#dot'+i).setAttribute('cx',ax);$('#dot'+i).setAttribute('cy',ay);
 }
 $('#nav-progress').style.transform=`scaleY(${progress})`;$('#percent').textContent=String(Math.round(progress*100)).padStart(3,'0')+'%';
 $('#phase').textContent=progress<.20?'EXPLODED VIEW':progress>=.999?'ASSEMBLY COMPLETE':'SYSTEMS CONVERGING';$('#cue-text').textContent=progress>.97?'SCROLL UP TO EXPLORE':'SCROLL TO ASSEMBLE';
 // Readable DOM diagnostics also support QA of scroll position versus physical group positions.
 const canvas=renderer.domElement;canvas.dataset.renderer=software?'svg-compatibility':'webgl';canvas.dataset.progress=progress.toFixed(5);canvas.dataset.positions=groups.map(g=>g.position.y.toFixed(4)).join(',');canvas.dataset.active=names[active];
 renderer.render(scene,camera);
}
const timeline=gsap.timeline({paused:true});
timeline.to(assembly,{hvac:5.50,ceiling:4.15,walls:.90,floor:-.30,duration:.25,ease:'sine.inOut'},.20)
.to(assembly,{hvac:3.75,ceiling:3.25,walls:.58,floor:-.08,duration:.25,ease:'sine.inOut'},.45)
.to(assembly,{hvac:3.12,ceiling:2.85,walls:.51,floor:-.01,duration:.20,ease:'sine.inOut'},.70)
.to(assembly,{hvac:3.05,ceiling:2.80,walls:.50,floor:0,duration:.075,ease:'sine.out'},.90)
.to(assembly,{camera:1,duration:.30,ease:'sine.inOut'},.70)
.to(assembly,{final:1,duration:.025,ease:'none'},.975);
ScrollTrigger.create({trigger:'#experience',start:'top top',end:'bottom bottom',scrub:true,animation:timeline,onUpdate:self=>{progress=self.progress;requestRender();},onRefresh:self=>{progress=self.progress;requestRender();}});
buttons.forEach(b=>b.addEventListener('click',()=>{window.scrollTo({top:Number(b.dataset.progress)*($('#experience').offsetHeight-innerHeight),behavior:'instant'});}));
$('#scroll-cue').addEventListener('click',()=>window.scrollTo({top:progress>.97?0:Math.min(1,Math.max(.25,progress+.25))*($('#experience').offsetHeight-innerHeight),behavior:'instant'}));
$('.brand').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:'instant'});});
window.addEventListener('resize',()=>{if(!software)renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<600?1.5:2));renderer.setSize(innerWidth,innerHeight);ScrollTrigger.refresh();requestRender();});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false;});renderer.domElement.addEventListener('webglcontextrestored',()=>{$('#error').hidden=true;requestRender();});
// No autonomous animation loop: draw only on scroll, resize, or font layout change.
document.fonts.ready.then(requestRender);$('#loading').hidden=true;requestRender();
