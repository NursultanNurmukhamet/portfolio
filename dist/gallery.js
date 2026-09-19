(() => {
  'use strict';
  const clamp = value => Math.max(0,Math.min(1,Number(value)||0));
  const smooth = value => {const x=clamp(value);return x*x*(3-2*x);};
  function slideFraction(index,count) { return count<=1?0:clamp(index/(count-1)); }
  function sampleTravel(progress,count) {
    if(count<=1)return {travel:0,selected:0,cameraX:0,leg:0};
    const position=clamp(progress)*(count-1);
    const leg=Math.min(count-2,Math.floor(position));
    const legProgress=smooth((position-leg-.22)/.56);
    const travel=leg+legProgress;
    return {travel,selected:Math.min(count-1,Math.round(travel)),cameraX:leg%2?1-legProgress:legProgress,leg};
  }
  window.portfolioGalleryCore=Object.freeze({sampleTravel,slideFraction});
  if(typeof document==='undefined')return;
  // One presentation fixture, an event demo, a university case and three personal projects.
  // The eight blueprint slots in projects.js remain unchanged.
  const demos = [
    {id:'demo-01',number:'01',kind:'WEB EXPERIENCE',title:'Интерактивный сайт',english:'Interactive website',ru:'Пример подачи веб-проекта: идея, визуальный язык и взаимодействие с пользователем.',en:'A sample web project presentation: the idea, visual language and user interaction.',cover:'digital',coverTitle:'DIGITAL<br>EXPERIENCE',subtitle:'Идея становится опытом',angle:-5},
    {id:'demo-02',number:'02',kind:'EVENT WEBSITE / DEMO',title:'OPENCOURT CUP',english:'A fictional tennis weekend',ru:'Демо спортивного события: подача, пролёт мяча через три сцены, программа и карточка участника. Все данные вымышлены.',en:'A sports event demo: a serve, a ball travelling through three scenes, a schedule and a guest pass. All data is fictional.',cover:'sports',coverTitle:'OPENCOURT<br>CUP',subtitle:'THREE DAYS / ONE COURT / DEMO',angle:5,href:'demos/orbit-cup/'},
    {id:'demo-03',number:'03',kind:'UNIVERSITY / AI / RESEARCH',title:'Университет',english:'University projects',ru:'UniTrack, материалы мастер-класса по ИИ и исследование казахской детской речи. Три направления и мой сертификат.',en:'UniTrack, AI masterclass materials and Kazakh children’s speech research. Three areas of work, with my certificate.',cover:'campus',coverTitle:'CAMPUS<br>PROJECTS',subtitle:'UNITRACK / AI MASTERCLASS / ASR',angle:-5,href:'projects/university/',isCase:true},
    {id:'demo-04',number:'04',kind:'MULTI-AGENT AI',title:'AgentF',english:'Five agents. One team.',ru:'Пять футбольных AI-агентов: тактика, решения языковой модели и резервная логика.',en:'Five AI football agents: tactics, language-model decisions and fallback logic.',cover:'agentf',coverTitle:'AGENT<br>FOOTBALL',subtitle:'PYTHON / AMAZON NOVA / AGENTCORE',angle:5,href:'https://github.com/NursultanNurmukhamet/AgentF',isPersonal:true,footer:'FIVE AGENTS. ONE TEAM.'},
    {id:'demo-05',number:'05',kind:'PRIVACY TOOL',title:'MetaCrypt',english:'Your images. Your metadata.',ru:'Метаданные изображений: просмотр, очистка, редактирование и шифрование в браузере.',en:'Image metadata: inspect, clean, edit and encrypt directly in the browser.',cover:'metacrypt',coverTitle:'META<br>CRYPT',subtitle:'REACT / TYPESCRIPT / WEB CRYPTO',angle:-5,href:'https://nursultannurmukhamet.github.io/MetaCrypt/',isPersonal:true,isApp:true,footer:'EXIF / XMP / IPTC'},
    {id:'demo-06',number:'06',kind:'TELEGRAM MEDIA BOT',title:'ULMusic',english:'A link becomes your playlist.',ru:'Telegram-бот для загрузки аудио, видео и нужных фрагментов по ссылке или поиску.',en:'A Telegram bot for getting audio, video and clips from links or search.',cover:'listen',coverTitle:'UL<br>MUSIC',subtitle:'PYTHON / AIOGRAM / YT-DLP / FFMPEG',angle:5,href:'https://t.me/ShutUpandListen_Bot',isPersonal:true,isBot:true,footer:'MUSIC / AUDIO / VIDEO'}
  ];
  const showcase = document.querySelector('.diagonal-showcase');
  showcase.dataset.projectCount=String(demos.length);
  showcase.style.setProperty('--gallery-height',((demos.length-1)*150+100)+'svh');
  const stage = showcase.querySelector('.gallery-stage');
  const panelsRoot = document.querySelector('#gallery-panels');
  const modeButton = document.querySelector('#gallery-mode');
  const paginationRoot=showcase.querySelector('.gallery-pagination');
  paginationRoot.innerHTML=demos.map((demo,index)=>
    (index?'<span aria-hidden="true"></span>':'')+'<button type="button" data-slide="'+index+'" aria-label="'+demo.title+'" aria-current="'+String(index===0)+'">'+demo.number+'</button>').join('');
  const pagination=[...paginationRoot.querySelectorAll('[data-slide]')];
  showcase.querySelector('.demo-badge').textContent=demos.length+' ИСТОРИЙ';
  const watermark = showcase.querySelector('.gallery-watermark');
  const progressBar = showcase.querySelector('.gallery-progress');
  const dialog = document.querySelector('.preview-dialog');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const shortScreen = matchMedia('(max-height: 479px), (max-width: 519px) and (max-height: 699px)');
  let manualStatic=false, isStatic=false, frame=0, current=0, lastFocus=null, restoringFocus=false;
  const agentMatches=[
    {file:'assets/agentf/match-total-attack.png',opponent:'Total Attack United',score:'2:1',width:1200,height:647},
    {file:'assets/agentf/match-benchmark.png',opponent:'The Benchmark FC',score:'2:0',width:1204,height:650},
    {file:'assets/agentf/match-fort-knox.png',opponent:'Fort Knox Athletic',score:'2:0',width:1200,height:647}
  ];
  const agentCover='<button type="button" class="agentf-matches-cover" data-matches aria-label="AgentF: увеличить скриншоты трёх побед">'+[agentMatches[1],agentMatches[0],agentMatches[2]].map(match=>
    '<img src="'+match.file+'" width="'+match.width+'" height="'+match.height+'" alt="SapaTech '+match.score+' '+match.opponent+'" loading="lazy" decoding="async">').join('')+'</button>';
  const personalVisuals={
    agentf:agentCover,
    metacrypt:"<div class=\"personal-cover-art\" aria-hidden=\"true\"><svg class=\"lab-vault\" viewBox=\"0 0 360 230\" fill=\"none\" focusable=\"false\"><g stroke=\"currentColor\" stroke-width=\"1.4\"><path opacity=\".28\" d=\"m72 77 142-34 76 49-143 35Zm0 35 142-34 76 49-143 35Zm0 35 142-34 76 49-143 35Z\"/><g class=\"lab-lock\"><rect x=\"135\" y=\"102\" width=\"90\" height=\"71\" rx=\"10\" fill=\"var(--cover-fill)\"/><path d=\"M152 101V84a28 28 0 0 1 56 0v17\" stroke-width=\"6\"/><circle cx=\"180\" cy=\"130\" r=\"7\" fill=\"currentColor\"/><path d=\"M180 137v13\" stroke-width=\"4\"/></g><path d=\"M50 52v-9h9m242 0h9v9M50 184v9h9m242 0h9v-9\" opacity=\".55\"/></g></svg></div>",
    listen:"<div class=\"personal-cover-art\" aria-hidden=\"true\"><svg class=\"lab-audio\" viewBox=\"0 0 360 230\" fill=\"none\" focusable=\"false\"><g class=\"lab-wave\" stroke=\"currentColor\" stroke-width=\"6\" stroke-linecap=\"round\"><path d=\"M55 103v24m16-40v56m16-70v84m16-54v24m16-58v92m16-80v68m16-46v24m16-75v126m16-101v76m16-49v22m16-58v94m16-108v122m16-89v56m16-40v24m16-27v30m16-59v88\"/></g><path d=\"M103 186h153\" stroke=\"currentColor\" opacity=\".3\"/><circle cx=\"142\" cy=\"186\" r=\"5\" fill=\"currentColor\"/><path d=\"m165 33 28 15-28 15Z\" stroke=\"currentColor\" stroke-width=\"1.5\"/></svg></div>"
  };
  function cover(demo) {
    const visual = demo.cover==='sports' ? '<div class="sports-cover-court" aria-hidden="true"></div><img class="sports-cover-art" src="demos/orbit-cup/assets/tennis-player-v2.png" width="1024" height="1536" loading="lazy" decoding="async" alt=""><span class="sports-cover-ball" aria-hidden="true"></span>' : demo.cover==='digital' ? '<img class="paper-visual" src="assets/chrome-knot.webp" width="1254" height="1254" alt="">' : demo.cover==='system' ? '<div class="system-diagram" aria-hidden="true"><div><span>CONTEXT</span><b>01</b><span>THE CHALLENGE</span></div><div><span>PROCESS</span><i><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-arrow-up-right"></use></svg></i></div><div><span>RESULT</span><i><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-plus"></use></svg></i></div></div>' : '<div class="lab-grid" aria-hidden="true"></div><div class="lab-type" aria-hidden="true">ai</div><span class="lab-tag" lang="en">TRY. LEARN. REPEAT.</span>';
    const campusVisual='<div class="campus-network" aria-hidden="true"><span class="campus-orbit"></span><div class="campus-node campus-node-track"><small>01 / PRODUCT</small><b>UniTrack</b><i></i><i></i><i></i></div><div class="campus-node campus-node-ai"><small>02 / EDUCATION</small><b>AI</b><span>KZ + RU</span></div><div class="campus-node campus-node-asr"><small>03 / RESEARCH</small><b>ASR</b><span>VOICE / TEXT</span></div></div>';
    return `<div class="paper-cover cover-${demo.cover}"><div class="paper-topline"><span>${demo.isPersonal?'PERSONAL PROJECT / PORTFOLIO':demo.isCase?'SELECTED WORK / PORTFOLIO':'DEMO / PORTFOLIO'}</span><span>${demo.number}</span></div><p class="paper-title" lang="en">${demo.coverTitle}</p><p class="paper-subtitle">${demo.subtitle}</p>${personalVisuals[demo.cover]||(demo.cover==='campus'?campusVisual:visual)}<div class="paper-foot"><span>${demo.footer||(demo.isCase?'ПРОЕКТЫ · ИССЛЕДОВАНИЕ · СЕРТИФИКАТ':'ОБРАЗЕЦ ОБЛОЖКИ · НЕ КЕЙС')}</span><span class="paper-number">${demo.number}</span></div></div>`;
  }
  panelsRoot.innerHTML=demos.map((demo,index)=>`<article class="gallery-panel ${index%2?'is-reversed':''}" id="${demo.id}" aria-labelledby="${demo.id}-title" style="--rest-angle:${demo.angle}deg"><div class="project-story"><p class="story-meta">DEMO ${demo.number} <span>${demo.kind}</span></p><h3 id="${demo.id}-title">${demo.title}</h3><p class="english-title" lang="en">${demo.english}</p><div class="bilingual-copy"><div class="language-copy" lang="ru"><span>RU</span><p>${demo.ru}</p></div><div class="language-copy" lang="en"><span>EN</span><p>${demo.en}</p></div></div><button class="preview-trigger" type="button" data-preview="${index}" aria-label="Посмотреть макет обложки: ${demo.title}">Посмотреть макет <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-arrow-up-right"></use></svg></button></div><div class="pdf-object" aria-label="Демонстрационная обложка будущей PDF"><div class="paper-stack" style="--paper-angle:${demo.angle}deg">${cover(demo)}<span class="pdf-caption">PDF / ОБРАЗЕЦ ОБЛОЖКИ</span></div></div></article>`).join('');
  const panels=[...panelsRoot.querySelectorAll('.gallery-panel')];
  // Linked entries open their own demo or case page; fixture previews stay local.
  demos.forEach((demo,index)=>{
    if(!demo.href)return;
    const panel=panels[index];
    const link=document.createElement('a');
    link.className='preview-trigger';link.href=demo.href;
    link.textContent=demo.isBot?'Открыть бота ':demo.isApp?'Открыть приложение ':demo.isPersonal?'Открыть GitHub ':demo.isCase?'Открыть проекты ':'Открыть демосайт ';
    if(demo.isPersonal){link.target='_blank';link.rel='noopener noreferrer';}
    if(demo.cover==='agentf'){
      const matchesButton=document.createElement('button');
      matchesButton.type='button';matchesButton.className='matches-trigger';matchesButton.dataset.matches='';
      matchesButton.textContent='Три победы над ботами / Match wins';
      panel.querySelector('.project-story').append(matchesButton);
    }
    const arrow=document.createElement('span');arrow.innerHTML=window.portfolioIcon('arrow-up-right');arrow.setAttribute('aria-hidden','true');link.append(arrow);
    panel.querySelector('.preview-trigger').replaceWith(link);
    panel.querySelector('.pdf-caption').textContent=demo.isBot?'TELEGRAM / MEDIA BOT':demo.isApp?'WEB / PRIVACY TOOL':demo.isPersonal?'CODE / PERSONAL PROJECT':demo.isCase?'CASE / UNIVERSITY':'WEB / INTERACTIVE DEMO';
    panel.querySelector('.pdf-object').setAttribute('aria-label',demo.isPersonal||demo.isCase?`Обложка проекта ${demo.title}`:`Обложка самостоятельного демосайта ${demo.title}`);
    if(demo.isCase||demo.isPersonal)panel.querySelector('.story-meta').firstChild.textContent=(demo.isPersonal?'PROJECT ':'CASE ')+demo.number+' ';
    else panel.querySelector('.paper-foot>span').textContent='ВЫМЫШЛЕННОЕ СОБЫТИЕ · ДЕМО';
  });
  function render() {
    frame=0;
    const range=Math.max(1,showcase.offsetHeight-stage.offsetHeight);
    const progress=clamp(-showcase.getBoundingClientRect().top/range);
    const sample=sampleTravel(progress,demos.length);
    const {travel,cameraX,leg}=sample;
    const selected=isStatic?current:sample.selected;
    const width=panelsRoot.clientWidth,height=panelsRoot.clientHeight;
    const mobile=innerWidth<760;
    // Alternate horizontal direction on every leg for any number of projects.
    panels.forEach((panel,index)=>{
      const offset=index-travel;
      const active=isStatic||index===selected;
      panel.classList.toggle('is-active',active);
      panel.inert=!active;
      panel.setAttribute('aria-hidden',String(!active));
      if(isStatic){panel.style.transform='none';panel.style.opacity='1';panel.style.visibility='visible';return;}
      panel.style.transform=`translate3d(${(index%2-cameraX)*width*(mobile?.58:.87)}px,${offset*height*1.13}px,0)`;
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
    if(!isStatic)showcase.querySelector('.gallery-scroll-hint').innerHTML=selected===demos.length-1?'Дальше — обсудим задачу <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-arrow-down"></use></svg>':`Листай зигзагом ${window.portfolioIcon(leg%2?'arrow-down-left':'arrow-down-right')}`;
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
    modeButton.innerHTML=isStatic?'Диагональный вид <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-arrow-down-right"></use></svg>':'Без движения <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-arrows-vertical"></use></svg>';
    if(modeButton.disabled)modeButton.textContent=reduceMotion.matches?'Движение отключено':'Режим чтения';
    showcase.querySelector('.gallery-scroll-hint').innerHTML=isStatic?demos.length+' проектов':'Листай по диагонали <svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-arrow-down-right"></use></svg>';
    render();
    if(keepPosition && wasInside && previous!==isStatic){
      const sectionTop=scrollY+showcase.getBoundingClientRect().top;
      current=referenceIndex;
      const target=isStatic?scrollY+panels[referenceIndex].getBoundingClientRect().top-24:sectionTop+(showcase.offsetHeight-stage.offsetHeight)*slideFraction(referenceIndex,demos.length);
      window.scrollTo({top:target,behavior:'instant'});
      schedule();
    }
  }
  function goTo(index){
    const sectionTop=scrollY+showcase.getBoundingClientRect().top;
    const target=isStatic?scrollY+panels[index].getBoundingClientRect().top-24:sectionTop+(showcase.offsetHeight-stage.offsetHeight)*slideFraction(index,demos.length);
    window.scrollTo({top:target,behavior:reduceMotion.matches?'instant':'smooth'});
  }
  modeButton.addEventListener('click',()=>{manualStatic=!manualStatic;updateMode(true);});
  pagination.forEach(button=>button.addEventListener('click',()=>goTo(Number(button.dataset.slide))));
  panelsRoot.addEventListener('click',event=>{
    const matchTrigger=event.target.closest('[data-matches]');
    if(matchTrigger){
      lastFocus=matchTrigger;
      document.querySelector('#preview-title').textContent='AgentF / Три победы над ботами';
      dialog.querySelector('.preview-toolbar p').textContent='SapaTech · AWS Agentic Football Cup · Победы в отдельных матчах / Individual match wins';
      dialog.classList.add('matches-preview');
      dialog.querySelector('.preview-document').innerHTML=agentMatches.map((match,index)=>
        '<figure class="match-evidence"><a href="'+match.file+'" target="_blank" rel="noopener noreferrer" aria-label="Открыть полный скриншот: SapaTech '+match.score+' '+match.opponent+'"><img src="'+match.file+'" width="'+match.width+'" height="'+match.height+'" alt="Скриншот победы SapaTech над '+match.opponent+', счёт '+match.score+'"></a><figcaption><span>0'+(index+1)+' / SAPATECH</span><strong>'+match.score+'</strong><span>'+match.opponent+'</span></figcaption></figure>').join('');
      document.body.classList.add('preview-open');dialog.showModal();return;
    }
    const trigger=event.target.closest('[data-preview]');if(!trigger)return;
    dialog.classList.remove('matches-preview');
    dialog.querySelector('.preview-toolbar p').textContent='Демонстрационная обложка, не настоящий проект.';
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
