(() => {
  'use strict';
  // Main page behaviour: motion toggle, section tracking, covers from gallery.js,
  // work filter, branch graph, lazy 3D scene with rack links. No state leaves the page.
  const icon=name=>typeof window.portfolioIcon==='function'?window.portfolioIcon(name):'';
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const quiet=()=>reduceMotion.matches||document.body.classList.contains('motion-paused');

  /* ---------- Motion toggle (scene.js and shell.js listen to the same event) ---------- */
  const toggle=document.querySelector('.motion-toggle');
  let motionPaused=reduceMotion.matches;
  function applyMotion(){
    document.body.classList.toggle('motion-paused',motionPaused);
    if(!toggle)return;
    toggle.setAttribute('aria-pressed',String(motionPaused));
    const label=motionPaused?'Включить анимацию':'Приостановить анимацию';
    toggle.setAttribute('aria-label',label);toggle.title=label;
    toggle.innerHTML=icon(motionPaused?'play':'pause');
    window.dispatchEvent(new CustomEvent('portfolio:motion',{detail:{paused:motionPaused}}));
  }
  toggle?.addEventListener('click',()=>{motionPaused=!motionPaused;applyMotion();});
  reduceMotion.addEventListener('change',event=>{motionPaused=event.matches;applyMotion();});
  applyMotion();

  /* ---------- Section tracking in the top bar ---------- */
  const tabs=[...document.querySelectorAll('.tui-tabs a[data-section]')];
  const sections=tabs.map(tab=>document.getElementById(tab.dataset.section)).filter(Boolean);
  let trackFrame=0,activeId='';
  function track(){
    trackFrame=0;
    if(!sections.length)return;
    const line=innerHeight/3;
    let current=null;
    for(const section of sections)if(section.getBoundingClientRect().top<=line)current=section;
    if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)current=sections[sections.length-1];
    const id=current?current.id:'';
    if(id!==activeId){activeId=id;tabs.forEach(tab=>tab.setAttribute('aria-current',String(tab.dataset.section===activeId)));}
  }
  const scheduleTrack=()=>{if(!trackFrame)trackFrame=requestAnimationFrame(track);};
  addEventListener('scroll',scheduleTrack,{passive:true});addEventListener('resize',scheduleTrack);
  track();

  /* ---------- Covers: the same artwork as the case pages, rendered from gallery.js ---------- */
  const data=window.portfolioProjects;
  if(data){
    for(const slot of document.querySelectorAll('[data-cover]')){
      const demo=data.demos.find(item=>item.cover===slot.dataset.cover);
      if(demo)slot.innerHTML=data.cover(demo);
    }
    document.addEventListener('click',event=>{
      const trigger=event.target.closest('[data-matches]');
      if(trigger)data.openMatches(trigger);
    });
  }

  /* ---------- Work filter ---------- */
  const filterButtons=[...document.querySelectorAll('.work-filter [data-filter]')];
  const workCards=[...document.querySelectorAll('.work-card')];
  const workCount=document.querySelector('#work-count');
  function applyFilter(name){
    let shown=0;
    workCards.forEach(card=>{
      const tags=(card.dataset.tags||'').split(/\s+/);
      const visible=name==='all'||tags.includes(name);
      card.hidden=!visible;if(visible)shown++;
    });
    filterButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===name)));
    if(workCount)workCount.textContent=`показано: ${shown}`;
  }
  filterButtons.forEach(button=>button.addEventListener('click',()=>applyFilter(button.dataset.filter)));
  // A link to one card (featured to work) opens its details so the reader lands on the story.
  function openTargetCard(){
    const card=location.hash&&document.querySelector(`${location.hash}.work-card`);
    if(card){card.hidden=false;const details=card.querySelector('details');if(details)details.open=true;}
  }
  addEventListener('hashchange',openTargetCard);openTargetCard();

  /* ---------- Roadmap: a real branch graph drawn over the commit list ---------- */
  const gitWrap=document.querySelector('#git-wrap');
  const graph=document.querySelector('#git-graph');
  if(gitWrap&&graph){
    const commits=[...gitWrap.querySelectorAll('.git-commit')];
    // Rows are newest first. Each branch forks from an older main commit and merges into a newer one.
    const BRANCHES=[
      {lane:'infra',rows:[6],from:7,to:4},
      {lane:'ai',rows:[5,2,1],from:7,to:0},
      {lane:'security',rows:[3],from:4,to:0}
    ];
    const laneColor={main:'var(--accent)',infra:'var(--info)',security:'var(--warn)',ai:'var(--violet)'};
    const offLanes=new Set();
    let graphFrame=0;
    function drawGraph(){
      graphFrame=0;
      const box=gitWrap.getBoundingClientRect();
      if(!box.width)return;
      const centre=index=>{const dot=commits[index].querySelector('.git-dot').getBoundingClientRect();return {x:dot.left+dot.width/2-box.left,y:dot.top+dot.height/2-box.top};};
      const laneX={};
      commits.forEach((commit,index)=>{if(!(commit.dataset.lane in laneX))laneX[commit.dataset.lane]=centre(index).x;});
      const y=index=>centre(index).y;
      const x0=laneX.main;
      const paths=[`<path data-lane="main" style="stroke:${laneColor.main}" class="${offLanes.has('main')?'is-off':''}" d="M${x0} ${y(0)}L${x0} ${y(commits.length-1)}"/>`];
      for(const branch of BRANCHES){
        const x=laneX[branch.lane];
        if(x===undefined)continue;
        const top=y(Math.min(...branch.rows)),bottom=y(Math.max(...branch.rows));
        const start=y(branch.from),end=y(branch.to);
        const bend=Math.min(34,(start-bottom)/2,(top-end)/2);
        const d=`M${x0} ${start}C${x0} ${start-bend} ${x} ${bottom+bend} ${x} ${bottom}L${x} ${top}C${x} ${top-bend} ${x0} ${end+bend} ${x0} ${end}`;
        paths.push(`<path data-lane="${branch.lane}" style="stroke:${laneColor[branch.lane]}" class="${offLanes.has(branch.lane)?'is-off':''}" d="${d}"/>`);
      }
      graph.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);
      graph.innerHTML=paths.join('');
      gitWrap.classList.add('has-graph');
    }
    const scheduleGraph=()=>{if(!graphFrame)graphFrame=requestAnimationFrame(drawGraph);};
    new ResizeObserver(scheduleGraph).observe(gitWrap);
    document.fonts?.ready?.then(scheduleGraph);
    gitWrap.addEventListener('toggle',scheduleGraph,true);
    document.querySelectorAll('.git-legend [data-lane]').forEach(button=>button.addEventListener('click',()=>{
      const lane=button.dataset.lane;
      if(offLanes.has(lane))offLanes.delete(lane);else offLanes.add(lane);
      button.setAttribute('aria-pressed',String(!offLanes.has(lane)));
      commits.forEach(commit=>commit.classList.toggle('is-off',offLanes.has(commit.dataset.lane)));
      scheduleGraph();
    }));
  }

  /* ---------- 3D cluster: Three.js loads only when wanted ---------- */
  const host=document.querySelector('#scene-host');
  const rackLinks=[...document.querySelectorAll('.rack-links a[data-rack]')];
  const hint=document.querySelector('#scene-hint');
  const HINTS=[
    'Стойка 1 — семь внутренних систем Sapa Technologies: HR-портал, документооборот, обучение, каталог с CRM, поддержка, бронирование и обратная связь.',
    'Стойка 2 — MyLab: свои серверы с GPU, Kubernetes, защищённая сеть и мониторинг. Здесь я пробую то, что потом приношу в работу.',
    'Стойка 3 — проекты с открытым кодом: AgentF, MetaCrypt, ULMusic и университетские работы.'
  ];
  function highlightRack(index,fromScene){
    rackLinks.forEach(link=>link.classList.toggle('is-active',Number(link.dataset.rack)===index));
    if(hint&&index in HINTS)hint.textContent=HINTS[index];
    if(!fromScene)window.dispatchEvent(new CustomEvent('portfolio:rack-select',{detail:{index}}));
  }
  rackLinks.forEach(link=>{
    link.addEventListener('mouseenter',()=>highlightRack(Number(link.dataset.rack),false));
    link.addEventListener('focus',()=>highlightRack(Number(link.dataset.rack),false));
  });
  addEventListener('portfolio:rack',event=>{
    highlightRack(event.detail.index,true);
    const link=rackLinks[event.detail.index];
    // A click on a rack in the scene follows the matching link after a short beat.
    if(link)setTimeout(()=>{if(link.getAttribute('href').startsWith('#'))document.querySelector(link.getAttribute('href'))?.scrollIntoView({behavior:quiet()?'instant':'smooth',block:'start'});else location.href=link.href;},350);
  });
  if(host){
    let loading=false,live=false;
    const load=()=>{
      if(loading||live)return;
      loading=true;host.classList.add('is-loading');host.classList.remove('wants-click');
      import('./scene.js?v=journal-1').then(()=>{live=true;host.classList.remove('is-loading');host.classList.add('is-live');}).catch(()=>{host.classList.remove('is-loading');host.classList.add('is-fallback');});
    };
    const wide=matchMedia('(min-width:901px)').matches;
    const saveData=Boolean(navigator.connection?.saveData);
    if(wide&&!saveData){
      // Desktop: after the main content, once the hero is on screen (it is), on idle.
      const start=()=>('requestIdleCallback' in window?requestIdleCallback(load,{timeout:2500}):setTimeout(load,600));
      if(document.readyState==='complete')start();else addEventListener('load',start,{once:true});
    }else{
      // Phones and data-saver: a static frame and an explicit button, same block size.
      host.classList.add('wants-click');
      document.querySelector('#scene-open')?.addEventListener('click',load);
    }
  }
})();
