(() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let motionPaused = reduceMotion.matches;
  const toggle = document.querySelector('.motion-toggle');
  let frame = 0, pointerX = 0, pointerY = 0;
  const clamp = v => Math.min(1, Math.max(0, v));
  const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const story = document.querySelector('.hero-story');
  const stage = document.querySelector('.hero-stage');
  const intro = document.querySelector('.hero-intro');
  const outro = document.querySelector('.hero-outro');
  const art = document.querySelector('.art-stage');
  const panel = document.querySelector('.pink-panel');
  const bottom = document.querySelector('.hero-bottom');
  const counter = document.querySelector('#scene-number');
  const progressBar = document.querySelector('.scroll-progress');

  function updateStory() {
    frame = 0;
    const mobile = innerWidth < 760;
    const range = Math.max(1, story.offsetHeight - stage.offsetHeight);
    const progress = reduceMotion.matches ? 0 : clamp(-story.getBoundingClientRect().top / range);
    document.documentElement.classList.toggle('page-on-paper', story.getBoundingClientRect().bottom < innerHeight*.6);
    const phase = motionPaused ? 0 : smooth((progress-.16)/.67);
    const introFade = motionPaused ? 1 : 1-smooth((progress-.07)/.34);
    const outroFade = motionPaused ? 0 : smooth((progress-.53)/.26);
    panel.style.transform = `translateY(${(1-phase)*102}%)`;
    intro.style.opacity = introFade;
    intro.style.transform = `translateY(${-phase*100}px)`;
    intro.style.visibility = introFade < .01 ? 'hidden' : 'visible';
    outro.style.opacity = outroFade;
    outro.style.transform = `translateY(${(1-phase)*65}px)`;
    outro.style.visibility = outroFade < .01 ? 'hidden' : 'visible';
    art.style.transform = `translate3d(calc(${-phase*(mobile ? 5 : 43)}vw + ${motionPaused?0:pointerX}px),${(mobile ? phase*60 : 0)+(motionPaused?0:pointerY)}px,0) rotate(${-phase*26}deg) scale(${1-phase*(mobile?.28:.2)})`;
    bottom.style.color = phase > .6 ? 'var(--deep)' : 'var(--paper)';
    art.querySelector('.art-coordinate').style.color = phase > .6 ? 'var(--deep)' : 'var(--paper)';
    counter.textContent = phase > .5 ? '02' : '01';
    progressBar.style.transform = `scaleX(${progress})`;
    window.dispatchEvent(new CustomEvent('portfolio:progress', {detail:{progress,phase}}));
  }
  function scheduleFrame() { if (!frame) frame = requestAnimationFrame(updateStory); }
  function setMotion(paused) {
    paused = paused || reduceMotion.matches;
    motionPaused = paused;
    document.body.classList.toggle('motion-paused', paused);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.disabled = reduceMotion.matches;
    const label = reduceMotion.matches ? 'Анимация выключена в настройках устройства' : paused ? 'Включить анимацию' : 'Приостановить анимацию';
    toggle.setAttribute('aria-label', label); toggle.title = label;
    toggle.innerHTML = window.portfolioIcon(paused ? 'play' : 'pause');
    window.dispatchEvent(new CustomEvent('portfolio:motion', {detail:{paused}}));
    scheduleFrame();
  }
  toggle.addEventListener('click', () => setMotion(!motionPaused));
  reduceMotion.addEventListener('change', event => setMotion(event.matches));
  stage.addEventListener('pointermove', event => {
    if (motionPaused || event.pointerType !== 'mouse') return;
    pointerX=(event.clientX/innerWidth-.5)*30; pointerY=(event.clientY/innerHeight-.5)*22;
    scheduleFrame();
  });
  stage.addEventListener('pointerleave', () => {pointerX=0;pointerY=0;scheduleFrame();});
  addEventListener('scroll',scheduleFrame,{passive:true}); addEventListener('resize',scheduleFrame);
  setMotion(motionPaused);
})();
