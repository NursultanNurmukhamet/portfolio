import * as THREE from './vendor/three.module.js';

// The generated sculpture is a transparent 2D art layer. These orbital objects
// are real WebGL meshes, independently animated in perspective around it.
const canvas = document.querySelector('#orbit-canvas');
const host = document.querySelector('.art-stage');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
} catch {
  canvas.hidden = true;
}
if (renderer) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  camera.position.z = 7.6;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x087c3e, 2.8));
  const key = new THREE.DirectionalLight(0xffffff, 3.5); key.position.set(3, 4, 5); scene.add(key);
  const pinkLight = new THREE.PointLight(0xffb2c9, 6); pinkLight.position.set(-3, 0, 3); scene.add(pinkLight);
  const orbit = new THREE.Group(); scene.add(orbit);
  const ringMaterial = new THREE.MeshBasicMaterial({color:0xd5ff65,transparent:true,opacity:.28});
  const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.67, .005, 6, 140), ringMaterial);
  ringA.rotation.set(.76, .31, .3); orbit.add(ringA);
  const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.91, .004, 6, 140), new THREE.MeshBasicMaterial({color:0xffb2c9,transparent:true,opacity:.3}));
  ringB.rotation.set(-.31, 1.08, -.5); orbit.add(ringB);
  const satelliteGeometry = new THREE.SphereGeometry(.065, 24, 16);
  const satellites = [0xd5ff65,0xffb2c9,0xd8e8e4].map((color,index) => {
    const mesh = new THREE.Mesh(satelliteGeometry, new THREE.MeshStandardMaterial({color,metalness:.6,roughness:.21}));
    if(index===1) mesh.scale.setScalar(1.4);
    orbit.add(mesh); return mesh;
  });
  let paused = reducedMotion.matches || document.body.classList.contains('motion-paused');
  const introBlocking = () => document.documentElement.classList.contains('intro-pending') || document.documentElement.classList.contains('intro-running');
  let introActive = introBlocking();
  let contextLost = false, visible = true, frame = 0, lastTime = 0, elapsed = 0, progress = 0;
  let lastWidth = 0, lastHeight = 0;
  const drawable = () => visible && !document.hidden && !introActive && !contextLost;
  function render(time) {
    frame = 0;
    if (!drawable()) { lastTime = 0; return; }
    if (lastTime && !paused) elapsed += Math.min((time-lastTime)/1000,.05);
    lastTime = time;
    const angle = elapsed*.22;
    orbit.rotation.z = angle*.13 - progress*.5;
    orbit.rotation.y = Math.sin(angle*.6)*.16;
    ringA.rotation.z = angle*.3;
    ringB.rotation.z = -angle*.19;
    satellites.forEach((mesh,index) => {
      const a = angle*(index%2 ? -.8 : 1) + index*2.1;
      mesh.position.set(Math.cos(a)*(1.7+index*.06),Math.sin(a)*1.35,Math.sin(a+index)*.6+.25);
    });
    renderer.render(scene,camera);
    if (!paused) frame = requestAnimationFrame(render);
  }
  // Paused/reduced-motion visits still get one static frame, never a loop.
  function start() { if(!frame && drawable()) {lastTime=0;frame=requestAnimationFrame(render);} }
  function stop() { cancelAnimationFrame(frame); frame=0; lastTime=0; }
  function resize() {
    const width=host.clientWidth,height=host.clientHeight;
    if(!width || !height) return;
    if(width!==lastWidth || height!==lastHeight) {
      lastWidth=width;lastHeight=height;
      renderer.setSize(width,height,false); camera.aspect=width/height; camera.updateProjectionMatrix();
    }
    start();
  }
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries => {
    visible=entries[0].isIntersecting;
    if(visible) start(); else stop();
  },{threshold:0}).observe(document.querySelector('.hero-story'));
  addEventListener('portfolio:motion', event => {paused=event.detail.paused; stop(); start();});
  addEventListener('portfolio:intro', event => {introActive=Boolean(event.detail.active);if(introActive)stop();else start();});
  // The head watchdog can reveal the page even if the loader script fails.
  new MutationObserver(() => {
    const active=introBlocking();
    if(active===introActive)return;
    introActive=active;if(active)stop();else start();
  }).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
  addEventListener('portfolio:progress', event => {
    if(progress===event.detail.phase)return;
    progress=event.detail.phase;start();
  });
  document.addEventListener('visibilitychange', () => {if(document.hidden)stop();else if(visible)start();});
  canvas.addEventListener('webglcontextlost', event => {event.preventDefault();contextLost=true;stop();canvas.hidden=true;});
  canvas.addEventListener('webglcontextrestored', () => {contextLost=false;canvas.hidden=false;lastWidth=lastHeight=0;resize();});
  resize();
}
