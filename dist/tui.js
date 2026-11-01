(() => {
  'use strict';
  const icon=name=>typeof window.portfolioIcon==='function'?window.portfolioIcon(name):'';
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const quiet=()=>reduceMotion.matches||document.body.classList.contains('motion-paused');
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  /* ---------- Motion toggle (same contract the loader listens to) ---------- */
  const toggle=document.querySelector('.motion-toggle');
  let motionPaused=reduceMotion.matches;
  function applyMotion(){
    document.body.classList.toggle('motion-paused',motionPaused);
    toggle.setAttribute('aria-pressed',String(motionPaused));
    const label=motionPaused?'Включить анимацию':'Приостановить анимацию';
    toggle.setAttribute('aria-label',label);toggle.title=label;
    toggle.innerHTML=icon(motionPaused?'play':'pause');
    window.dispatchEvent(new CustomEvent('portfolio:motion',{detail:{paused:motionPaused}}));
  }
  toggle.addEventListener('click',()=>{motionPaused=!motionPaused;applyMotion();});
  reduceMotion.addEventListener('change',event=>{motionPaused=event.matches;applyMotion();});
  applyMotion();

  /* ---------- Clock ---------- */
  const clock=document.querySelector('#tui-clock');
  function tick(){
    const now=new Date();
    clock.textContent=[now.getHours(),now.getMinutes(),now.getSeconds()].map(part=>String(part).padStart(2,'0')).join(':');
  }
  tick();setInterval(tick,1000);

  /* ---------- Flags (local achievements) ---------- */
  const FLAGS=[
    {id:'help',title:'справка',text:'открыть справку клавишей ? или командой help'},
    {id:'terminal',title:'терминал',text:'выполнить любую команду в игровом терминале'},
    {id:'sections',title:'экскурсия',text:'пролистать все пять разделов сайта'},
    {id:'explorer',title:'проекты',text:'просмотреть все пять проектов'},
    {id:'evidence',title:'доказательства',text:'открыть скриншоты побед AgentF'},
    {id:'cv',title:'резюме',text:'открыть резюме (CV)'},
    {id:'root',title:'секрет',text:'найти скрытую команду терминала'}
  ];
  const STORE='portfolio:flags-v1';
  const toast=document.querySelector('#toast');
  let toastTimer=0;
  function loadFlags(){try{const raw=JSON.parse(localStorage.getItem(STORE)||'[]');return new Set(Array.isArray(raw)?raw.filter(id=>FLAGS.some(flag=>flag.id===id)):[]);}catch{return new Set();}}
  const captured=loadFlags();
  function saveFlags(){try{localStorage.setItem(STORE,JSON.stringify([...captured]));}catch{/* Private mode: progress lives only in this page. */}}
  function renderFlags(){
    document.querySelectorAll('.flag-count').forEach(node=>{node.textContent=String(captured.size);});
    document.documentElement.classList.toggle('flags-complete',captured.size===FLAGS.length);
    const list=document.querySelector('#flag-list');
    list.innerHTML=FLAGS.map(flag=>`<li class="${captured.has(flag.id)?'is-done':''}"><b>${flag.title}</b>${flag.text}</li>`).join('');
  }
  function showToast(html){
    toast.innerHTML=html;toast.classList.add('is-visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),3600);
  }
  function capture(id){
    if(captured.has(id))return false;
    const flag=FLAGS.find(item=>item.id===id);
    if(!flag)return false;
    captured.add(id);saveFlags();renderFlags();
    showToast(`<b>НАХОДКА ${captured.size}/${FLAGS.length}</b> ${flag.title}: ${flag.text}${captured.size===FLAGS.length?' Все находки собраны.':''}`);
    return true;
  }
  document.querySelector('#flag-reset').addEventListener('click',()=>{captured.clear();saveFlags();renderFlags();visited.clear();viewed.clear();showToast('Находки сброшены.');});
  renderFlags();

  /* ---------- Help dialog ---------- */
  const help=document.querySelector('#help-dialog');
  function openHelp(){if(help.open)return;document.body.classList.add('help-open');help.showModal();capture('help');}
  help.querySelector('.help-close').addEventListener('click',()=>help.close());
  help.addEventListener('close',()=>document.body.classList.remove('help-open'));
  help.addEventListener('click',event=>{if(event.target===help)help.close();});
  document.querySelector('#flags-button').addEventListener('click',openHelp);

  /* ---------- Section tracking ---------- */
  const tabs=[...document.querySelectorAll('.tui-tabs a')];
  const sections=tabs.map(tab=>document.getElementById(tab.dataset.section)).filter(Boolean);
  const visited=new Set();
  // The active tab is the last section whose top has passed a third of the
  // viewport; at the very bottom of the page the last section wins.
  let trackFrame=0,activeId='';
  function track(){
    trackFrame=0;
    const line=innerHeight/3;
    let current=sections[0];
    for(const section of sections){
      const box=section.getBoundingClientRect();
      if(box.top<=line)current=section;
      if(box.top<innerHeight&&box.bottom>0)visited.add(section.id);
    }
    if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)current=sections[sections.length-1];
    if(current.id!==activeId){activeId=current.id;tabs.forEach(tab=>tab.setAttribute('aria-current',String(tab.dataset.section===activeId)));}
    if(visited.size===sections.length)capture('sections');
  }
  const scheduleTrack=()=>{if(!trackFrame)trackFrame=requestAnimationFrame(track);};
  addEventListener('scroll',scheduleTrack,{passive:true});addEventListener('resize',scheduleTrack);
  track();

  /* ---------- File manager ---------- */
  const data=window.portfolioProjects;
  const list=document.querySelector('#fm-list');
  const view=document.querySelector('#fm-view');
  const viewed=new Set();
  let currentProject=0;
  if(data&&list&&view){
    const {demos}=data;
    list.innerHTML=demos.map((demo,index)=>`<button type="button" class="fm-item" role="tab" id="fm-tab-${demo.id}" aria-controls="fm-panel-${demo.id}" aria-selected="${index===0}" tabindex="${index===0?0:-1}" data-index="${index}"><span class="fm-perm">${demo.perm}</span><span class="fm-name">${escapeHtml(demo.file)}<small>${escapeHtml(demo.title)} <span aria-hidden="true">/</span> ${escapeHtml(demo.size)}</small></span><span class="fm-tag">${escapeHtml(demo.tag)}</span></button>`).join('');
    view.innerHTML=demos.map((demo,index)=>`<article class="fm-panel" role="tabpanel" id="fm-panel-${demo.id}" aria-labelledby="fm-tab-${demo.id}" tabindex="0"${index?' hidden':''}>
      <div class="fm-meta">
        <p class="fm-path">~/projects/<b>${escapeHtml(demo.file)}</b> <span aria-hidden="true">/</span> ${demo.isPersonal?'personal':'case'} ${demo.number}</p>
        <h3>${escapeHtml(demo.title)}</h3>
        <p class="fm-english" lang="en">${escapeHtml(demo.english)}</p>
        <span class="fm-kind">${escapeHtml(demo.kind)} <span aria-hidden="true">/</span> ${escapeHtml(demo.subtitle)}</span>
        <div class="fm-copy"><div lang="ru"><span>RU</span><p>${escapeHtml(demo.ru)}</p></div><div lang="en"><span>EN</span><p>${escapeHtml(demo.en)}</p></div></div>
        <div class="fm-actions">${data.actionLink(demo)}${demo.cover==='agentf'?data.matchesButton:''}</div>
      </div>
      <figure class="fm-cover">${data.cover(demo)}<figcaption>${escapeHtml(demo.caption)}</figcaption></figure>
    </article>`).join('');
    const items=[...list.querySelectorAll('.fm-item')];
    const panels=[...view.querySelectorAll('.fm-panel')];
    function select(index,focus=false){
      currentProject=(index+demos.length)%demos.length;
      items.forEach((item,i)=>{const on=i===currentProject;item.setAttribute('aria-selected',String(on));item.tabIndex=on?0:-1;});
      panels.forEach((panel,i)=>{panel.hidden=i!==currentProject;});
      if(focus)items[currentProject].focus({preventScroll:true});
      viewed.add(currentProject);
      if(viewed.size===demos.length)capture('explorer');
    }
    list.addEventListener('click',event=>{const item=event.target.closest('.fm-item');if(item)select(Number(item.dataset.index));});
    list.addEventListener('keydown',event=>{
      const map={ArrowDown:1,ArrowRight:1,j:1,ArrowUp:-1,ArrowLeft:-1,k:-1};
      if(event.key in map){event.preventDefault();select(currentProject+map[event.key],true);}
      else if(event.key==='Home'){event.preventDefault();select(0,true);}
      else if(event.key==='End'){event.preventDefault();select(demos.length-1,true);}
      else if(event.key==='Enter'){const link=panels[currentProject].querySelector('.fm-action');if(link){event.preventDefault();link.click();}}
    });
    view.addEventListener('click',event=>{
      const trigger=event.target.closest('[data-matches]');
      if(trigger){data.openMatches(trigger);capture('evidence');}
    });
    viewed.add(0);
    window.portfolioSelectProject=select;
  }

  /* ---------- CV flag ---------- */
  document.querySelectorAll('a[data-flag="cv"]').forEach(link=>link.addEventListener('click',()=>capture('cv')));

  /* ---------- Terminal ---------- */
  const terminal=document.querySelector('#terminal');
  const out=document.querySelector('#term-out');
  const input=document.querySelector('#term-input');
  const history=[];let historyIndex=0;
  const print=(text,kind='')=>{const line=document.createElement('p');line.className='term-line'+(kind?' term-'+kind:'');line.textContent=text;out.append(line);};
  const printHtml=(html,kind='')=>{const line=document.createElement('p');line.className='term-line'+(kind?' term-'+kind:'');line.innerHTML=html;out.append(line);};
  const link=(href,label,external=true)=>`<a href="${href}"${external?' target="_blank" rel="noopener noreferrer"':''}>${escapeHtml(label)}</a>`;
  const projectByName=name=>data?.demos.find(demo=>[demo.title,demo.file,demo.id,demo.cover].some(key=>String(key).toLowerCase().replace(/[^a-zа-яё0-9]/giu,'')===name));
  const goto=id=>{const target=document.getElementById(id);if(target){target.scrollIntoView({behavior:quiet()?'instant':'smooth',block:'start'});return true;}return false;};
  const commands={
    help(){
      printHtml('Команды (наберите и нажмите Enter): <b>whoami</b> кто я; <b>ls projects</b> список проектов; <b>open mylab</b> открыть проект; <b>cat cv</b> резюме; <b>neofetch</b> кратко обо мне; <b>uptime</b> стаж; <b>flags</b> находки; <b>goto work</b> перейти к разделу; <b>clear</b> очистить. Клавиши: 1-5 разделы, / терминал, ? справка. Где-то спрятана секретная команда.','info');
      capture('help');
    },
    whoami(){print('Нурсултан Нурмухамет: Backend / Infrastructure Engineer, Sapa Technologies. 7 production-систем, Kubernetes-лаборатория, ЭЦП и SSO.');},
    pwd(){print('/home/nn/portfolio');},
    ls(argument){
      const target=(argument||'').replace(/^~?\/?/,'').replace(/\/$/,'');
      if(!target||target==='.'){print('about.sh  work/  projects/  roadmap  contact  links/');return;}
      if(target==='projects'&&data){printHtml(data.demos.map(demo=>`${demo.perm}  ${escapeHtml(demo.file.padEnd(16))} ${escapeHtml(demo.tag)}`).join('\n'));return;}
      if(target==='work'){print(['01 hr-portal','02 edo-sign','03 learning-platform','04 auto-catalog-crm','05 support-desk','06 room-booking','07 (внутренняя система, без описания)'].join('\n'));return;}
      if(target==='links'){printHtml([link('assets/Nursultan-Nurmukhamet-CV.pdf','cv.pdf',false),link('https://github.com/NursultanNurmukhamet','github'),link('https://t.me/NurmukhametNursultan','telegram')].join('  '));return;}
      print(`ls: нет доступа к ${target}: такого каталога нет`,'warn');
    },
    cat(argument){
      const name=(argument||'').toLowerCase();
      if(name.includes('cv')||name.includes('resume')){printHtml('CV: '+link('assets/Nursultan-Nurmukhamet-CV.pdf','Nursultan-Nurmukhamet-CV.pdf',false));capture('cv');return;}
      if(name.includes('fact')){print('7 production-систем в Sapa Technologies\nKubernetes-лаборатория с GPU\nЭЦП и SSO в production');return;}
      print(`cat: ${argument||''}: файл не найден. Попробуйте cat cv`,'warn');
    },
    open(argument){
      const name=(argument||'').toLowerCase().replace(/[^a-zа-яё0-9]/giu,'');
      if(!name){print('open: укажите проект, например open mylab','warn');return;}
      if(name==='cv'){commands.cat('cv');return;}
      const demo=projectByName(name);
      if(!demo){print(`open: проект ${argument} не найден. Список: ls projects`,'warn');return;}
      const index=data.demos.indexOf(demo);
      window.portfolioSelectProject?.(index);goto('projects');
      printHtml(`${escapeHtml(demo.title)}: ${link(demo.href,demo.href,demo.isPersonal)}`,'ok');
    },
    goto(argument){
      const map={about:'top',top:'top',work:'work',projects:'projects',roadmap:'roadmap',contact:'contact','1':'top','2':'work','3':'projects','4':'roadmap','5':'contact'};
      const id=map[(argument||'').toLowerCase()];
      if(id&&goto(id))print(`перехожу: #${id}`,'ok');else print('goto: разделы about, work, projects, roadmap, contact','warn');
    },
    work(){goto('work');print('перехожу: #work','ok');},
    projects(){goto('projects');print('перехожу: #projects','ok');},
    roadmap(){goto('roadmap');print('перехожу: #roadmap','ok');},
    contact(){goto('contact');print('перехожу: #contact','ok');},
    neofetch(){
      print(['nn@sapa','---------','Роль: Backend / Infrastructure Engineer, серверная разработка и инфраструктура','Работа: Sapa Technologies, с июля 2025','Учёба: КазНУ, факультет ИТ и ИИ, 4 курс','Лаборатория: свои серверы, Kubernetes, GPU, защищённая сеть, мониторинг','Безопасность: электронная подпись (ЭЦП), единый вход (SSO), двухфакторный вход','Языки: Python, Go, TypeScript, SQL'].join('\n'),'info');
    },
    uptime(){
      const start=new Date(2025,6,24);const days=Math.max(0,Math.floor((Date.now()-start)/864e5));
      print(`В Sapa Technologies уже ${days} дн.: с 24.07.2025 по договору, с 10.08.2026 в штате, без перерывов. Семь систем работают.`);
    },
    date(){print(new Date().toString());},
    flags(){print(`Находки: ${captured.size}/${FLAGS.length}. ${FLAGS.map(flag=>(captured.has(flag.id)?'[x] ':'[ ] ')+flag.title).join('  ')}`,'info');},
    clear(){out.replaceChildren();},
    echo(argument){print(argument||'');},
    sudo(){print('nn is not in the sudoers file. This incident will be reported.','warn');capture('root');},
    rm(){print('rm: отказано в доступе. Это портфолио, не production.','warn');capture('root');},
    vim(){print(':q! найден выход из vim. Поздравляю.','ok');capture('root');},
    exit(){print('logout: это сайт, вкладку закрывать не обязательно.','info');},
    uname(){print('Linux mylab 6.x #portfolio SMP x86_64 GNU/Linux');}
  };
  commands.vi=commands.vim;commands.nano=commands.vim;commands['?']=commands.help;commands.man=commands.help;commands.cd=commands.goto;commands.hostname=()=>print('sapa');
  function run(raw){
    const trimmed=raw.trim();
    if(!trimmed)return;
    print(trimmed,'cmd');
    history.push(trimmed);historyIndex=history.length;
    const [name,...rest]=trimmed.split(/\s+/);
    const command=commands[name.toLowerCase()];
    if(command){command(rest.join(' '));capture('terminal');}
    else print(`bash: ${name}: команда не найдена. Введите help`,'warn');
    out.scrollTop=out.scrollHeight;
  }
  terminal.addEventListener('submit',event=>{event.preventDefault();run(input.value);input.value='';});
  input.addEventListener('keydown',event=>{
    if(event.key==='ArrowUp'&&history.length){event.preventDefault();historyIndex=Math.max(0,historyIndex-1);input.value=history[historyIndex];}
    else if(event.key==='ArrowDown'){event.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);input.value=history[historyIndex]||'';}
    else if(event.key==='Tab'&&input.value){
      const match=Object.keys(commands).find(key=>key.startsWith(input.value.toLowerCase()));
      if(match){event.preventDefault();input.value=match+' ';}
    }
  });

  /* ---------- Global keyboard shortcuts ---------- */
  const editable=target=>target instanceof HTMLElement&&(target.closest('input,textarea,select,[contenteditable=true]'));
  document.addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey)return;
    if(document.querySelector('dialog[open]'))return;
    if(editable(event.target))return;
    const section={'1':'top','2':'work','3':'projects','4':'roadmap','5':'contact'}[event.key];
    if(section){event.preventDefault();goto(section);return;}
    if(event.key==='/'){event.preventDefault();goto('top');input.focus({preventScroll:false});return;}
    if(event.key==='?'){event.preventDefault();openHelp();return;}
    if((event.key==='j'||event.key==='k')&&list){event.preventDefault();window.portfolioSelectProject?.(currentProject+(event.key==='j'?1:-1),true);}
  });

})();
