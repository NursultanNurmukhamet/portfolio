(() => {
  'use strict';
  const icon=name=>typeof window.portfolioIcon==='function'?window.portfolioIcon(name):'';
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const quiet=()=>reduceMotion.matches||document.body.classList.contains('motion-paused');
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const storage={
    get(key,fallback){try{const value=localStorage.getItem(key);return value===null?fallback:JSON.parse(value);}catch{return fallback;}},
    set(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{/* Private mode: state lives only in this page. */}}
  };

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

  /* ---------- Toast ---------- */
  const toast=document.querySelector('#toast');
  let toastTimer=0;
  function showToast(html){
    toast.innerHTML=html;toast.classList.add('is-visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),3800);
  }

  /* ---------- Finds (local achievements) ---------- */
  const FLAGS=[
    {id:'terminal',title:'первая команда',text:'выполнить любую команду в терминале'},
    {id:'help',title:'справка',text:'открыть справку: клавиша ? или команда help'},
    {id:'deploy',title:'релиз',text:'выкатить релиз и справиться с инцидентом'},
    {id:'skills',title:'навыки',text:'посмотреть навыки вживую: команда top'},
    {id:'theme',title:'цвет',text:'сменить цвет терминала'},
    {id:'cluster',title:'стойка',text:'выбрать стойку в 3D-схеме'},
    {id:'details',title:'подробности',text:'раскрыть карточку системы или веху пути'},
    {id:'explorer',title:'проекты',text:'просмотреть все пять проектов'},
    {id:'cv',title:'резюме',text:'открыть резюме'},
    {id:'root',title:'секрет',text:'найти скрытую команду терминала'}
  ];
  const FLAG_STORE='portfolio:flags-v2',REWARD_STORE='portfolio:reward-v1';
  const known=new Set(FLAGS.map(flag=>flag.id));
  const captured=new Set((storage.get(FLAG_STORE,[])||[]).filter(id=>known.has(id)));
  let rewarded=Boolean(storage.get(REWARD_STORE,false));
  const flagButton=document.querySelector('#flags-button');
  function renderFlags(){
    document.querySelectorAll('.flag-count').forEach(node=>{node.textContent=String(captured.size);});
    document.querySelectorAll('.flag-total').forEach(node=>{node.textContent=String(FLAGS.length);});
    document.documentElement.classList.toggle('flags-complete',captured.size===FLAGS.length);
    document.querySelector('#flag-list').innerHTML=FLAGS.map(flag=>`<li class="${captured.has(flag.id)?'is-done':''}"><span><b>${flag.title}</b>${flag.text}</span></li>`).join('');
    document.querySelector('#flag-progress-bar').style.width=`${captured.size/FLAGS.length*100}%`;
    window.portfolioFlagState={count:captured.size,total:FLAGS.length};
    window.dispatchEvent(new CustomEvent('portfolio:flags',{detail:window.portfolioFlagState}));
    const lit=document.querySelector('#mon-lit b');
    if(lit)lit.textContent=String(Math.round(35+65*captured.size/FLAGS.length));
  }
  function capture(id){
    if(captured.has(id)||!known.has(id))return false;
    const flag=FLAGS.find(item=>item.id===id);
    captured.add(id);storage.set(FLAG_STORE,[...captured]);renderFlags();
    flagButton.classList.remove('is-bumped');void flagButton.offsetWidth;flagButton.classList.add('is-bumped');
    showToast(`<b>НАХОДКА ${captured.size}/${FLAGS.length}</b> ${flag.title}: ${flag.text}`);
    if(captured.size===FLAGS.length&&!rewarded)setTimeout(grantReward,900);
    return true;
  }
  function grantReward(){
    rewarded=true;storage.set(REWARD_STORE,true);
    setTheme('ice',false);
    printHtml('Все находки собраны. Открыт секретный цвет терминала <b>ice</b>. Спасибо, что изучили сайт так внимательно. Если хотите поработать вместе: <a href="assets/Nursultan-Nurmukhamet-CV.pdf">резюме</a> или <a href="#contact">форма обращения</a>.','ok');
    showToast('<b>ВСЕ НАХОДКИ СОБРАНЫ</b> Открыт секретный цвет ice. Он уже включён.');
  }
  document.querySelector('#flag-reset').addEventListener('click',()=>{
    captured.clear();rewarded=false;storage.set(FLAG_STORE,[]);storage.set(REWARD_STORE,false);viewed.clear();
    if(currentTheme==='ice')setTheme('lime',false);
    renderFlags();showToast('Находки сброшены.');
  });

  /* ---------- Colour themes ---------- */
  const THEMES={lime:'лайм',green:'зелёный фосфор',amber:'янтарь',ice:'ice (секретный)'};
  let currentTheme=storage.get('portfolio:theme-v1','lime');
  if(!(currentTheme in THEMES)||(currentTheme==='ice'&&!rewarded))currentTheme='lime';
  function setTheme(name,user=true){
    currentTheme=name;
    if(name==='lime')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=name;
    storage.set('portfolio:theme-v1',name);
    const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    window.dispatchEvent(new CustomEvent('portfolio:theme',{detail:{name,accent}}));
    if(user)capture('theme');
  }
  function nextTheme(){
    const order=['lime','green','amber',...(rewarded?['ice']:[])];
    return order[(order.indexOf(currentTheme)+1)%order.length];
  }
  setTheme(currentTheme,false);
  document.querySelector('#theme-button').addEventListener('click',()=>{const name=nextTheme();setTheme(name);showToast(`Цвет терминала: <b>${THEMES[name]}</b>`);});

  /* ---------- Help dialog ---------- */
  const help=document.querySelector('#help-dialog');
  function openHelp(){if(help.open)return;document.body.classList.add('help-open');help.showModal();capture('help');}
  help.querySelector('.help-close').addEventListener('click',()=>help.close());
  help.addEventListener('close',()=>document.body.classList.remove('help-open'));
  help.addEventListener('click',event=>{if(event.target===help)help.close();});
  flagButton.addEventListener('click',openHelp);

  /* ---------- Section tracking ---------- */
  const tabs=[...document.querySelectorAll('.tui-tabs a')];
  const sections=tabs.map(tab=>document.getElementById(tab.dataset.section)).filter(Boolean);
  let trackFrame=0,activeId='';
  function track(){
    trackFrame=0;
    const line=innerHeight/3;
    let current=sections[0];
    for(const section of sections)if(section.getBoundingClientRect().top<=line)current=section;
    if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)current=sections[sections.length-1];
    if(current.id!==activeId){activeId=current.id;tabs.forEach(tab=>tab.setAttribute('aria-current',String(tab.dataset.section===activeId)));}
  }
  const scheduleTrack=()=>{if(!trackFrame)trackFrame=requestAnimationFrame(track);};
  addEventListener('scroll',scheduleTrack,{passive:true});addEventListener('resize',scheduleTrack);
  track();
  const goto=id=>{const target=document.getElementById(id);if(target){target.scrollIntoView({behavior:quiet()?'instant':'smooth',block:'start'});return true;}return false;};

  /* ---------- Expandable details anywhere count as a find ---------- */
  document.addEventListener('toggle',event=>{
    const target=event.target;
    if(!(target instanceof HTMLDetailsElement))return;
    if(target.open&&(target.matches('.work-more')||target.matches('.git-msg')))capture('details');
    if(target.matches('.git-msg'))scheduleGraph();
  },true);

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
    workCount.textContent=`показано: ${shown}`;
  }
  filterButtons.forEach(button=>button.addEventListener('click',()=>applyFilter(button.dataset.filter)));

  /* ---------- Roadmap: a real branch graph drawn over the commit list ---------- */
  const gitWrap=document.querySelector('#git-wrap');
  const graph=document.querySelector('#git-graph');
  const commits=[...gitWrap.querySelectorAll('.git-commit')];
  // Rows are newest first. Each branch forks from an older main commit and
  // merges into a newer one.
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
  function scheduleGraph(){if(!graphFrame)graphFrame=requestAnimationFrame(drawGraph);}
  new ResizeObserver(scheduleGraph).observe(gitWrap);
  document.fonts?.ready?.then(scheduleGraph);
  document.querySelectorAll('.git-legend [data-lane]').forEach(button=>button.addEventListener('click',()=>{
    const lane=button.dataset.lane;
    if(offLanes.has(lane))offLanes.delete(lane);else offLanes.add(lane);
    button.setAttribute('aria-pressed',String(!offLanes.has(lane)));
    commits.forEach(commit=>commit.classList.toggle('is-off',offLanes.has(commit.dataset.lane)));
    scheduleGraph();
  }));

  /* ---------- File manager ---------- */
  const data=window.portfolioProjects;
  const list=document.querySelector('#fm-list');
  const view=document.querySelector('#fm-view');
  const viewed=new Set();
  let currentProject=0;
  if(data&&list&&view){
    const {demos}=data;
    list.innerHTML=demos.map((demo,index)=>`<button type="button" class="fm-item" role="tab" id="fm-tab-${demo.id}" aria-controls="fm-panel-${demo.id}" aria-selected="${index===0}" tabindex="${index===0?0:-1}" data-index="${index}"><span class="fm-perm">${escapeHtml(demo.perm)}</span><span class="fm-name">${escapeHtml(demo.file)}<small>${escapeHtml(demo.title)} <span aria-hidden="true">/</span> ${escapeHtml(demo.size)}</small></span><span class="fm-tag">${escapeHtml(demo.tag)}</span></button>`).join('');
    view.innerHTML=demos.map((demo,index)=>`<article class="fm-panel" role="tabpanel" id="fm-panel-${demo.id}" aria-labelledby="fm-tab-${demo.id}" tabindex="0"${index?' hidden':''}>
      <div class="fm-meta">
        <p class="fm-path">~/projects/<b>${escapeHtml(demo.file)}</b></p>
        <h3>${escapeHtml(demo.title)}</h3>
        <p class="fm-english" lang="en">${escapeHtml(demo.english)}</p>
        <span class="fm-kind">${escapeHtml(demo.subtitle)}</span>
        <p class="fm-copy">${escapeHtml(demo.ru)}</p>
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
      items[currentProject].scrollIntoView?.({block:'nearest',inline:'nearest'});
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
    view.addEventListener('click',event=>{const trigger=event.target.closest('[data-matches]');if(trigger)data.openMatches(trigger);});
    viewed.add(0);
    window.portfolioSelectProject=select;
  }

  /* ---------- CV ---------- */
  document.querySelectorAll('a[data-flag="cv"]').forEach(link=>link.addEventListener('click',()=>capture('cv')));

  /* ---------- 3D cluster racks ---------- */
  const RACKS=[
    '<b>Стойка 1: работа.</b> Семь внутренних систем Sapa Technologies: HR-портал, документооборот с электронной подписью, обучение, каталог с CRM, поддержка, бронирование и одна закрытая. <a href="#work">Смотреть системы</a>',
    '<b>Стойка 2: лаборатория MyLab.</b> Мои собственные серверы с видеокартами, Kubernetes, защищённая сеть и мониторинг. Здесь я пробую то, что потом приношу в работу. <a href="mylab.html">Открыть кейс</a>',
    '<b>Стойка 3: проекты.</b> AgentF, MetaCrypt, ULMusic и университетские работы, код открыт. <a href="#projects">Смотреть проекты</a>'
  ];
  const rackButtons=[...document.querySelectorAll('.rack-picker [data-rack]')];
  const rackInfo=document.querySelector('#rack-info');
  function showRack(index,fromScene){
    if(!(index in RACKS))return;
    rackInfo.innerHTML=RACKS[index];
    rackButtons.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.rack)===index)));
    if(!fromScene)window.dispatchEvent(new CustomEvent('portfolio:rack-select',{detail:{index}}));
    capture('cluster');
  }
  rackButtons.forEach(button=>button.addEventListener('click',()=>showRack(Number(button.dataset.rack),false)));
  addEventListener('portfolio:rack',event=>showRack(event.detail.index,true));

  /* ---------- Terminal ---------- */
  const terminal=document.querySelector('#terminal');
  const out=document.querySelector('#term-out');
  const input=document.querySelector('#term-input');
  const history=[];let historyIndex=0;
  const scrollOut=()=>{out.scrollTop=out.scrollHeight;};
  const append=node=>{out.append(node);scrollOut();return node;};
  const line=(kind='')=>{const node=document.createElement('p');node.className='term-line'+(kind?' term-'+kind:'');return node;};
  const print=(text,kind='')=>{const node=line(kind);node.textContent=text;return append(node);};
  const printHtml=(html,kind='')=>{const node=line(kind);node.innerHTML=html;return append(node);};
  const table=text=>{const node=document.createElement('pre');node.className='term-table';node.textContent=text;return append(node);};
  const link=(href,label,external=true)=>`<a href="${href}"${external?' target="_blank" rel="noopener noreferrer"':''}>${escapeHtml(label)}</a>`;
  const projectByName=name=>data?.demos.find(demo=>[demo.title,demo.file,demo.id,demo.cover].some(key=>String(key).toLowerCase().replace(/[^a-zа-яё0-9]/giu,'')===name));
  const pad=(value,size)=>String(value).padEnd(size);

  /* Mini-game: ship a release through the same pipeline as at work. */
  let deploying=false,deployRuns=0;
  function stageRow(title,hint){
    const row=document.createElement('div');row.className='term-stage';
    row.innerHTML=`<span>${escapeHtml(title)}<small>${escapeHtml(hint)}</small></span><span class="term-bar"><span></span></span><span class="term-stage-status">ждёт</span>`;
    return append(row);
  }
  async function fill(row){
    const bar=row.querySelector('.term-bar>span'),status=row.querySelector('.term-stage-status');
    status.textContent='идёт';
    if(quiet()){bar.style.width='100%';return;}
    const steps=8,delay=70+Math.random()*60;
    for(let step=1;step<=steps;step++){bar.style.width=`${step/steps*100}%`;await wait(delay);}
  }
  function choose(options){
    return new Promise(resolve=>{
      const box=document.createElement('div');box.className='term-choice';
      for(const option of options){
        const button=document.createElement('button');button.type='button';button.textContent=option.label;
        button.addEventListener('click',()=>{box.querySelectorAll('button').forEach(item=>{item.disabled=true;});resolve(option);});
        box.append(button);
      }
      append(box);box.querySelector('button').focus({preventScroll:true});
    });
  }
  async function deploy(){
    if(deploying){print('Релиз уже идёт, дождитесь окончания.','warn');return;}
    deploying=true;deployRuns++;
    const services=['HR-портал','документооборот','платформа обучения','служба поддержки','бронирование переговорных'];
    const service=services[Math.floor(Math.random()*services.length)];
    printHtml(`Выкатываю новую версию: <b>${escapeHtml(service)}</b>. Так выглядит обычный выпуск обновления у меня на работе.`);
    const stages=[['Сборка','собираю приложение из кода'],['Тесты','проверяю, что ничего не сломалось'],['Проверка уязвимостей','ищу известные дыры в библиотеках'],['Выкатка','новая версия заменяет старую без остановки']];
    const incident=deployRuns===1||Math.random()<.5;
    for(const [index,[title,hint]] of stages.entries()){
      const row=stageRow(title,hint);
      await fill(row);
      if(index===2&&incident){
        row.classList.add('is-failed');row.querySelector('.term-stage-status').textContent='стоп';
        print('Инцидент: проверка нашла уязвимую версию библиотеки. Что делаем?','warn');
        const options=[
          {label:'Обновить библиотеку и пересобрать',ok:true},
          {label:'Выкатить как есть',ok:false,why:'Так нельзя: уязвимость попала бы в рабочую систему.'},
          {label:'Отключить проверку',ok:false,why:'Проверку не отключают ради скорости: она и нужна, чтобы ловить такие случаи.'}
        ].sort(()=>Math.random()-.5);
        const answer=await choose(options);
        if(!answer.ok){print(`${answer.why} Релиз остановлен. Наберите deploy или нажмите кнопку, чтобы попробовать снова.`,'warn');deploying=false;return;}
        print('Верно. Обновляю библиотеку, пересобираю и проверяю ещё раз.','ok');
        row.classList.remove('is-failed');row.querySelector('.term-bar>span').style.width='0';
        await fill(row);
      }
      row.classList.add('is-done');row.querySelector('.term-stage-status').textContent='ок';
    }
    print('Готово: новая версия работает, пользователи ничего не заметили. Ни минуты простоя.','ok');
    capture('deploy');deploying=false;
  }

  /* A playful live "top" of skills. */
  let topTimer=0;
  function topSkills(){
    clearInterval(topTimer);
    const skills=[['Python',92],['PostgreSQL',86],['Linux',85],['Docker',83],['GitLab CI',82],['Безопасность',78],['Kubernetes',74],['Go',70],['TypeScript',60]];
    const node=table('');
    const render=()=>{
      node.textContent=['НАВЫК          УВЕРЕННОСТЬ',...skills.map(([name,base])=>{
        const value=Math.max(5,Math.min(99,base+(quiet()?0:Math.round((Math.random()-.5)*8))));
        const filled=Math.round(value/5);
        return `${pad(name,14)} [${'#'.repeat(filled)}${'.'.repeat(20-filled)}] ${value}`;
      })].join('\n');
      scrollOut();
    };
    render();
    print('Это шуточный монитор: столбики показывают, насколько уверенно я работаю с инструментом.','sys');
    if(!quiet()){let ticks=0;topTimer=setInterval(()=>{render();if(++ticks>=12)clearInterval(topTimer);},650);}
    capture('skills');
  }

  const commands={
    help(){
      printHtml('Команды, наберите и нажмите Enter: <b>whoami</b> кто я; <b>deploy</b> выкатить релиз; <b>top</b> навыки; <b>ls projects</b> проекты; <b>open mylab</b> открыть проект; <b>kubectl get pods</b> мои системы; <b>git log</b> путь; <b>theme</b> сменить цвет; <b>cat cv</b> резюме; <b>ping nursultan</b> написать; <b>uptime</b> стаж; <b>flags</b> находки; <b>clear</b> очистить. Ещё есть секретная команда.','info');
      capture('help');
    },
    whoami(){print('Нурсултан Нурмухамет. Делаю серверную часть и инфраструктуру: системы, которыми компания пользуется каждый день, и серверы под ними. Сейчас работаю в Sapa Technologies и учусь на 4 курсе КазНУ. Нажмите «Выкатить релиз», чтобы увидеть мою работу в миниатюре.');},
    pwd(){print('/home/nn/portfolio');},
    ls(argument){
      const target=(argument||'').replace(/^~?\/?/,'').replace(/\/$/,'');
      if(!target||target==='.'){print('about.sh  work/  projects/  roadmap  contact  links/');return;}
      if(target==='projects'&&data){table(data.demos.map(demo=>`${pad(demo.file,16)} ${pad(demo.perm,11)} ${demo.tag}`).join('\n'));printHtml('Открыть проект: <b>open mylab</b>, <b>open agentf</b> и так далее.','sys');return;}
      if(target==='work'){commands.kubectl('get pods');return;}
      if(target==='links'){printHtml([link('assets/Nursultan-Nurmukhamet-CV.pdf','резюме.pdf',false),link('https://github.com/NursultanNurmukhamet','github'),link('https://t.me/NurmukhametNursultan','telegram')].join('  '));return;}
      print(`ls: нет такого каталога: ${target}`,'warn');
    },
    cat(argument){
      const name=(argument||'').toLowerCase();
      if(/cv|resume|резюме/.test(name)){printHtml('Резюме: '+link('assets/Nursultan-Nurmukhamet-CV.pdf','Nursultan-Nurmukhamet-CV.pdf',false));capture('cv');return;}
      print(`cat: ${argument||''}: файл не найден. Попробуйте cat cv`,'warn');
    },
    open(argument){
      const name=(argument||'').toLowerCase().replace(/[^a-zа-яё0-9]/giu,'');
      if(!name){print('open: укажите проект, например open mylab','warn');return;}
      if(name==='cv'){commands.cat('cv');return;}
      const demo=projectByName(name);
      if(!demo){print(`open: проект ${argument} не найден. Список: ls projects`,'warn');return;}
      window.portfolioSelectProject?.(data.demos.indexOf(demo));goto('projects');
      printHtml(`${escapeHtml(demo.title)}: ${link(demo.href,demo.href,Boolean(demo.isPersonal))}`,'ok');
    },
    goto(argument){
      const map={about:'top',top:'top',work:'work',projects:'projects',roadmap:'roadmap',contact:'contact','1':'top','2':'work','3':'projects','4':'roadmap','5':'contact'};
      const id=map[(argument||'').toLowerCase()];
      if(id&&goto(id))print(`перехожу к разделу #${id}`,'ok');else print('goto: разделы about, work, projects, roadmap, contact','warn');
    },
    kubectl(argument){
      if(!/get\s+(pods|systems|po)/.test(argument||'')){print('Попробуйте: kubectl get pods','warn');return;}
      table(['NAME                 READY  STATUS','hr-portal            1/1    Running','edo-sign             1/1    Running','learning-platform    1/1    Running','auto-catalog-crm     1/1    Running','support-desk         1/1    Running','room-booking         1/1    Running','internal-07          1/1    Running (описание закрыто)'].join('\n'));
      printHtml('Это семь моих систем в Sapa Technologies, все работают. Подробности в разделе <a href="#work">Работа</a>.','sys');
    },
    git(argument){
      if(!/^log/.test(argument||'')){print('Попробуйте: git log','warn');return;}
      table(commits.map(commit=>`${pad(commit.querySelector('.git-hash').textContent,8)} ${commit.querySelector('summary b').textContent}`).join('\n'));
      printHtml('Граф веток с подробностями в разделе <a href="#roadmap">Путь</a>.','sys');
    },
    theme(argument){
      const name=(argument||'').toLowerCase().trim();
      if(!name){const next=nextTheme();setTheme(next);printHtml(`Цвет терминала: <b>${THEMES[next]}</b>. Доступно: theme lime, green, amber.`,'ok');return;}
      if(!(name in THEMES)){print('theme: доступны lime, green, amber','warn');return;}
      if(name==='ice'&&!rewarded){print('Этот цвет секретный: он откроется, когда вы соберёте все находки.','warn');return;}
      setTheme(name);printHtml(`Цвет терминала: <b>${THEMES[name]}</b>`,'ok');
    },
    ping(argument){
      if(!argument||!/nursultan|nn|нурсултан/i.test(argument)){print('ping: попробуйте ping nursultan','warn');return;}
      print('PING nursultan: на связи. Открываю форму обращения.','ok');goto('contact');
    },
    deploy,top:topSkills,htop:topSkills,
    neofetch(){
      table(['nn@sapa','-------','Роль: серверная разработка и инфраструктура','Работа: Sapa Technologies, с июля 2025','Учёба: КазНУ, факультет ИТ и ИИ, 4 курс','Лаборатория: свои серверы, Kubernetes, GPU','Безопасность: ЭЦП, единый вход, второй фактор','Языки: Python, Go, TypeScript, SQL'].join('\n'));
    },
    uptime(){
      const days=Math.max(0,Math.floor((Date.now()-new Date(2025,6,24))/864e5));
      print(`В Sapa Technologies уже ${days} дн.: с 24.07.2025 по договору, с 10.08.2026 в штате, без перерывов.`);
    },
    flags(){print(`Находки: ${captured.size}/${FLAGS.length}. ${FLAGS.map(flag=>(captured.has(flag.id)?'[x] ':'[ ] ')+flag.title).join('  ')}`,'info');},
    date(){print(new Date().toLocaleString('ru-RU'));},
    clear(){out.replaceChildren();},
    echo(argument){print(argument||'');},
    sudo(){print('nn is not in the sudoers file. This incident will be reported. Шучу: вы нашли секретную команду.','warn');capture('root');},
    rm(){print('rm: отказано в доступе. Это портфолио, а не рабочий сервер. Но секрет вы нашли.','warn');capture('root');},
    vim(){print('Вы вошли в vim и даже вышли из него. Это достижение.','ok');capture('root');},
    exit(){print('Это сайт, вкладку закрывать не обязательно.','info');},
    uname(){print('Linux mylab 6.x x86_64 GNU/Linux');},
    hostname(){print('sapa');}
  };
  Object.assign(commands,{vi:commands.vim,nano:commands.vim,man:commands.help,'?':commands.help,cd:commands.goto,work(){commands.goto('work');},projects(){commands.goto('projects');},roadmap(){commands.goto('roadmap');},contact(){commands.goto('contact');}});
  let autoTyping=0;
  function run(raw,{auto=false}={}){
    const trimmed=String(raw).trim();
    if(!trimmed)return;
    print(trimmed,'cmd');
    if(!auto){history.push(trimmed);historyIndex=history.length;}
    const [name,...rest]=trimmed.split(/\s+/);
    const command=commands[name.toLowerCase()];
    if(command){command(rest.join(' '));if(!auto)capture('terminal');}
    else print(`Команда ${name} не найдена. Нажмите «Все команды» или наберите help.`,'warn');
    scrollOut();
  }
  const stopAuto=()=>{clearTimeout(autoTyping);autoTyping=0;};
  terminal.addEventListener('submit',event=>{event.preventDefault();stopAuto();run(input.value);input.value='';});
  terminal.querySelectorAll('.term-chips [data-cmd]').forEach(button=>button.addEventListener('click',()=>{stopAuto();input.value='';run(button.dataset.cmd);}));
  input.addEventListener('keydown',event=>{
    stopAuto();
    if(event.key==='ArrowUp'&&history.length){event.preventDefault();historyIndex=Math.max(0,historyIndex-1);input.value=history[historyIndex];}
    else if(event.key==='ArrowDown'){event.preventDefault();historyIndex=Math.min(history.length,historyIndex+1);input.value=history[historyIndex]||'';}
    else if(event.key==='Tab'&&input.value){
      const match=Object.keys(commands).find(key=>key.startsWith(input.value.toLowerCase()));
      if(match){event.preventDefault();input.value=match+' ';}
    }
  });
  // Greet once by typing "whoami" visibly, without taking focus.
  function autoType(text){
    if(quiet()||document.documentElement.classList.contains('intro-pending')){run(text,{auto:true});return;}
    let index=0;
    const step=()=>{
      if(!autoTyping&&index)return;
      input.value=text.slice(0,++index);
      if(index<text.length)autoTyping=setTimeout(step,85);
      else autoTyping=setTimeout(()=>{autoTyping=0;input.value='';run(text,{auto:true});},260);
    };
    autoTyping=setTimeout(step,700);
  }
  const startGreeting=()=>{if(scrollY<innerHeight*.5)autoType('whoami');};
  if(document.documentElement.classList.contains('intro-pending')||document.documentElement.classList.contains('intro-running')){
    addEventListener('portfolio:intro',function onIntro(event){if(!event.detail.active){removeEventListener('portfolio:intro',onIntro);startGreeting();}});
  }else startGreeting();

  /* ---------- Global keyboard shortcuts ---------- */
  const editable=target=>target instanceof HTMLElement&&target.closest('input,textarea,select,[contenteditable=true]');
  document.addEventListener('keydown',event=>{
    if(event.defaultPrevented||event.ctrlKey||event.metaKey||event.altKey)return;
    if(document.querySelector('dialog[open]'))return;
    if(editable(event.target))return;
    const section={'1':'top','2':'work','3':'projects','4':'roadmap','5':'contact'}[event.key];
    if(section){event.preventDefault();goto(section);return;}
    if(event.key==='/'){event.preventDefault();stopAuto();goto('top');input.focus({preventScroll:true});return;}
    if(event.key==='?'){event.preventDefault();openHelp();return;}
    if((event.key==='j'||event.key==='k')&&list){event.preventDefault();window.portfolioSelectProject?.(currentProject+(event.key==='j'?1:-1),true);}
  });

  renderFlags();
})();
