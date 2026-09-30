import './style.css';
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
const pointer = new THREE.Vector2(0,0);
const centerPointer = new THREE.Vector2(0,0);
const keys = new Set(); addEventListener('keydown',e=>{keys.add(e.code); if(e.code==='KeyB')toggleBuild(); if(e.code==='KeyR')rotateCurrent(); if(e.code==='KeyX')deleteSelected(); if(e.code==='KeyM')measure(); if(e.code==='Space'){e.preventDefault();togglePause();}}); addEventListener('keyup',e=>keys.delete(e.code));

function material(color, emissive=0){return new THREE.MeshStandardMaterial({color,roughness:.4,metalness:.45,emissive,emissiveIntensity:1.3});}
function createComponent(kind,ghost=false){
  const g=new THREE.Group(); const alpha=ghost?.38:1;
  const mat=(c,e=0)=>{const m=material(c,e); if(ghost){m.transparent=true;m.opacity=alpha;m.depthWrite=false;} return m;};
  if(kind==='crate') g.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mat(0x4a6b76)));
  if(kind==='pendulum'){
    const frame=new THREE.Mesh(new THREE.BoxGeometry(1.5,.08,.08),mat(0x6d8790));frame.position.y=1.5;g.add(frame);
    const arm=new THREE.Group();arm.position.y=1.5;
    const rod=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.3,12),mat(0xbac8cc));rod.position.y=-.65;arm.add(rod);
    const bob=new THREE.Mesh(new THREE.SphereGeometry(.18,20,12),mat(0xb5c7cf));bob.position.y=-1.3;arm.add(bob);g.add(arm);
    g.userData.arm=arm;g.userData.physics={type:'pendulum',theta:.38,omega:0,length:1.3,damping:.035};
  }
  if(kind==='mirror'){
    const stand=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,.7,12),mat(0x354d59));stand.position.y=.35;g.add(stand);
    const disk=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.05,30),mat(0x9fd7e5));disk.rotation.x=Math.PI/2;disk.position.y=.8;g.add(disk);g.userData.optic='mirror';
  }
  if(kind==='beaker'){
    const vessel=new THREE.Mesh(new THREE.CylinderGeometry(.28,.34,.7,24,1,true),mat(0x7ebfd0));vessel.position.y=.35;g.add(vessel);
    const liquid=new THREE.Mesh(new THREE.CylinderGeometry(.25,.31,.38,24),mat(0xff8a3d,0x612000));liquid.position.y=.2;g.add(liquid);g.userData.chem={temperature:293.15,pressure:101.3,reactantA:1,productB:0,rateConstant:.018,heatPerExtent:18};
  }
  if(kind==='wave'){
    const plate=new THREE.Mesh(new THREE.BoxGeometry(1.5,.08,1.5),mat(0x315c69));plate.position.y=.05;g.add(plate);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.45,.035,10,48),mat(0x5de0ff,0x0a4f68));ring.rotation.x=Math.PI/2;ring.position.y=.11;g.add(ring);g.userData.wave={frequency:1.8,amplitude:.12};
  }
  if(kind==='coil'){
    const tor=new THREE.Mesh(new THREE.TorusGeometry(.45,.08,14,48),mat(0xc8753b,0x552000));tor.rotation.y=Math.PI/2;tor.position.y=.55;g.add(tor);g.userData.electrical={current:0,voltage:5,resistance:4,inductance:.5,turns:100,length:.4,magneticField:0};
  }
  if(kind==='qubit'){
    const sph=new THREE.Mesh(new THREE.SphereGeometry(.42,24,16),new THREE.MeshPhysicalMaterial({color:0x7755ff,transmission:.3,transparent:true,opacity:ghost?.28:.6,emissive:0x2a0a55,emissiveIntensity:1.2}));sph.position.y=.55;g.add(sph);g.userData.quantum={p0:1,p1:0,phase:0,theta:0,omega:1.35};
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
function pointerGround(){raycaster.setFromCamera(state.build?pointer:centerPointer,camera); const hits=raycaster.intersectObject(floor); return hits[0]?.point ?? camera.position.clone().add(camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(3));}
function rootComponent(obj){let cur=obj;while(cur&&cur.parent&&cur.parent!==scene)cur=cur.parent;return cur?.userData?.kind?cur:null;}
function pickComponent(){raycaster.setFromCamera(state.build?pointer:centerPointer,camera);const hits=raycaster.intersectObjects(world.objects,true);for(const hit of hits){const root=rootComponent(hit.object);if(root)return root;}return null;}
function selectCurrent(){state.selected=pickComponent();updateSelectionReadout();toast(state.selected?state.selected.userData.kind+' selected':'No component under reticle');}
function measurementText(o){if(!o)return 'No component selected';const u=o.userData;const parts=[u.kind.toUpperCase()+' @ ('+o.position.x.toFixed(2)+', '+o.position.y.toFixed(2)+', '+o.position.z.toFixed(2)+') m'];if(u.physics?.type==='pendulum')parts.push('theta '+THREE.MathUtils.radToDeg(u.physics.theta).toFixed(2)+' deg | omega '+u.physics.omega.toFixed(3)+' rad/s');if(u.optic)parts.push('mirror yaw '+THREE.MathUtils.radToDeg(o.rotation.y).toFixed(1)+' deg');if(u.chem)parts.push('T '+u.chem.temperature.toFixed(2)+' K | P '+u.chem.pressure.toFixed(2)+' kPa | A '+u.chem.reactantA.toFixed(3)+' | B '+u.chem.productB.toFixed(3));if(u.wave)parts.push('f '+u.wave.frequency.toFixed(2)+' Hz | amplitude '+u.wave.amplitude.toFixed(3)+' m');if(u.electrical)parts.push('V '+u.electrical.voltage.toFixed(2)+' V | I '+u.electrical.current.toFixed(3)+' A | B '+(u.electrical.magneticField*1e3).toFixed(3)+' mT');if(u.quantum)parts.push('P0 '+u.quantum.p0.toFixed(3)+' | P1 '+u.quantum.p1.toFixed(3)+' | phase '+u.quantum.phase.toFixed(3));if(u.efmw)parts.push('EFMW prototype source | phi '+u.efmw.phi.toFixed(3)+' | laplacian '+u.efmw.laplacian.toFixed(3));return parts.join(' — ');}
function updateSelectionReadout(){const el=document.querySelector('#selection');if(!el)return;el.textContent=state.measure?measurementText(state.selected):(state.selected?state.selected.userData.kind+' selected':'No component selected');}
function updateGhost(){if(!state.build)return; if(!state.ghost){state.ghost=createComponent(state.kind,true);scene.add(state.ghost)} const p=pointerGround(); state.ghost.position.set(Math.round(p.x*2)/2,0,Math.round(p.z*2)/2);}
function setKind(k){state.kind=k;if(state.ghost){scene.remove(state.ghost);state.ghost=null;}document.querySelectorAll('.palette button').forEach(b=>b.classList.toggle('active',b.dataset.kind===k));toast(`Build: ${k}`)}
function placeCurrent(){ if(!state.build||!state.ghost)return; const o=createComponent(state.kind);o.position.copy(state.ghost.position);o.rotation.copy(state.ghost.rotation);scene.add(o);world.objects.push(o);state.selected=o;updateSelectionReadout();toast(state.kind+' placed');}
function toggleBuild(){state.build=!state.build; if(state.build){controls.unlock();document.querySelector('#modeBadge').textContent='BUILD';}else{if(state.ghost){scene.remove(state.ghost);state.ghost=null;}document.querySelector('#modeBadge').textContent='EXPLORE';} }
function rotateCurrent(){const t=state.build?state.ghost:state.selected;if(t)t.rotation.y+=Math.PI/12;}
function deleteSelected(){if(state.selected){scene.remove(state.selected);world.objects=world.objects.filter(x=>x!==state.selected);state.selected=null;updateSelectionReadout();toast('Deleted');}else toast('Nothing selected');}
function togglePause(){world.paused=!world.paused;document.querySelector('#simBadge').textContent=world.paused?'SIM PAUSED':'SIM RUNNING';}
function measure(){state.measure=!state.measure;document.querySelector('#measureBtn').classList.toggle('active',state.measure);updateSelectionReadout();toast(state.measure?'Measurement readout on':'Measurement readout off');}
function toast(msg){const t=document.querySelector('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._id);t._id=setTimeout(()=>t.classList.remove('show'),1200)}

canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;});
canvas.addEventListener('click',()=>{if(state.build){placeCurrent();return;}if(!controls.isLocked){controls.lock();return;}selectCurrent();});
document.querySelectorAll('.palette button').forEach(b=>b.addEventListener('click',()=>setKind(b.dataset.kind)));
document.querySelector('#buildBtn').onclick=toggleBuild; document.querySelector('#rotateBtn').onclick=rotateCurrent; document.querySelector('#measureBtn').onclick=measure; document.querySelector('#pauseBtn').onclick=togglePause; document.querySelector('#resetBtn').onclick=()=>location.reload();
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{state.activeTab=b.dataset.tab;document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('active',x===b));renderPanel();}));

function renderPanel(){const p=document.querySelector('#panel'); const t=world.time; const qObj=(state.selected?.userData.quantum?state.selected:world.objects.find(o=>o.userData.quantum)); const q=qObj?.userData.quantum;
  const tabs={
    classical:`<h3>CLASSICAL FIELD STATE</h3><div class="metric"><span>Gravity</span><b>9.81 m/s²</b></div><div class="metric"><span>Lab Temp</span><b>293.15 K</b></div><div class="metric"><span>Objects</span><b>${world.objects.length}</b></div><div class="spark"></div><small>Rigid-body / wave / optical approximations.</small>`,
    quantum:`<h3>QUANTUM SUBSYSTEM</h3><div class="metric"><span>|ψ|² normalization</span><b>${((q?.p0??1)+(q?.p1??0)).toFixed(3)}</b></div><div class="metric"><span>P(|0⟩) / P(|1⟩)</span><b>${(q?.p0??1).toFixed(3)} / ${(q?.p1??0).toFixed(3)}</b></div><div class="meter"><i style="width:${((q?.p1??0)*100).toFixed(1)}%"></i></div><p>Ideal two-level Rabi evolution; not a universal wavefunction simulation.</p>`,
    gravity:`<h3>GRAVITY</h3><div class="metric"><span>Model</span><b>Newtonian local</b></div><div class="metric"><span>Potential</span><b>${(-9.81*camera.position.y).toFixed(2)} J/kg</b></div><p>Relativistic and quantum-gravity solvers are planned modules, not claimed implemented here.</p>`,
    efmw:`<h3>EFMW EXPERIMENTAL FIELD</h3><div class="metric"><span>φ sample</span><b>${(Math.sin(t*.8)*.64).toFixed(3)}</b></div><div class="metric"><span>∇²φ sample</span><b>${(-Math.sin(t*.8)*.41).toFixed(3)}</b></div><div class="spark"></div><p>Explicit hypothesis layer. Current prototype uses a bounded demonstrator field until canonical units/couplings are frozen.</p>`
  }; p.innerHTML=tabs[state.activeTab];
}
renderPanel();

let prev=performance.now();
function animate(now){requestAnimationFrame(animate); const dt=Math.min((now-prev)/1000,.05);prev=now;
  if(!world.paused){world.time+=dt; for(const o of world.objects){
    if(o.userData.physics?.type==='pendulum'){const p=o.userData.physics;const alpha=-(9.81/p.length)*Math.sin(p.theta)-p.damping*p.omega;p.omega+=alpha*dt;p.theta+=p.omega*dt;o.userData.arm.rotation.z=p.theta;}
    if(o.userData.wave){o.children[1].scale.setScalar(1+0.25*Math.sin(world.time*o.userData.wave.frequency*6.283));}
    if(o.userData.chem){const c=o.userData.chem;const extent=Math.min(c.reactantA,c.rateConstant*c.reactantA*dt);c.reactantA-=extent;c.productB+=extent;c.temperature+=c.heatPerExtent*extent;c.temperature+=(293.15-c.temperature)*.015*dt;c.pressure=101.3*(c.temperature/293.15)*(1+.15*c.productB);}
    if(o.userData.electrical){const e=o.userData.electrical;e.current+=((e.voltage-e.resistance*e.current)/e.inductance)*dt;const mu0=4*Math.PI*1e-7;e.magneticField=mu0*(e.turns/e.length)*e.current;}
    if(o.userData.quantum){const q=o.userData.quantum;q.theta=(q.theta+q.omega*dt)%(2*Math.PI);q.p0=Math.cos(q.theta/2)**2;q.p1=Math.sin(q.theta/2)**2;q.phase=q.theta;o.rotation.y+=dt*.6;}
    if(o.userData.efmw){o.rotation.y+=dt*.45;o.children.slice(1).forEach((r,i)=>r.rotation.z+=dt*(i?-.7:.9));}
  }}
  if(controls.isLocked){const speed=4.2*dt;if(keys.has('KeyW'))controls.moveForward(speed);if(keys.has('KeyS'))controls.moveForward(-speed);if(keys.has('KeyA'))controls.moveRight(-speed);if(keys.has('KeyD'))controls.moveRight(speed);camera.position.y=1.65;}
  updateGhost(); if(state.measure)updateSelectionReadout(); if(Math.floor(world.time*5)!==Math.floor((world.time-dt)*5))renderPanel();
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)} addEventListener('resize',resize);resize();
