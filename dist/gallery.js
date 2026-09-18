(() => {
  // These three examples are presentation fixtures only. The eight real project
  // slots in projects.js are preserved and have not been populated.
  const demos = [
    {id:'demo-01',number:'01',kind:'WEB EXPERIENCE',title:'Интерактивный сайт',english:'Interactive website',ru:'Пример подачи веб-проекта: идея, визуальный язык и взаимодействие с пользователем.',en:'A sample web project presentation: the idea, visual language and user interaction.',cover:'digital',coverTitle:'DIGITAL<br>EXPERIENCE',subtitle:'Идея становится опытом',angle:-5},
    {id:'demo-02',number:'02',kind:'PRODUCT & SYSTEMS',title:'Рабочая платформа',english:'Business platform',ru:'Пример закрытого кейса: задача, мой вклад и подход — без клиента и внутренних данных.',en:'A sample private case study: the challenge, my contribution and approach — without client or internal data.',cover:'system',coverTitle:'BEHIND<br>THE SYSTEM',subtitle:'Сложное становится понятным',angle:5},
    {id:'demo-03',number:'03',kind:'AI & EXPERIMENTS',title:'AI-эксперимент',english:'AI experiment',ru:'Пример исследовательского проекта: гипотеза, прототип и выводы в одной истории.',en:'A sample research project: the hypothesis, prototype and findings, all in one story.',cover:'lab',coverTitle:'WHAT<br>IF?',subtitle:'Вопрос становится экспериментом',angle:-5}
  ];
  const showcase = document.querySelector('.diagonal-showcase');
  const stage = showcase.querySelector('.gallery-stage');
  const panelsRoot = document.querySelector('#gallery-panels');
  const modeButton = document.querySelector('#gallery-mode');
  const pagination = [...document.querySelectorAll('[data-slide]')];
  const watermark = showcase.querySelector('.gallery-watermark');
  const progressBar = showcase.querySelector('.gallery-progress');
  const dialog = document.querySelector('.preview-dialog');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const shortScreen = matchMedia('(max-height: 479px), (max-width: 519px) and (max-height: 699px)');
  let manualStatic=false, isStatic=false, frame=0, current=0, lastFocus=null, restoringFocus=false;
  const clamp = value => Math.max(0,Math.min(1,value));
  const smooth = value => {const x=clamp(value);return x*x*(3-2*x);};
  function cover(demo) {
    const visual = demo.cover==='digital' ? '<img class="paper-visual" src="assets/chrome-knot.png" width="1254" height="1254" alt="">' : demo.cover==='system' ? '<div class="system-diagram" aria-hidden="true"><div><span>CONTEXT</span><b>01</b><span>THE CHALLENGE</span></div><div><span>PROCESS</span><i>↗</i></div><div><span>RESULT</span><i>+</i></div></div>' : '<div class="lab-grid" aria-hidden="true"></div><div class="lab-type" aria-hidden="true">ai</div><span class="lab-tag" lang="en">TRY. LEARN. REPEAT.</span>';
    return `<div class="paper-cover cover-${demo.cover}"><div class="paper-topline"><span>DEMO / PORTFOLIO</span><span>${demo.number}</span></div><p class="paper-title" lang="en">${demo.coverTitle}</p><p class="paper-subtitle">${demo.subtitle}</p>${visual}<div class="paper-foot"><span>ОБРАЗЕЦ ОБЛОЖКИ · НЕ КЕЙС</span><span class="paper-number">${demo.number}</span></div></div>`;
  }
  panelsRoot.innerHTML=demos.map((demo,index)=>`<article class="gallery-panel ${index%2?'is-reversed':''}" id="${demo.id}" aria-labelledby="${demo.id}-title" style="--rest-angle:${demo.angle}deg"><div class="project-story"><p class="story-meta">DEMO ${demo.number} <span>${demo.kind}</span></p><h3 id="${demo.id}-title">${demo.title}</h3><p class="english-title" lang="en">${demo.english}</p><div class="bilingual-copy"><div class="language-copy" lang="ru"><span>RU</span><p>${demo.ru}</p></div><div class="language-copy" lang="en"><span>EN</span><p>${demo.en}</p></div></div><button class="preview-trigger" type="button" data-preview="${index}" aria-label="Посмотреть макет обложки: ${demo.title}">Посмотреть макет <span aria-hidden="true">↗</span></button></div><div class="pdf-object" aria-label="Демонстрационная обложка будущей PDF"><div class="paper-stack" style="--paper-angle:${demo.angle}deg">${cover(demo)}<span class="pdf-caption">PDF / ОБРАЗЕЦ ОБЛОЖКИ</span></div></div></article>`).join('');
  const panels=[...panelsRoot.querySelectorAll('.gallery-panel')];
  function render() {
    frame=0;
    const range=Math.max(1,showcase.offsetHeight-stage.offsetHeight);
    const progress=clamp(-showcase.getBoundingClientRect().top/range);
    const position=progress*2;
    const base=Math.min(1,Math.floor(position));
    // Reading plateaus at each project, with native scrolling between them.
    const travel=base+smooth((position-base-.22)/.56);
    const selected=isStatic?current:Math.min(2,Math.round(travel));
    const width=panelsRoot.clientWidth,height=panelsRoot.clientHeight;
    const mobile=innerWidth<760;
    // Zigzag world positions: (0,0) -> (1,1) -> (0,2).
    // The camera changes horizontal direction on the second leg; the whole
    // project composition follows it, not just a decorative background line.
    const anchorX=[0,1,0];
    const cameraX=travel<=1?travel:2-travel;
    panels.forEach((panel,index)=>{
      const offset=index-travel;
      const active=isStatic||index===selected;
      panel.classList.toggle('is-active',active);
      panel.inert=!active;
      panel.setAttribute('aria-hidden',String(!active));
      if(isStatic){panel.style.transform='none';panel.style.opacity='1';panel.style.visibility='visible';return;}
      panel.style.transform=`translate3d(${(anchorX[index]-cameraX)*width*(mobile?.58:.87)}px,${offset*height*1.13}px,0)`;
      panel.style.opacity=String(clamp(1-Math.max(0,Math.abs(offset)-.15)*.85));
      panel.style.visibility=Math.abs(offset)<1.28?'visible':'hidden';
      panel.querySelector('.paper-stack').style.setProperty('--paper-angle',`${demos[index].angle+offset*9}deg`);
    });
    if(selected!==current){
      const previous=panels[current];
      // A focused action must not become trapped inside an inert outgoing slide.
      if(!restoringFocus && previous.contains(document.activeElement)) pagination[selected].focus({preventScroll:true});
      current=selected;
    }
    pagination.forEach((button,index)=>button.setAttribute('aria-current',String(index===selected)));
    watermark.textContent=demos[selected].number;
    watermark.style.transform=`translate3d(${-travel*28}px,${travel*18}px,0)`;
    if(!isStatic)showcase.querySelector('.gallery-scroll-hint').innerHTML=selected===2?'Дальше — обо мне <span aria-hidden="true">↓</span>':`Листай зигзагом <span aria-hidden="true">${travel<1?'↘':'↙'}</span>`;
    progressBar.style.transform=`scaleX(${progress})`;
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(render);}
  function updateMode(keepPosition=false){
    const topBefore=showcase.getBoundingClientRect().top;
    const wasInside=topBefore<=100&&showcase.getBoundingClientRect().bottom>0;
    const previous=isStatic;
    const referenceIndex=previous&&wasInside?panels.reduce((best,panel,index)=>Math.abs(panel.getBoundingClientRect().top+panel.offsetHeight/2-innerHeight/2)<Math.abs(panels[best].getBoundingClientRect().top+panels[best].offsetHeight/2-innerHeight/2)?index:best,0):current;
    isStatic=manualStatic||reduceMotion.matches||shortScreen.matches||document.body.classList.contains('motion-paused');
    showcase.classList.toggle('gallery-static',isStatic);
    modeButton.setAttribute('aria-pressed',String(isStatic));
    modeButton.disabled=reduceMotion.matches||shortScreen.matches||document.body.classList.contains('motion-paused');
    modeButton.innerHTML=isStatic?'Диагональный вид <span aria-hidden="true">↘</span>':'Без движения <span aria-hidden="true">↕</span>';
    if(modeButton.disabled)modeButton.textContent=reduceMotion.matches?'Движение отключено':'Режим чтения';
    showcase.querySelector('.gallery-scroll-hint').innerHTML=isStatic?'Три демонстрационных макета':'Листай по диагонали <span aria-hidden="true">↘</span>';
    render();
    if(keepPosition && wasInside && previous!==isStatic){
      const sectionTop=scrollY+showcase.getBoundingClientRect().top;
      current=referenceIndex;
      const target=isStatic?scrollY+panels[referenceIndex].getBoundingClientRect().top-24:sectionTop+(showcase.offsetHeight-stage.offsetHeight)*(referenceIndex/2);
      window.scrollTo({top:target,behavior:'instant'});
      schedule();
    }
  }
  function goTo(index){
    const sectionTop=scrollY+showcase.getBoundingClientRect().top;
    const target=isStatic?scrollY+panels[index].getBoundingClientRect().top-24:sectionTop+(showcase.offsetHeight-stage.offsetHeight)*(index/2);
    window.scrollTo({top:target,behavior:reduceMotion.matches?'instant':'smooth'});
  }
  modeButton.addEventListener('click',()=>{manualStatic=!manualStatic;updateMode(true);});
  pagination.forEach(button=>button.addEventListener('click',()=>goTo(Number(button.dataset.slide))));
  panelsRoot.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-preview]');if(!trigger)return;
    lastFocus=trigger;
    const demo=demos[Number(trigger.dataset.preview)];
    document.querySelector('#preview-title').textContent=`${demo.title} / ${demo.english}`;
    dialog.querySelector('.preview-document').innerHTML=cover(demo);
    document.body.classList.add('preview-open');dialog.showModal();
  });
  dialog.querySelector('.preview-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{document.body.classList.remove('preview-open');restoringFocus=true;if(lastFocus&&!lastFocus.closest('[inert]'))lastFocus.focus({preventScroll:true});restoringFocus=false;});
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',()=>{updateMode();schedule();});
  addEventListener('portfolio:motion',()=>updateMode());reduceMotion.addEventListener('change',()=>updateMode(true));shortScreen.addEventListener('change',()=>updateMode(true));
  updateMode();
})();
