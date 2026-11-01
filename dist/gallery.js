(() => {
  'use strict';
  // Project data and cover artwork for the main page. The TUI file manager in
  // tui.js renders window.portfolioProjects; nothing here depends on scrolling.
  // Two cases with their own pages and three personal projects with public code.
  const demos = [
    {id:'case-01',number:'01',kind:'INFRASTRUCTURE & SYSTEMS',title:'MyLab',english:'Personal infrastructure lab',ru:'Персональная инфраструктурная лаборатория: вычисления, GPU, сеть, наблюдаемость и проверяемое восстановление.',en:'A personal infrastructure lab spanning compute, GPUs, networking, observability and verified recovery.',cover:'mylab',coverTitle:'MY<br>LAB',subtitle:'PROXMOX / KUBERNETES / GRAFANA',angle:5,href:'mylab.html',isCase:true,caption:'WEB CASE / MYLAB',action:'Открыть кейс ',file:'mylab/',tag:'INFRA',perm:'кейс',size:'6 глав'},
    {id:'case-02',number:'02',kind:'UNIVERSITY / AI / RESEARCH',title:'Университет',english:'University projects',ru:'UniTrack, материалы мастер-класса по ИИ и исследование казахской детской речи. Три направления и мой сертификат.',en:'UniTrack, AI masterclass materials and Kazakh children’s speech research. Three areas of work, with my certificate.',cover:'campus',coverTitle:'CAMPUS<br>PROJECTS',subtitle:'UNITRACK / AI MASTERCLASS / ASR',angle:-5,href:'projects/university/',isCase:true,caption:'CASE / UNIVERSITY',action:'Открыть проекты ',file:'university/',tag:'AI · RESEARCH',perm:'кейс',size:'3 проекта'},
    {id:'project-03',number:'03',kind:'MULTI-AGENT AI',title:'AgentF',english:'Five agents. One team.',ru:'Пять футбольных AI-агентов: тактика, решения языковой модели и резервная логика.',en:'Five AI football agents: tactics, language-model decisions and fallback logic.',cover:'agentf',coverTitle:'AGENT<br>FOOTBALL',subtitle:'PYTHON / AMAZON NOVA / AGENTCORE',angle:5,href:'https://github.com/NursultanNurmukhamet/AgentF',isPersonal:true,footer:'FIVE AGENTS. ONE TEAM.',caption:'CODE / PERSONAL PROJECT',action:'Открыть GitHub ',file:'agentf.py',tag:'AI · AGENTS',perm:'код',size:'5 агентов'},
    {id:'project-04',number:'04',kind:'PRIVACY TOOL',title:'MetaCrypt',english:'Your images. Your metadata.',ru:'Метаданные изображений: просмотр, очистка, редактирование и шифрование в браузере.',en:'Image metadata: inspect, clean, edit and encrypt directly in the browser.',cover:'metacrypt',coverTitle:'META<br>CRYPT',subtitle:'REACT / TYPESCRIPT / WEB CRYPTO',angle:-5,href:'https://nursultannurmukhamet.github.io/MetaCrypt/',isPersonal:true,isApp:true,footer:'EXIF / XMP / IPTC',caption:'WEB / PRIVACY TOOL',action:'Открыть приложение ',file:'metacrypt.tsx',tag:'SECURITY · WEB',perm:'приложение',size:'в браузере'},
    {id:'project-05',number:'05',kind:'TELEGRAM MEDIA BOT',title:'ULMusic',english:'A link becomes your playlist.',ru:'Telegram-бот для загрузки аудио, видео и нужных фрагментов по ссылке или поиску.',en:'A Telegram bot for getting audio, video and clips from links or search.',cover:'listen',coverTitle:'UL<br>MUSIC',subtitle:'PYTHON / AIOGRAM / YT-DLP / FFMPEG',angle:5,href:'https://t.me/ShutUpandListen_Bot',isPersonal:true,isBot:true,footer:'MUSIC / AUDIO / VIDEO',caption:'TELEGRAM / MEDIA BOT',action:'Открыть бота ',file:'ulmusic.bot',tag:'BOT · MEDIA',perm:'бот',size:'telegram'}
  ];
  const agentMatches=[
    {file:'assets/agentf/match-total-attack.png',opponent:'Total Attack United',score:'2:1',width:1200,height:647},
    {file:'assets/agentf/match-benchmark.png',opponent:'The Benchmark FC',score:'2:0',width:1204,height:650},
    {file:'assets/agentf/match-fort-knox.png',opponent:'Fort Knox Athletic',score:'2:0',width:1200,height:647}
  ];
  const agentCover='<div class="agentf-tactics-cover" aria-hidden="true"><svg viewBox="0 0 360 230" fill="none" focusable="false"><rect class="tactics-field" x="24" y="19" width="312" height="192" rx="3"/><path class="tactics-line" d="M180 19v192M24 115h312M127 115a53 53 0 1 0 106 0 53 53 0 0 0-106 0ZM24 72h43v86H24m312-86h-43v86h43"/><path class="tactics-route" d="M61 154 119 101 180 136 248 77 304 116"/><path class="tactics-route tactics-route-alt" d="m180 136 64 43 58-63"/><g class="tactics-agent"><circle cx="61" cy="154" r="10"/><circle cx="119" cy="101" r="10"/><circle cx="180" cy="136" r="10"/><circle cx="248" cy="77" r="10"/><circle cx="304" cy="116" r="10"/></g><circle class="tactics-ball" cx="180" cy="136" r="4"/><text x="36" y="42">INPUT</text><text x="263" y="194">DECISION</text></svg></div>';
  const personalVisuals={
    agentf:agentCover,
    metacrypt:"<div class=\"personal-cover-art\" aria-hidden=\"true\"><svg class=\"lab-vault\" viewBox=\"0 0 360 230\" fill=\"none\" focusable=\"false\"><g stroke=\"currentColor\" stroke-width=\"1.4\"><path opacity=\".28\" d=\"m72 77 142-34 76 49-143 35Zm0 35 142-34 76 49-143 35Zm0 35 142-34 76 49-143 35Z\"/><g class=\"lab-lock\"><rect x=\"135\" y=\"102\" width=\"90\" height=\"71\" rx=\"10\" fill=\"var(--cover-fill)\"/><path d=\"M152 101V84a28 28 0 0 1 56 0v17\" stroke-width=\"6\"/><circle cx=\"180\" cy=\"130\" r=\"7\" fill=\"currentColor\"/><path d=\"M180 137v13\" stroke-width=\"4\"/></g><path d=\"M50 52v-9h9m242 0h9v9M50 184v9h9m242 0h9v-9\" opacity=\".55\"/></g></svg></div>",
    listen:"<div class=\"personal-cover-art\" aria-hidden=\"true\"><svg class=\"lab-audio\" viewBox=\"0 0 360 230\" fill=\"none\" focusable=\"false\"><g class=\"lab-wave\" stroke=\"currentColor\" stroke-width=\"6\" stroke-linecap=\"round\"><path d=\"M55 103v24m16-40v56m16-70v84m16-54v24m16-58v92m16-80v68m16-46v24m16-75v126m16-101v76m16-49v22m16-58v94m16-108v122m16-89v56m16-40v24m16-27v30m16-59v88\"/></g><path d=\"M103 186h153\" stroke=\"currentColor\" opacity=\".3\"/><circle cx=\"142\" cy=\"186\" r=\"5\" fill=\"currentColor\"/><path d=\"m165 33 28 15-28 15Z\" stroke=\"currentColor\" stroke-width=\"1.5\"/></svg></div>"
  };
  const icon=name=>typeof window.portfolioIcon==='function'?window.portfolioIcon(name):'';
  // MyLab's cover shares the case page's editorial identity (mylab-cover.css).
  const mylabCover=()=>`<div class="paper-cover cover-mylab ml-editorial-cover"><div class="ml-cover-grid" aria-hidden="true"></div>
    <div class="paper-topline"><span>CASE 01</span><span>PERSONAL INFRASTRUCTURE</span></div>
    <p class="ml-cover-wordmark" lang="en">MY<span>LAB</span><b>.</b></p>
    <p class="ml-cover-lead">Моя инфраструктура.<br>От кабеля до кластера.</p>
    <svg class="ml-cover-art" viewBox="0 0 600 430" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ml-plate" x1="110" y1="90" x2="475" y2="310" gradientUnits="userSpaceOnUse"><stop stop-color="#34496a"/><stop offset="1" stop-color="#131b30"/></linearGradient>
        <linearGradient id="ml-core" x1="235" y1="90" x2="360" y2="210" gradientUnits="userSpaceOnUse"><stop stop-color="#ffad71"/><stop offset="1" stop-color="#ff7048"/></linearGradient>
        <radialGradient id="ml-glow"><stop stop-color="#3157ea" stop-opacity=".4"/><stop offset="1" stop-color="#3157ea" stop-opacity="0"/></radialGradient>
      </defs>
      <ellipse cx="300" cy="265" rx="270" ry="165" fill="url(#ml-glow)"/>
      <ellipse cx="300" cy="350" rx="166" ry="27" fill="#050916" opacity=".7"/>
      <g class="ml-cover-machine">
        <path d="M102 271 300 367 498 271v17L300 385 102 288Z" fill="#090f21" stroke="#536581"/>
        <path d="m102 271 198-97 198 97-198 96Z" fill="url(#ml-plate)" stroke="#738cae"/>
        <path d="m148 271 152-74 152 74-152 73Z" stroke="#90abc5" stroke-opacity=".25"/>
        <path d="m170 280 72 35m15 7 16 8m67-1 36-18m13-6 16-8" stroke="#62dfbc" stroke-width="3"/>
        <g class="ml-cover-middle">
          <path d="M102 209 300 305 498 209v17L300 323 102 226Z" fill="#162b66" stroke="#5777da"/>
          <path d="m102 209 198-97 198 97-198 96Z" fill="#21397a" stroke="#9bb9ff"/>
          <path d="m154 209 146-71 146 71-146 71Z" stroke="#648be8"/>
          <path d="M204 191v35m33-51v68m33-84v100m33-113v128m33-113v96m33-80v64m33-48v32" stroke="#4666b4"/>
          <path d="m134 230 18 9m10 5 18 9m10 5 18 9" stroke="#cbff55" stroke-width="4"/>
        </g>
        <g class="ml-cover-top">
          <path d="M102 134 300 230 498 134v17L300 248 102 151Z" fill="#141c30" stroke="#8196b5"/>
          <path d="m102 134 198-97 198 97-198 96Z" fill="url(#ml-plate)" stroke="#bed0e8"/>
          <path d="m151 134 149-73 149 73-149 72Z" stroke="#7e99bd" stroke-dasharray="3 6"/>
          <path d="m227 134 73-36 73 36-73 36Z" fill="url(#ml-core)" stroke="#ffd0a2" stroke-width="2"/>
          <path d="M227 134v12l73 36 73-36v-12l-73 36Z" fill="#bc4d34"/>
          <path d="m267 117 65 32m-49-40 65 32m-81 10 65-32m-49 40 65-32" stroke="#63251c" stroke-opacity=".6" stroke-width="2"/>
          <path d="m175 137 32 16m-16-40 28-13m188 38 20-10m-34 32 14-7" stroke="#62dfbc" stroke-width="3"/>
        </g>
        <path d="M102 153v116m396-116v116M300 248v117" stroke="#93b6e4" stroke-opacity=".45" stroke-dasharray="3 5"/>
      </g>
      <g stroke="#91a8c7" stroke-width="1.2">
        <path d="M236 68 190 44H71M120 217H60v64M429 268h105v-59"/>
        <path class="ml-cover-signal" d="M71 44h119l46 24M60 281v-64h60M429 268h105v-59" stroke="#cbff55" stroke-width="2" stroke-dasharray="7 85"/>
      </g>
      <g fill="#cbff55"><circle cx="71" cy="44" r="4"/><circle cx="60" cy="281" r="4"/><circle cx="534" cy="209" r="4"/></g>
      <g font-family="Manrope,Arial,sans-serif" font-size="12" font-weight="700" letter-spacing="1" fill="#d5e0f1">
        <text x="70" y="30">02 / GPU</text><text x="21" y="304">NETWORK</text><text x="482" y="195">K8S</text>
      </g>
      <text x="300" y="418" text-anchor="middle" font-family="Manrope,Arial,sans-serif" font-size="10" letter-spacing="3" fill="#8199bc">BUILD / CONNECT / OBSERVE / RECOVER</text>
    </svg>
    <div class="paper-foot"><span>ОТКРЫТЬ КАРТУ КЕЙСА</span><span class="ml-cover-arrow" aria-hidden="true">${icon('arrow-up-right')}</span></div></div>`;
  function cover(demo) {
    if(demo.cover==='mylab')return mylabCover();
    const campusVisual='<div class="campus-network" aria-hidden="true"><span class="campus-orbit"></span><div class="campus-node campus-node-track"><small>01 / PRODUCT</small><b>UniTrack</b><i></i><i></i><i></i></div><div class="campus-node campus-node-ai"><small>02 / EDUCATION</small><b>AI</b><span>KZ + RU</span></div><div class="campus-node campus-node-asr"><small>03 / RESEARCH</small><b>ASR</b><span>VOICE / TEXT</span></div></div>';
    const visual=personalVisuals[demo.cover]||(demo.cover==='campus'?campusVisual:'<div class="lab-grid" aria-hidden="true"></div>');
    return `<div class="paper-cover cover-${demo.cover}"><div class="paper-topline"><span>${demo.isPersonal?'PERSONAL PROJECT / PORTFOLIO':'SELECTED WORK / PORTFOLIO'}</span><span>${demo.number}</span></div><p class="paper-title" lang="en">${demo.coverTitle}</p><p class="paper-subtitle">${demo.subtitle}</p>${visual}<div class="paper-foot"><span>${demo.footer||'ПРОЕКТЫ · ИССЛЕДОВАНИЕ · СЕРТИФИКАТ'}</span><span class="paper-number">${demo.number}</span></div></div>`;
  }
  // External destinations always open in a new tab with the opener severed.
  const actionLink=demo=>`<a class="fm-action" href="${demo.href}"${demo.isPersonal?' target="_blank" rel="noopener noreferrer"':''}>${demo.action}<span aria-hidden="true">${icon('arrow-up-right')}</span></a>`;
  let lastFocus=null;
  // AgentF evidence: three unaltered match screenshots in the shared dialog.
  function openMatches(matchTrigger){
    if(typeof document==='undefined')return;
    const dialog=document.querySelector('.preview-dialog');
    if(!dialog)return;
    lastFocus=matchTrigger;
    document.querySelector('#preview-title').textContent='AgentF / Три победы над ботами';
    dialog.querySelector('.preview-toolbar p').textContent='SapaTech · AWS Agentic Football Cup · Победы в отдельных матчах / Individual match wins';
    dialog.classList.add('matches-preview');
    dialog.querySelector('.preview-document').innerHTML=agentMatches.map((match,index)=>
      '<figure class="match-evidence"><a href="'+match.file+'" target="_blank" rel="noopener noreferrer" aria-label="Открыть полный скриншот: SapaTech '+match.score+' '+match.opponent+'"><img src="'+match.file+'" width="'+match.width+'" height="'+match.height+'" alt="Скриншот победы SapaTech над '+match.opponent+', счёт '+match.score+'" loading="lazy"></a><figcaption><span>0'+(index+1)+' / SAPATECH</span><strong>'+match.score+'</strong><span>'+match.opponent+'</span></figcaption></figure>').join('');
    document.body.classList.add('preview-open');dialog.showModal();
  }
  if(typeof document!=='undefined'){
    const dialog=document.querySelector('.preview-dialog');
    if(dialog){
      dialog.querySelector('.preview-close').addEventListener('click',()=>dialog.close());
      dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
      dialog.addEventListener('close',()=>{document.body.classList.remove('preview-open');if(lastFocus&&!lastFocus.closest('[inert]'))lastFocus.focus({preventScroll:true});lastFocus=null;});
    }
  }
  const matchesButton='<button type="button" class="matches-trigger" data-matches>Три победы над ботами / Match wins</button>';
  window.portfolioProjects=Object.freeze({demos,agentMatches,cover,actionLink,openMatches,matchesButton});
})();
