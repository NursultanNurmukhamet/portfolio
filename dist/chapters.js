(() => {
  'use strict';

  const QUIET_MS = 240;
  const DURATION_MS = 1080;
  const POSITION_EPSILON = 8;

  function wheelPixels(event, viewportHeight) {
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportHeight : 1;
    return {x: (Number(event.deltaX) || 0) * unit, y: (Number(event.deltaY) || 0) * unit};
  }

  // A gesture stays consumed through its momentum tail. Finishing the animation
  // is not enough to unlock it: a quiet gap must also precede the next gesture.
  function createGestureGate(quiet = QUIET_MS, threshold = 4) {
    let lastAt = -Infinity, amount = 0, consumed = false, busy = false;
    return {
      sample(delta, now) {
        if (now - lastAt > quiet && !busy) { amount = 0; consumed = false; }
        lastAt = now;
        if (busy || consumed) return 0;
        if (amount && Math.sign(amount) !== Math.sign(delta)) amount = 0;
        amount += delta;
        if (Math.abs(amount) < threshold) return 0;
        consumed = true;
        return Math.sign(amount);
      },
      consume() { consumed = true; amount = 0; },
      setBusy(value) { busy = value; if (value) consumed = true; },
      reset() { lastAt = -Infinity; amount = 0; consumed = false; busy = false; },
      state() { return {lastAt, amount, consumed, busy}; }
    };
  }

  function nextFrame(frames, position, direction) {
    if (direction > 0) return frames.find(frame => frame.top > position + POSITION_EPSILON) || null;
    if (direction < 0) return [...frames].reverse().find(frame => frame.top < position - POSITION_EPSILON) || null;
    return null;
  }

  function nativeRegion(layout, position, direction) {
    // Contact copy and the complete form are ordinary document content. Only an
    // upward gesture right at its beginning returns to the preceding scene.
    if (position >= layout.contactTop - POSITION_EPSILON) {
      return direction > 0 || position > layout.contactTop + POSITION_EPSILON;
    }
    if (layout.heroOversized && position < layout.heroBottom - POSITION_EPSILON) return true;
    if (layout.galleryStatic && position >= layout.galleryTop - POSITION_EPSILON && position < layout.galleryBottom) {
      return direction > 0 || position > layout.galleryTop + POSITION_EPSILON;
    }
    return false;
  }

  function swipeDirection(start, end, minimum = 28) {
    const x = end.x - start.x, y = start.y - end.y;
    return Math.abs(y) >= minimum && Math.abs(y) > Math.abs(x) * 1.2 ? Math.sign(y) : 0;
  }

  const core = Object.freeze({wheelPixels, createGestureGate, nextFrame, nativeRegion, swipeDirection});
  window.portfolioChapterCore = core;
  if (typeof document === 'undefined') return;

  const hero = document.querySelector('.hero-story');
  const heroStage = document.querySelector('.hero-stage');
  const gallery = document.querySelector('.diagonal-showcase');
  const galleryStage = document.querySelector('.gallery-stage');
  const contact = document.querySelector('#contact');
  if (!hero || !heroStage || !gallery || !galleryStage || !contact) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const gate = createGestureGate();
  const interactiveSelector = 'a[href],button,input,textarea,select,option,form,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="slider"],[role="spinbutton"],[role="listbox"],audio,video,iframe,[data-native-scroll]';
  let frames = [], layout = {}, animation = null, raf = 0, touch = null, wheelCaptured = false;
  const now = () => window.performance.now();
  const topOf = node => window.scrollY + node.getBoundingClientRect().top;

  function disabled() {
    return reduced.matches || document.body.classList.contains('motion-paused') ||
      document.documentElement.classList.contains('intro-pending') ||
      document.documentElement.classList.contains('intro-running') ||
      Boolean(document.querySelector('dialog[open]'));
  }

  function measure() {
    const heroTop = topOf(hero), galleryTop = topOf(gallery), contactTop = topOf(contact);
    const heroRange = Math.max(0, hero.offsetHeight - heroStage.offsetHeight);
    const galleryRange = Math.max(0, gallery.offsetHeight - galleryStage.offsetHeight);
    const galleryStatic = gallery.classList.contains('gallery-static') || galleryStage.offsetHeight > window.innerHeight + 4;
    layout = {
      heroBottom: heroTop + hero.offsetHeight,
      heroOversized: heroStage.offsetHeight > window.innerHeight + 4,
      galleryTop, galleryBottom: galleryTop + gallery.offsetHeight, galleryStatic, contactTop
    };
    const candidates = [
      {id: 'hero', top: heroTop},
      {id: 'hero-outro', top: heroTop + heroRange * .95},
      {id: 'project-1', top: galleryTop},
      ...(!galleryStatic ? [{id: 'project-2', top: galleryTop + galleryRange * .5}, {id: 'project-3', top: galleryTop + galleryRange}] : []),
      {id: 'contact', top: contactTop}
    ];
    const maximum = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    frames = candidates.map(frame => ({...frame, top: Math.min(maximum, Math.max(0, frame.top))}))
      .filter((frame, index, all) => !index || frame.top - all[index - 1].top > POSITION_EPSILON);
    return frames.map(frame => ({...frame}));
  }

  function cancel(resetGesture = false) {
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    animation = null;
    document.documentElement.classList.remove('chapter-transition');
    gate.setBusy(false);
    if (resetGesture) { gate.reset(); wheelCaptured = false; }
  }

  function tick(time) {
    raf = 0;
    if (!animation) return;
    if (disabled()) { cancel(); return; }
    const progress = Math.min(1, Math.max(0, (time - animation.started) / DURATION_MS));
    const eased = progress * progress * progress * (progress * (progress * 6 - 15) + 10);
    window.scrollTo({top: animation.from + (animation.to - animation.from) * eased, behavior: 'instant'});
    if (progress < 1) raf = window.requestAnimationFrame(tick);
    else {
      const completed = animation.id;
      cancel();
      window.dispatchEvent(new CustomEvent('portfolio:chapter', {detail: {id: completed}}));
    }
  }

  function start(frame) {
    if (!frame || disabled() || animation) return false;
    if (Math.abs(frame.top - window.scrollY) <= POSITION_EPSILON) return false;
    animation = {id: frame.id, from: window.scrollY, to: frame.top, started: now()};
    document.documentElement.classList.add('chapter-transition');
    gate.setBusy(true);
    raf = window.requestAnimationFrame(tick);
    return true;
  }

  function next(direction) {
    if (disabled() || animation) return false;
    measure();
    direction = Math.sign(direction);
    if (!direction || nativeRegion(layout, window.scrollY, direction)) return false;
    return start(nextFrame(frames, window.scrollY, direction));
  }

  function nativeTarget(target) {
    let node = target && (target.nodeType === 1 ? target : target.parentElement);
    if (!node) return false;
    if (node.closest(interactiveSelector)) return true;
    while (node && node !== document.body && node !== document.documentElement) {
      const style = window.getComputedStyle(node);
      if (/(auto|scroll|overlay)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2) return true;
      node = node.parentElement;
    }
    return false;
  }

  function wheel(event) {
    const delta = wheelPixels(event, window.innerHeight);
    const timestamp = now();
    if (timestamp - gate.state().lastAt > QUIET_MS && !animation) wheelCaptured = false;
    const direction = gate.sample(delta.y, timestamp);
    if (event.ctrlKey || event.metaKey || event.shiftKey || !event.cancelable || disabled()) {
      gate.consume();
      wheelCaptured = false;
      if (animation) cancel();
      return;
    }
    // Incoming scenes move under a stationary pointer. A new button or the
    // contact form under it must not break a gesture that we already captured.
    if (animation) { wheelCaptured = true; event.preventDefault(); return; }
    if (wheelCaptured) { event.preventDefault(); return; }
    if (Math.abs(delta.x) > Math.abs(delta.y) || !delta.y || nativeTarget(event.target)) {
      gate.consume();
      return;
    }
    measure();
    if (nativeRegion(layout, window.scrollY, Math.sign(delta.y))) { gate.consume(); return; }
    if (direction && next(direction)) { wheelCaptured = true; event.preventDefault(); return; }
    // Hold consumed momentum at the scene boundary even after the animation
    // ends. Sub-threshold wheel noise remains native rather than feeling stuck.
    if (gate.state().consumed && nextFrame(frames, window.scrollY, Math.sign(delta.y))) event.preventDefault();
  }

  function touchStart(event) {
    if (event.touches.length !== 1 || disabled() || nativeTarget(event.target)) {
      touch = null;
      if (animation) cancel();
      return;
    }
    const point = event.touches[0];
    measure();
    touch = {x: point.clientX, y: point.clientY, id: point.identifier, captured: false, reserved: false, native: false};
  }

  function touchMove(event) {
    if (!touch) return;
    if (event.touches.length !== 1 || disabled()) { touch = null; cancel(); return; }
    const point = event.touches[0];
    if (point.identifier !== touch.id || touch.native || !event.cancelable) return;
    if (touch.captured) { event.preventDefault(); return; }
    const end = {x: point.clientX, y: point.clientY};
    const deltaX = end.x - touch.x, deltaY = touch.y - end.y;
    if (!touch.reserved && Math.abs(deltaY) > Math.abs(deltaX) && deltaY) {
      if (nativeRegion(layout, window.scrollY, Math.sign(deltaY)) || (!animation && !nextFrame(frames, window.scrollY, Math.sign(deltaY)))) {
        touch.native = true;
        return;
      }
      // Claim an eligible vertical gesture before native scrolling gains its
      // momentum. Tiny taps still do not start a transition.
      touch.reserved = true;
    }
    if (touch.reserved) event.preventDefault();
    const direction = swipeDirection(touch, end);
    if (!direction) {
      if (!touch.reserved && Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) touch.native = true;
      return;
    }
    if (nativeRegion(layout, window.scrollY, direction)) { touch.native = true; return; }
    if (animation || next(direction)) { touch.captured = true; event.preventDefault(); }
    else touch.native = true;
  }

  function keydown(event) {
    if (event.key === 'Escape') { cancel(); return; }
    if (event.key === 'Tab' || event.key === 'Home' || event.key === 'End') { cancel(); return; }
    if (event.ctrlKey || event.metaKey || event.altKey || disabled() || nativeTarget(event.target)) return;
    const direction = event.key === 'ArrowDown' || event.key === 'PageDown' || (event.key === ' ' && !event.shiftKey) ? 1 :
      event.key === 'ArrowUp' || event.key === 'PageUp' || (event.key === ' ' && event.shiftKey) ? -1 : 0;
    if (!direction) return;
    measure();
    if (nativeRegion(layout, window.scrollY, direction)) return;
    if (animation || (event.repeat && nextFrame(frames, window.scrollY, direction)) || next(direction)) event.preventDefault();
  }

  // Links, focus changes, browser history, and responsive mode changes always
  // retain their native behavior; this controller never restores scroll itself.
  const reset = () => { cancel(true); touch = null; measure(); };
  document.addEventListener('click', event => {
    if (event.target.closest?.('a[href],button')) reset();
  }, true);
  document.addEventListener('pointerdown', event => { if (nativeTarget(event.target)) cancel(); });
  document.addEventListener('focusin', event => {
    // gallery.js moves focus from an outgoing preview action to pagination.
    // That focus repair is part of the scene change, not a request to stop it.
    if (event.target.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])')) cancel();
  });
  window.addEventListener('wheel', wheel, {passive: false});
  window.addEventListener('touchstart', touchStart, {passive: true});
  window.addEventListener('touchmove', touchMove, {passive: false});
  window.addEventListener('touchend', () => { touch = null; }, {passive: true});
  window.addEventListener('touchcancel', () => { touch = null; cancel(); }, {passive: true});
  window.addEventListener('keydown', keydown);
  for (const name of ['resize', 'orientationchange', 'hashchange', 'popstate', 'pageshow', 'portfolio:motion', 'portfolio:intro']) window.addEventListener(name, reset);
  reduced.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });

  window.portfolioChapters = Object.freeze({
    next,
    goTo(value) {
      measure();
      return start(typeof value === 'number' ? frames[value] : frames.find(frame => frame.id === value));
    },
    cancel: () => cancel(true),
    measure,
    state: () => ({enabled: !disabled(), animating: Boolean(animation), target: animation?.id || null, frames: frames.map(frame => ({...frame}))})
  });
  measure();
})();
