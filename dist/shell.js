(() => {
  'use strict';
  // Shared page shell: reveal-on-scroll, lazy image fade, reading progress.
  // Pure progressive enhancement: with JS off nothing is hidden.
  const root = document.documentElement;
  root.classList.add('js');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function revealAll() {
    for (const node of document.querySelectorAll('[data-reveal],[data-reveal-group]')) node.classList.add('is-revealed');
  }

  function setupReveal() {
    const targets = [...document.querySelectorAll('[data-reveal],[data-reveal-group]')];
    if (!targets.length) return;
    if (reduced.matches || !('IntersectionObserver' in window)) { revealAll(); return; }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    }, {rootMargin: '0px 0px -8% 0px', threshold: 0.08});
    for (const target of targets) {
      // Anything already on screen at load shows at once: no blank first paint.
      const box = target.getBoundingClientRect();
      if (box.top < innerHeight * 0.9 && box.bottom > 0) target.classList.add('is-revealed');
      else observer.observe(target);
    }
    reduced.addEventListener('change', () => { if (reduced.matches) revealAll(); });
  }

  function setupImages() {
    for (const img of document.querySelectorAll('.shell-img img')) {
      const done = () => img.classList.add('is-loaded');
      if (img.complete && img.naturalWidth) done();
      else { img.addEventListener('load', done, {once: true}); img.addEventListener('error', done, {once: true}); }
    }
  }

  function setupProgress() {
    const bar = document.querySelector('.shell-progress');
    if (!bar) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = Math.max(1, root.scrollHeight - innerHeight);
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, scrollY / max))})`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener('scroll', schedule, {passive: true});
    addEventListener('resize', schedule);
    update();
  }

  // A safety net: if a reveal target never intersects (layout quirk, print), show it after a while.
  setTimeout(revealAll, 6000);

  setupReveal();
  setupImages();
  setupProgress();
  window.portfolioShell = Object.freeze({revealAll});
})();
