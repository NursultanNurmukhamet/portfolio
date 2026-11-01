import * as THREE from './vendor/three.module.js';

// A small 3D illustration of a server cluster for the hero monitor: three racks
// with status lights, links between them and data packets travelling along the
// links. Visitors can rotate it by dragging. It stays a decorative layer.
const canvas = document.querySelector('#orbit-canvas');
const host = document.querySelector('.mon-map');
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
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  camera.position.set(0, 2.4, 7.4);
  camera.lookAt?.(0, .2, 0);
  scene.add(new THREE.HemisphereLight(0xcfe3ff, 0x0a0d12, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(4, 6, 5); scene.add(key);
  const glow = new THREE.PointLight(0xd5ff65, 5, 12); glow.position.set(0, 1.8, 2.2); scene.add(glow);

  const cluster = new THREE.Group(); scene.add(cluster);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x1a2230, metalness: .55, roughness: .38 });
  const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x2a3444, metalness: .4, roughness: .45 });
  const ledColors = [0x3ddc84, 0xd5ff65, 0x7cc4ff, 0xffb2c9];
  const ledMaterials = ledColors.map(color => new THREE.MeshBasicMaterial({ color }));
  const rackGeometry = new THREE.BoxGeometry(1.25, 2.3, 1.05);
  const bladeGeometry = new THREE.BoxGeometry(1.05, .2, .08);
  const ledGeometry = new THREE.SphereGeometry(.035, 8, 8);
  const floorGeometry = new THREE.TorusGeometry(3.3, .012, 6, 90);
  const packetGeometry = new THREE.SphereGeometry(.07, 12, 12);
  const packetMaterial = new THREE.MeshBasicMaterial({ color: 0xd5ff65 });
  const linkMaterial = new THREE.MeshBasicMaterial({ color: 0x34404f });
  // Packets follow the terminal colour theme chosen before this module loaded.
  if (typeof getComputedStyle === 'function' && packetMaterial.color && packetMaterial.color.set) {
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    if (/^#[0-9a-f]{6}$/i.test(accent)) packetMaterial.color.set(accent);
  }

  const floor = new THREE.Mesh(floorGeometry, linkMaterial);
  floor.rotation.set(Math.PI / 2, 0, 0); floor.position.set(0, -1.2, 0); cluster.add(floor);

  // Racks sit on a shallow arc; each blade has two status lights.
  const rackPositions = [[-2.1, 0, .3], [0, 0, -.35], [2.1, 0, .3]];
  const leds = [], racks = [], rackBodies = [];
  const selectedMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3a2a, metalness: .5, roughness: .35 });
  const offMaterial = new THREE.MeshBasicMaterial({ color: 0x252d38 });
  rackPositions.forEach(([x, y, z], rackIndex) => {
    const rack = new THREE.Group(); rack.position.set(x, y, z); rack.rotation.set(0, -x * .12, 0);
    const body = new THREE.Mesh(rackGeometry, bodyMaterial); body.userData = { rack: rackIndex };
    rack.add(body); racks.push(rack); rackBodies.push(body);
    for (let slot = 0; slot < 8; slot++) {
      const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
      blade.position.set(0, .9 - slot * .26, .53); rack.add(blade);
      for (let side = 0; side < 2; side++) {
        const material = ledMaterials[(slot + rackIndex + side * 2) % ledMaterials.length];
        const led = new THREE.Mesh(ledGeometry, material);
        led.position.set(.36 + side * .12, .9 - slot * .26, .59);
        led.userData = { phase: rackIndex * 1.7 + slot * .9 + side * 2.3, on: material };
        rack.add(led); leds.push(led);
      }
    }
    cluster.add(rack);
  });

  // Links are thin tori segments approximated by small spheres on a path,
  // which keeps geometry simple and cheap; packets travel along the same paths.
  const routes = [[0, 1], [1, 2], [2, 0]].map(([from, to]) => {
    const a = rackPositions[from], b = rackPositions[to];
    return { a: [a[0], 1.35, a[2]], b: [b[0], 1.35, b[2]] };
  });
  const dotGeometry = new THREE.SphereGeometry(.018, 6, 6);
  routes.forEach(route => {
    for (let step = 1; step < 14; step++) {
      const t = step / 14, dot = new THREE.Mesh(dotGeometry, linkMaterial);
      dot.position.set(route.a[0] + (route.b[0] - route.a[0]) * t, route.a[1] + Math.sin(t * Math.PI) * .45, route.a[2] + (route.b[2] - route.a[2]) * t);
      cluster.add(dot);
    }
  });
  const packets = routes.flatMap((route, index) => [0, .5].map(offset => {
    const mesh = new THREE.Mesh(packetGeometry, packetMaterial); cluster.add(mesh);
    return { mesh, route, offset: offset + index * .17, speed: .18 + index * .04 };
  }));

  let paused = reducedMotion.matches || document.body.classList.contains('motion-paused');
  const introBlocking = () => document.documentElement.classList.contains('intro-pending') || document.documentElement.classList.contains('intro-running');
  let introActive = introBlocking();
  let contextLost = false, visible = true, frame = 0, lastTime = 0, elapsed = 0, progress = 0;
  let lastWidth = 0, lastHeight = 0, dragYaw = 0, dragPitch = 0, dragging = null, selected = -1;
  const drawable = () => visible && !document.hidden && !introActive && !contextLost;
  // Lights come on as the visitor collects finds: 35 % at the start, all at the end.
  // Lit LEDs are shuffled deterministically so they spread over all racks.
  const ledOrder = leds.map((led, index) => ({ led, key: Math.sin(index * 12.9898) * 43758.5453 % 1 })).sort((a, b) => a.key - b.key).map(item => item.led);
  function applyFlags(state) {
    const share = state && state.total ? state.count / state.total : 0;
    const lit = Math.round(ledOrder.length * (.35 + .65 * share));
    ledOrder.forEach((led, index) => { led.material = index < lit ? led.userData.on : offMaterial; });
  }
  applyFlags(globalThis.portfolioFlagState);
  function select(index) {
    selected = index;
    rackBodies.forEach((body, rackIndex) => { body.material = rackIndex === index ? selectedMaterial : bodyMaterial; });
    racks.forEach((rack, rackIndex) => { rack.position.set(rackPositions[rackIndex][0], rackIndex === index ? .12 : 0, rackPositions[rackIndex][2]); });
  }
  function redraw() { if (!frame && drawable()) { place(elapsed); renderer.render(scene, camera); } }
  function place(time) {
    cluster.rotation.set(-.08 + dragPitch, Math.sin(time * .18) * .32 + dragYaw - progress * .4, 0);
    packets.forEach(packet => {
      const t = (time * packet.speed + packet.offset) % 1, { a, b } = packet.route;
      packet.mesh.position.set(a[0] + (b[0] - a[0]) * t, a[1] + Math.sin(t * Math.PI) * .45, a[2] + (b[2] - a[2]) * t);
    });
    leds.forEach(led => { led.scale.setScalar(.75 + .5 * Math.max(0, Math.sin(time * 2.2 + led.userData.phase))); });
  }
  function render(time) {
    frame = 0;
    if (!drawable()) { lastTime = 0; return; }
    if (lastTime && !paused) elapsed += Math.min((time - lastTime) / 1000, .05);
    lastTime = time;
    place(elapsed);
    renderer.render(scene, camera);
    if (!paused) frame = requestAnimationFrame(render);
  }
  // Paused/reduced-motion visits still get one static frame, never a loop.
  function start() { if (!frame && drawable()) { lastTime = 0; frame = requestAnimationFrame(render); } }
  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    if (width !== lastWidth || height !== lastHeight) {
      lastWidth = width; lastHeight = height;
      renderer.setSize(width, height, false); camera.aspect = width / height;
      // Narrow canvases (phones) step the camera back so all three racks fit.
      const distance = camera.aspect < 1.5 ? 7.4 * Math.min(1.6, 1.5 / camera.aspect) : 7.4;
      camera.position.set(0, 2.4 * distance / 7.4, distance); camera.lookAt?.(0, .2, 0);
      camera.updateProjectionMatrix();
    }
    start();
  }
  // Drag to rotate, click a rack to select it; vertical page scrolling on
  // touch screens stays native.
  const raycaster = THREE.Raycaster ? new THREE.Raycaster() : null;
  function pick(event) {
    if (!raycaster || !THREE.Vector2) return -1;
    const box = canvas.getBoundingClientRect();
    const point = new THREE.Vector2(((event.clientX - box.left) / box.width) * 2 - 1, -((event.clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(point, camera);
    const hit = raycaster.intersectObjects(racks, true)[0];
    if (!hit) return -1;
    let node = hit.object;
    while (node && !racks.includes(node)) node = node.parent;
    return racks.indexOf(node);
  }
  canvas.addEventListener('pointerdown', event => { dragging = { x: event.clientX, y: event.clientY, yaw: dragYaw, pitch: dragPitch, moved: false }; canvas.setPointerCapture?.(event.pointerId); });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) { if (event.pointerType === 'mouse') canvas.style.cursor = pick(event) >= 0 ? 'pointer' : 'grab'; return; }
    if (Math.abs(event.clientX - dragging.x) + Math.abs(event.clientY - dragging.y) > 5) dragging.moved = true;
    dragYaw = dragging.yaw + (event.clientX - dragging.x) * .01;
    dragPitch = Math.max(-.35, Math.min(.35, dragging.pitch + (event.clientY - dragging.y) * .004));
    if (paused) { place(elapsed); renderer.render(scene, camera); } else start();
  });
  canvas.addEventListener('pointerup', event => {
    const wasClick = dragging && !dragging.moved; dragging = null;
    if (!wasClick) return;
    const index = pick(event);
    if (index < 0) return;
    select(index); redraw();
    globalThis.dispatchEvent?.(new CustomEvent('portfolio:rack', { detail: { index } }));
  });
  canvas.addEventListener('pointercancel', () => { dragging = null; });
  addEventListener('portfolio:rack-select', event => { select(event.detail.index); redraw(); });
  addEventListener('portfolio:flags', event => { applyFlags(event.detail); redraw(); });
  addEventListener('portfolio:theme', event => {
    const accent = event.detail && event.detail.accent;
    if (/^#[0-9a-f]{6}$/i.test(accent || "") && packetMaterial.color && packetMaterial.color.set) { packetMaterial.color.set(accent); glow.color && glow.color.set && glow.color.set(accent); redraw(); }
  });
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) start(); else stop();
  }, { threshold: 0 }).observe(host);
  addEventListener('portfolio:motion', event => { paused = event.detail.paused; stop(); start(); });
  addEventListener('portfolio:intro', event => { introActive = Boolean(event.detail.active); if (introActive) stop(); else start(); });
  // The head watchdog can reveal the page even if the loader script fails.
  new MutationObserver(() => {
    const active = introBlocking();
    if (active === introActive) return;
    introActive = active; if (active) stop(); else start();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  addEventListener('portfolio:progress', event => {
    if (progress === event.detail.phase) return;
    progress = event.detail.phase; start();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (visible) start(); });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); contextLost = true; stop(); canvas.hidden = true; });
  canvas.addEventListener('webglcontextrestored', () => { contextLost = false; canvas.hidden = false; lastWidth = lastHeight = 0; resize(); });
  resize();
}
