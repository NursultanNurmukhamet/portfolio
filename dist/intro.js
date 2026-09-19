(() => {
  const root=document.documentElement;
  const dialog=document.querySelector('#cinematic-intro');
  if(!dialog)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const quietMotion=()=>reduced.matches||document.body.classList.contains('motion-paused');
  const replay=document.createElement('button');
  replay.type='button';replay.className='intro-replay';replay.textContent='Смотреть вступление';
  document.querySelector('.site-footer').append(replay);
  let releaseTimer=0,closeTimer=0,generation=0,leaving=false;
  const remember=()=>{try{sessionStorage.setItem('portfolio:intro-seen','1');}catch{}};
  function cleanup(){
    clearTimeout(releaseTimer);clearTimeout(closeTimer);clearTimeout(window.portfolioIntroWatchdog);
    generation++;leaving=false;root.classList.remove('intro-pending','intro-running');
    dialog.classList.remove('is-leaving');
    window.dispatchEvent(new CustomEvent('portfolio:intro',{detail:{active:false}}));
  }
  function finish(immediate=false){
    if(!dialog.open)return;
    if(immediate||quietMotion()){remember();dialog.close();cleanup();return;}
    if(leaving)return;
    leaving=true;remember();clearTimeout(releaseTimer);
    // Reveal the already loaded page under the departing title card.
    root.classList.remove('intro-pending');
    dialog.classList.add('is-leaving');
    closeTimer=setTimeout(()=>{dialog.close();cleanup();},680);
  }
  function open(manual=false){
    if(dialog.open)return;
    if(quietMotion()&&!manual){cleanup();return;}
    cleanup();const run=++generation;const started=performance.now();
    dialog.showModal();root.classList.add('intro-running');
    window.dispatchEvent(new CustomEvent('portfolio:intro',{detail:{active:true}}));
    dialog.querySelector('.intro-skip').focus({preventScroll:true});
    // A bounded opening credit, never a blocker on slow assets or a failed font.
    const sculpture=document.querySelector('.hero-sculpture');
    const ready=Promise.allSettled([document.fonts?.ready,sculpture?.decode?.()]);
    if(manual&&quietMotion())return; // Static title card; the close button stays available.
    releaseTimer=setTimeout(()=>finish(),3400);
    ready.then(()=>{
      if(run!==generation||!dialog.open||leaving)return;
      clearTimeout(releaseTimer);
      releaseTimer=setTimeout(()=>finish(),Math.max(0,2500-(performance.now()-started)));
    });
  }
  dialog.querySelector('.intro-skip').addEventListener('click',()=>finish(true));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(true);});
  dialog.addEventListener('close',cleanup);
  replay.addEventListener('click',()=>open(true));
  reduced.addEventListener('change',event=>{if(event.matches)finish(true);});
  addEventListener('portfolio:motion',event=>{if(event.detail.paused)finish(true);});
  addEventListener('pagehide',()=>{if(dialog.open)dialog.close();cleanup();});
  if(root.classList.contains('intro-pending'))open();
})();
