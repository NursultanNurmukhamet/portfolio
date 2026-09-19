(() => {
  const root=document.documentElement;
  const dialog=document.querySelector('#cinematic-intro');
  if(!dialog)return;
  const fill=dialog.querySelector('.loader-fill');
  const progress=dialog.querySelector('.loader-progress');
  const value=dialog.querySelector('.loader-value');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const quietMotion=()=>reduced.matches||document.body.classList.contains('motion-paused');
  const replay=document.createElement('button');
  replay.type='button';replay.className='intro-replay';replay.textContent='Показать загрузку';
  document.querySelector('.site-footer')?.append(replay);
  let deadline=0,closeTimer=0,frame=0,generation=0,leaving=false;
  let displayed=0,target=0,lastTime=0,lastPercent=-1;
  const remember=()=>{try{sessionStorage.setItem('portfolio:loader-seen-v2','1');}catch{}};
  function cleanup(){
    clearTimeout(deadline);clearTimeout(closeTimer);clearTimeout(window.portfolioIntroWatchdog);
    cancelAnimationFrame(frame);frame=0;generation++;leaving=false;
    root.classList.remove('intro-pending','intro-running');
    dialog.classList.remove('is-leaving');
    window.dispatchEvent(new CustomEvent('portfolio:intro',{detail:{active:false}}));
  }
  function finish(immediate=false){
    if(!dialog.open)return;
    if(immediate||quietMotion()){remember();dialog.close();cleanup();return;}
    if(leaving)return;
    leaving=true;remember();clearTimeout(deadline);clearTimeout(closeTimer);
    cancelAnimationFrame(frame);frame=0;
    root.classList.remove('intro-pending');
    dialog.classList.add('is-leaving');
    closeTimer=setTimeout(()=>{dialog.close();cleanup();},180);
  }
  function paint(){
    fill.style.transform=`scaleX(${displayed/100})`;
    progress.style.setProperty('--loader-right',`${100-displayed}%`);
    const percent=Math.floor(displayed);
    if(percent===lastPercent)return;
    lastPercent=percent;value.textContent=`${percent}%`;
    progress.setAttribute('aria-valuenow',String(percent));
    progress.setAttribute('data-progress',`${percent}%`);
  }
  function animate(time){
    frame=0;
    if(!dialog.open||leaving)return;
    displayed=Math.min(target,displayed+Math.max(0,time-lastTime)*.2);
    lastTime=time;paint();
    if(displayed<target)frame=requestAnimationFrame(animate);
    else if(displayed===100)closeTimer=setTimeout(()=>finish(),100);
  }
  function advance(next){
    target=next;
    if(quietMotion()){
      displayed=target;paint();if(target===100)finish(true);
    }else if(!frame){lastTime=performance.now();frame=requestAnimationFrame(animate);}
  }
  function open(manual=false){
    if(dialog.open)return;
    if(quietMotion()&&!manual){cleanup();return;}
    cleanup();const run=++generation;
    displayed=0;target=0;lastPercent=-1;paint();
    dialog.showModal();root.classList.add('intro-running');
    // The modal itself receives focus; the skip control appears only on Tab.
    dialog.focus({preventScroll:true});
    window.dispatchEvent(new CustomEvent('portfolio:intro',{detail:{active:true}}));
    // Resource completion, not invented byte progress. Smooth only towards ready assets.
    const sculpture=document.querySelector('.hero-sculpture');
    const resources=[()=>sculpture?.decode?.(),
      ...['400 16px Anton','500 16px Manrope','800 16px Manrope'].map(font=>()=>document.fonts?.load(font))];
    let completed=0;
    deadline=setTimeout(()=>finish(),2500); // A stalled resource must never trap a visitor.
    resources.forEach(load=>Promise.resolve().then(load).then(()=>{
      if(run!==generation||!dialog.open||leaving)return;
      advance(++completed/resources.length*100);
    },()=>{
      if(run===generation&&dialog.open&&!leaving)finish(); // Fail open, never claim 100% on error.
    }));
  }
  dialog.querySelector('.intro-skip').addEventListener('click',()=>finish(true));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(true);});
  dialog.addEventListener('close',()=>{if(!dialog.open)cleanup();});
  replay.addEventListener('click',()=>open(true));
  reduced.addEventListener('change',event=>{if(event.matches)finish(true);});
  addEventListener('portfolio:motion',event=>{if(event.detail.paused)finish(true);});
  addEventListener('pagehide',()=>{if(dialog.open)dialog.close();cleanup();});
  if(root.classList.contains('intro-pending'))open();
})();
