import * as THREE from '../../vendor/three.module.js';

// An original, asset-free sculpture. If WebGL is unavailable the page keeps
// its CSS illustration; the canvas becomes visible only after a real frame.
const canvas = document.querySelector('#event-canvas');
const host = canvas?.closest('.hero-art');
const story = document.querySelector('#event-story');

if (canvas && host) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = new THREE.Vector2();
  const easedPointer = new THREE.Vector2();
  let renderer;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let visible = true;
  let paused = document.body.classList.contains('motion-off');
  let lost = false;
  let failed = false;
  let progress = 0;
  let width = 0;
  let height = 0;

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
  } catch {
    failed = true;
  }

  if (renderer && !failed) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 45);
    const sculpture = new THREE.Group();
    scene.add(sculpture);

    scene.add(new THREE.HemisphereLight(0xecffc3, 0x07392b, 2.6));
    const key = new THREE.DirectionalLight(0xffffe6, 3.8);
    key.position.set(-3.5, 5.5, 5);
    scene.add(key);
    const coolEdge = new THREE.DirectionalLight(0xb6ffed, 2.4);
    coolEdge.position.set(4.5, 0.5, -3);
    scene.add(coolEdge);
    const pinkEdge = new THREE.PointLight(0xffa0c1, 18, 11, 2);
    pinkEdge.position.set(-3, -1.5, 2);
    scene.add(pinkEdge);

    const ball = new THREE.Group();
    sculpture.add(ball);
    const ballRadius = 1.46;
    const green = new THREE.MeshStandardMaterial({
      color: 0xc9f44b,
      roughness: 0.71,
      metalness: 0.04,
    });
    ball.add(new THREE.Mesh(new THREE.SphereGeometry(ballRadius, 64, 40), green));

    // A wavy closed meridian gives the object its own sports-ball language.
    class WaveSeam extends THREE.Curve {
      getPoint(t, target = new THREE.Vector3()) {
        const angle = t * Math.PI * 2;
        const latitude = 0.57 * Math.sin(angle * 2);
        return target.set(
          Math.cos(latitude) * Math.cos(angle),
          Math.sin(latitude),
          Math.cos(latitude) * Math.sin(angle),
        ).multiplyScalar(ballRadius + 0.004);
      }
    }
    const seamPath = new WaveSeam();
    const groove = new THREE.Mesh(
      new THREE.TubeGeometry(seamPath, 144, 0.037, 7, true),
      new THREE.MeshStandardMaterial({ color: 0x718e31, roughness: 0.9 }),
    );
    const seam = new THREE.Mesh(
      new THREE.TubeGeometry(seamPath, 144, 0.026, 7, true),
      new THREE.MeshStandardMaterial({ color: 0xf6ffd2, roughness: 0.93 }),
    );
    seam.scale.setScalar(1.008);
    ball.add(groove, seam);

    const orbit = new THREE.Group();
    orbit.rotation.set(0.98, -0.25, -0.42);
    sculpture.add(orbit);
    const orbitRadius = 2.13;
    const metal = new THREE.MeshStandardMaterial({
      color: 0xd6e4bf,
      roughness: 0.24,
      metalness: 0.62,
    });
    orbit.add(new THREE.Mesh(new THREE.TorusGeometry(orbitRadius, 0.041, 10, 144), metal));

    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaac6,
      roughness: 0.26,
      metalness: 0.16,
    });
    const satellite = new THREE.Mesh(new THREE.SphereGeometry(0.23, 28, 20), accentMaterial);
    orbit.add(satellite);
    const bead = new THREE.Mesh(
      new THREE.SphereGeometry(0.087, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xe7ff9a, roughness: 0.3, metalness: 0.2 }),
    );
    orbit.add(bead);

    const shard = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.17, 0),
      accentMaterial,
    );
    shard.position.set(-1.85, 1.55, 0.1);
    shard.rotation.set(0.3, 0.65, 0.2);
    sculpture.add(shard);

    function animated() {
      return !paused && !reducedMotion.matches && !document.hidden && visible && !lost && !failed;
    }

    function cancelFrame() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }

    function render(time = 0) {
      frame = 0;
      if (lost || failed || !width || !height) return;
      const moving = animated();
      const delta = moving && lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
      lastTime = moving ? time : 0;
      elapsed += delta;

      if (moving) {
        const follow = 1 - Math.exp(-delta * 4);
        easedPointer.lerp(pointer, follow);
      }
      const motion = reducedMotion.matches ? 0 : elapsed;
      const drift = reducedMotion.matches ? 0 : progress;
      ball.rotation.set(0.23 + Math.sin(motion * 0.19) * 0.07, -0.58 + motion * 0.105, 0.29);
      sculpture.rotation.x = -easedPointer.y * 0.08;
      sculpture.rotation.y = easedPointer.x * 0.13;
      sculpture.rotation.z = -0.06 + drift * 0.16;
      sculpture.position.y = Math.sin(motion * 0.62) * 0.065;
      orbit.rotation.z = -0.42 + Math.sin(motion * 0.25) * 0.12;
      const orbitAngle = 0.55 + motion * 0.2;
      satellite.position.set(Math.cos(orbitAngle) * orbitRadius, Math.sin(orbitAngle) * orbitRadius, 0);
      bead.position.set(Math.cos(orbitAngle + 2.45) * orbitRadius, Math.sin(orbitAngle + 2.45) * orbitRadius, 0);
      shard.rotation.y = 0.65 + motion * 0.18;

      try {
        renderer.render(scene, camera);
        document.body.classList.add('scene-ready');
      } catch {
        failed = true;
        document.body.classList.remove('scene-ready');
        return;
      }
      if (moving) frame = window.requestAnimationFrame(render);
    }

    function requestFrame() {
      if (!frame && !lost && !failed && visible && !document.hidden) {
        frame = window.requestAnimationFrame(render);
      }
    }

    function resize() {
      width = host.clientWidth;
      height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      // Keep the complete orbit centered at both wide and portrait ratios.
      camera.position.set(0, 0.04, Math.max(7.05, 2.45 / (Math.tan(halfFov) * camera.aspect)));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      requestFrame();
    }

    function syncMotion() {
      cancelFrame();
      if (reducedMotion.matches) {
        pointer.set(0, 0);
        easedPointer.set(0, 0);
      }
      requestFrame();
    }

    const pointerSurface = story || host;
    pointerSurface.addEventListener('pointermove', (event) => {
      if (!animated() || event.pointerType === 'touch') return;
      const bounds = host.getBoundingClientRect();
      pointer.set(
        THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -1, 1),
        THREE.MathUtils.clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1, -1, 1),
      );
    }, { passive: true });
    pointerSurface.addEventListener('pointerleave', () => pointer.set(0, 0), { passive: true });

    window.addEventListener('scroll', () => {
      if (!story || !animated()) return;
      const raw = Number.parseFloat(window.getComputedStyle(story).getPropertyValue('--progress'));
      if (Number.isFinite(raw)) progress = THREE.MathUtils.clamp(raw, 0, 1);
    }, { passive: true });

    document.addEventListener('orbit:motion', (event) => {
      paused = Boolean(event.detail?.paused);
      syncMotion();
    });
    document.addEventListener('visibilitychange', syncMotion);
    reducedMotion.addEventListener('change', syncMotion);

    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      lost = true;
      cancelFrame();
      document.body.classList.remove('scene-ready');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      lost = false;
      failed = false;
      resize();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        syncMotion();
      }, { rootMargin: '80px' }).observe(host);
    }
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
    else window.addEventListener('resize', resize, { passive: true });

    resize();
  }
}
