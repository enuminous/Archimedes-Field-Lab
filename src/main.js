import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

const canvas = document.querySelector('#viewport');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071018);
scene.fog = new THREE.Fog(0x071018, 25, 75);
const camera = new THREE.PerspectiveCamera(68, innerWidth/innerHeight, .05, 150);
camera.position.set(0,1.65,10);
const controls = new PointerLockControls(camera, document.body);
canvas.addEventListener('click',()=>{ if(!state.build) controls.lock(); else placeCurrent(); });

scene.add(new THREE.HemisphereLight(0xbbeeff,0x223344,1.4));
const sun = new THREE.DirectionalLight(0xffffff,2.5); sun.position.set(8,14,5); sun.castShadow=true; scene.add(sun);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshStandardMaterial({color:0x182630,roughness:.7,metalness:.18}));
floor.rotation.x=-Math.PI/2; floor.receiveShadow=true; scene.add(floor);
const grid = new THREE.GridHelper(40,80,0x2d6e7c,0x163943); grid.position.y=.002; scene.add(grid);

function box(x,y,z,sx,sy,sz,c=0x28434f){const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),new THREE.MeshStandardMaterial({color:c,roughness:.55,metalness:.25}));m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;scene.add(m);return m}
// Lab walls / benches
box(0,2,-11,22,4,.25,0x1b2b34); box(-11,2,0,.25,4,22,0x1b2b34); box(11,2,0,.25,4,22,0x1b2b34);
box(-3,.75,-2,6,1.5,2,0x263b44); box(4,.75,-3,5,1.5,2,0x263b44); box(2,.75,4,7,1.5,2,0x263b44);

const world = {objects:[], time:0, paused:false};
const state = {build:false, kind:'crate', ghost:null, selected:null, measure:false, activeTab:'classical'};
const keys = new Set(); addEventListener('keydown',e=>{keys.add(e.code); if(e.code==='KeyB')toggleBuild(); if(e.code==='KeyR')rotateCurrent(); if(e.code==='KeyX')deleteSelected(); if(e.code==='KeyM')measure(); if(e.code==='Space'){e.preventDefault();togglePause();}}); addEventListener('keyup',e=>keys.delete(e.code));

function material(color, emissive=0){return new THREE.MeshStandardMaterial({color,roughness:.4,metalness:.45,emissive,emissiveIntensity:1.3});}
function createComponent(kind,ghost=false){
  const g=new THREE.Group(); const alpha=ghost?.38:1;
  const mat=(c,e=0)=>{const m=material(c,e); if(ghost){m.transparent=true;m.opacity=alpha;m.depthWrite=false;} return m;};
  if(kind==='crate') g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat(0x4a6b76)));
  if(kind==='pendulum'){
    const frame=new THREE.Mesh(new THREE.BoxGeometry(1.5,.08,.08),mat(0x6d8790));frame.position.y=1.5;g.add(frame);
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.3,12),mat(0xbac8cc));rod.position.y=.84;g.add(rod);
    const bob=new THREE.Mesh(new THREE.SphereGeometry(.18,20,12),mat(0xb5c7cf));bob.position.y=.2;g.add(bob); g.userData.physics='pendulum';
  }
  if(kind==='mirror'){
    const stand=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,.7,12),mat(0x354d59));stand.position.y=.35;g.add(stand);
    const disk=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.05,30),mat(0x9fd7e5));disk.rotation.x=Math.PI/2;disk.position.y=.8;g.add(disk);g.userData.optic='mirror';
  }
  if(kind==='beaker'){
    const vessel=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.7,24,1,true),mat(0x7ebfd0));vessel.position.y=.35;g.add(vessel);
    const liquid=new THREE.Mesh(new THREE.CylinderGeometry(.25,.31,.38,24),mat(0xff8a3d,0x612000));liquid.position.y=.2;g.add(liquid);g.userData.chem={temperature:293.15,pressure:101.3,species:'demo solution'};
  }
  if(kind==='wave'){
    const plate=new THREE.Mesh(new THREE.BoxGeometry(1.5,.08,1.5),mat(0x315c69));plate.position.y=.05;g.add(plate);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.45,.035,10,48),mat(0x5de0ff,0x0a4f68));ring.rotation.x=Math.PI/2;ring.position.y=.11;g.add(ring);g.userData.wave={frequency:1.8,amplitude:.12};
  }
  if(kind==='coil'){
    const tor=new THREE.Mesh(new THREE.TorusGeometry(.45,.08,14,48),mat(0xc8753b,0x552000));tor.rotation.y=Math.PI/2;tor.position.y=.55;g.add(tor);g.userData.electrical={current:1.2,voltage:5};
  }
  if(kind==='qubit'){
    const sph=new THREE.Mesh(new THREE.SphereGeometry(.42,24,16),new THREE.MeshPhysicalMaterial({color:0x7755ff,transmission:.3,transparent:true,opacity:ghost?.28:.6,emissive:0x2a0a55,emissiveIntensity:1.2}));sph.position.y=.55;g.add(sph);g.userData.quantum={p0:.5,p1:.5,phase:0};
  }
  if(kind==='efmw'){
    const core=new THREE.Mesh(new THREE.IcosahedronGeometry(.34,1),mat(0x42e6c6,0x0a665a));core.position.y=.55;g.add(core);
    const ring1=new THREE.Mesh(new THREE.TorusGeometry(.7,.025,12,64),mat(0x785cff,0x261c66));ring1.position.y=.55;ring1.rotation.x=Math.PI/2;g.add(ring1);
    const ring2=ring1.clone();ring2.rotation.y=Math.PI/2;g.add(ring2);g.userData.efmw={phi:0,laplacian:0,energy:1,pressure:.1};
  }
  g.userData.kind=kind; g.userData.ghost=ghost; return g;
}

function seedLab(){
  [['pendulum',-5,0,-3],['mirror',-2,0,1],['mirror',0,0,1],['beaker',4,0,-2],['wave',3,0,3],['coil',7,0,-4],['qubit',6,0,2],['efmw',0,0,-6]].forEach(([k,x,y,z])=>{const o=createComponent(k);o.position.set(x,y,z);scene.add(o);world.objects.push(o);});
  // laser beam visualization
  const beamMat=new THREE.LineBasicMaterial({color:0xff3344}); const pts=[new THREE.Vector3(-7,.8,1),new THREE.Vector3(1,.8,1)]; const geo=new THREE.BufferGeometry().setFromPoints(pts); scene.add(new THREE.Line(geo,beamMat));
}
seedLab();

const raycaster=new THREE.Raycaster();
function pointerGround(){raycaster.setFromCamera(new THREE.Vector2(0,0),camera); const hits=raycaster.intersectObject(floor); return hits[0]?.point ?? camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(3));}
function updateGhost(){if(!state.build)return; if(!state.ghost){state.ghost=createComponent(state.kind,true);scene.add(state.ghost)} const p=pointerGround(); state.ghost.position.set(Math.round(p.x*2)/2,0,Math.round(p.z*2)/2);}
function setKind(k){state.kind=k;if(state.ghost){scene.remove(state.ghost);state.ghost=null;}document.querySelectorAll('.palette button').forEach(b=>b.classList.toggle('active',b.dataset.kind===k));toast(`Build: ${k}`)}
function placeCurrent(){ if(!state.build)return; const o=createComponent(state.kind);o.position.copy(state.ghost.position);o.rotation.copy(state.ghost.rotation);scene.add(o);world.objects.push(o);state.selected=o;toast(`${state.kind} placed`);}
function toggleBuild(){state.build=!state.build; if(state.build){controls.unlock();document.querySelector('#modeBadge').textContent='BUILD';}else{if(state.ghost){scene.remove(state.ghost);state.ghost=null;}document.querySelector('#modeBadge').textContent='EXPLORE';} }
function rotateCurrent(){const t=state.build?state.ghost:state.selected;if(t)t.rotation.y+=Math.PI/12;}
function deleteSelected(){if(state.selected){scene.remove(state.selected);world.objects=world.objects.filter(x=>x!==state.selected);state.selected=null;toast('Deleted');}}
function togglePause(){world.paused=!world.paused;document.querySelector('#simBadge').textContent=world.paused?'SIM PAUSED':'SIM RUNNING';}
function measure(){state.measure=!state.measure;toast(state.measure?'Measurement mode on':'Measurement mode off');}
function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._id);t._id=setTimeout(()=>t.classList.remove('show'),1200)}

document.querySelectorAll('.palette button').forEach(b=>b.addEventListener('click',()=>setKind(b.dataset.kind)));
document.querySelector('#buildBtn').onclick=toggleBuild; document.querySelector('#rotateBtn').onclick=rotateCurrent; document.querySelector('#measureBtn').onclick=measure; document.querySelector('#pauseBtn').onclick=togglePause; document.querySelector('#resetBtn').onclick=()=>location.reload();
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{state.activeTab=b.dataset.tab;document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===b));renderPanel();}));

function renderPanel(){const p=document.querySelector('#panel'); const t=world.time;
  const tabs={
    classical:`<h3>CLASSICAL FIELD STATE</h3><div class="metric"><span>Gravity</span><b>9.81 m/s²</b></div><div class="metric"><span>Lab Temp</span><b>293.15 K</b></div><div class="metric"><span>Objects</span><b>${world.objects.length}</b></div><div class="spark"></div><small>Rigid-body / wave / optical approximations.</small>`,
    quantum:`<h3>QUANTUM SUBSYSTEM</h3><div class="metric"><span>|ψ|² normalization</span><b>1.000</b></div><div class="metric"><span>Demo qubit</span><b>0.5 / 0.5</b></div><div class="meter"><i style="width:50%"></i></div><p>Localized quantum demo state only; not a universal wavefunction simulation.</p>`,
    gravity:`<h3>GRAVITY</h3><div class="metric"><span>Model</span><b>Newtonian local</b></div><div class="metric"><span>Potential</span><b>${(-9.81*camera.position.y).toFixed(2)} J/kg</b></div><p>Relativistic and quantum-gravity solvers are planned modules, not claimed implemented here.</p>`,
    efmw:`<h3>EFMW EXPERIMENTAL FIELD</h3><div class="metric"><span>φ sample</span><b>${(Math.sin(t*.8)*.64).toFixed(3)}</b></div><div class="metric"><span>∇²φ sample</span><b>${(-Math.sin(t*.8)*.41).toFixed(3)}</b></div><div class="spark"></div><p>Explicit hypothesis layer. Current prototype uses a bounded demonstrator field until canonical units/couplings are frozen.</p>`
  }; p.innerHTML=tabs[state.activeTab];
}
renderPanel();

let prev=performance.now();
function animate(now){requestAnimationFrame(animate); const dt=Math.min((now-prev)/1000,.05);prev=now;
  if(!world.paused){world.time+=dt; for(const o of world.objects){
    if(o.userData.physics==='pendulum'){const a=Math.sin(world.time*2.2)*.38;o.rotation.z=a;}
    if(o.userData.wave){o.children[1].scale.setScalar(1+0.25*Math.sin(world.time*o.userData.wave.frequency*6.283));}
    if(o.userData.quantum){o.rotation.y+=dt*.6;}
    if(o.userData.efmw){o.rotation.y+=dt*.45;o.children.slice(1).forEach((r,i)=>r.rotation.z+=dt*(i?-.7:.9));}
  }}
  if(controls.isLocked){const speed=4.2*dt;if(keys.has('KeyW'))controls.moveForward(speed);if(keys.has('KeyS'))controls.moveForward(-speed);if(keys.has('KeyA'))controls.moveRight(-speed);if(keys.has('KeyD'))controls.moveRight(speed);camera.position.y=1.65;}
  updateGhost(); if(Math.floor(world.time*4)%4===0)renderPanel();
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)} addEventListener('resize',resize);resize();
