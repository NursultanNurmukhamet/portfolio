(() => {
  'use strict';
  // Inventory page: category tabs, search, item cards and a detail window with
  // previous/next navigation. Deep links use #item=<id>; nothing is stored or sent.
  const icon=name=>typeof window.portfolioIcon==='function'?window.portfolioIcon(name):'';
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const data=window.portfolioInventory;
  const gallery=window.portfolioProjects;

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

  if(!data)return;
  const {CATEGORIES,ITEMS}=data;
  const grid=document.querySelector('#inventory-grid');
  const tabsRoot=document.querySelector('#inventory-tabs');
  const hint=document.querySelector('#inventory-hint');
  const empty=document.querySelector('#inventory-empty');
  const search=document.querySelector('#inventory-search');
  const byId=new Map(ITEMS.map(item=>[item.id,item]));
  const categoryLabel=id=>CATEGORIES.find(category=>category.id===id)?.label||'';
  let category='all',query='',visible=[];

  /* ---------- Pictures: photo, cover from gallery.js or a text tile ---------- */
  function media(item,large=false){
    if(item.image){
      const {src,alt,w,h}=item.image;
      return `<img src="${src}" alt="${escapeHtml(alt||'')}" width="${w}" height="${h}" loading="${large?'eager':'lazy'}" decoding="async">`;
    }
    if(item.cover&&gallery){
      const demo=gallery.demos.find(demo=>demo.cover===item.cover);
      if(demo)return gallery.cover(demo);
    }
    const tile=item.tile||{glyph:'?',label:''};
    // A text tile carries the item's first tags so a card without a photo still says something.
    const spec=(item.tags||[]).slice(0,3).map(escapeHtml).join(' <i aria-hidden="true"></i> ');
    return `<div class="item-tile item-tile-${item.cat}" aria-hidden="true"><span>${escapeHtml(tile.label)}</span><b>${escapeHtml(tile.glyph)}</b>${spec?`<em>${spec}</em>`:''}</div>`;
  }
  const hasPicture=item=>Boolean(item.image||(item.cover&&gallery&&gallery.demos.some(demo=>demo.cover===item.cover)));

  /* ---------- Shelf counters in the hero: count up once they are on screen ---------- */
  for(const node of document.querySelectorAll('[data-count]')){
    const total=ITEMS.filter(item=>item.cat===node.dataset.count).length;
    node.textContent=String(total);
    if(reduceMotion.matches||!('IntersectionObserver' in window))continue;
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      observer.disconnect();
      const started=performance.now(),duration=700;
      const tick=now=>{
        const progress=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-progress,3);
        node.textContent=String(Math.round(total*eased));
        if(progress<1)requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    },{threshold:.6});
    observer.observe(node);
  }
  document.querySelectorAll('[data-shelf]').forEach(link=>link.addEventListener('click',()=>{setCategory(link.dataset.shelf);}));

  /* ---------- Tabs ---------- */
  function renderTabs(){
    tabsRoot.innerHTML=CATEGORIES.map(item=>{
      const count=item.id==='all'?ITEMS.length:ITEMS.filter(entry=>entry.cat===item.id).length;
      return `<button type="button" role="tab" data-category="${item.id}" aria-selected="${item.id===category}"${item.id===category?'':' tabindex="-1"'}>${escapeHtml(item.label)}<i>${count}</i></button>`;
    }).join('');
  }
  tabsRoot.addEventListener('click',event=>{const button=event.target.closest('[data-category]');if(button)setCategory(button.dataset.category);});
  tabsRoot.addEventListener('keydown',event=>{
    const buttons=[...tabsRoot.querySelectorAll('[data-category]')];
    const index=buttons.indexOf(document.activeElement);
    if(index<0)return;
    const delta=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;
    if(!delta)return;
    event.preventDefault();
    const next=buttons[(index+delta+buttons.length)%buttons.length];
    setCategory(next.dataset.category);next.focus();
  });
  function setCategory(id){
    category=CATEGORIES.some(item=>item.id===id)?id:'all';
    renderTabs();renderGrid();
  }

  /* ---------- Grid ---------- */
  function matches(item){
    if(category!=='all'&&item.cat!==category)return false;
    if(!query)return true;
    const haystack=[item.title,item.short,...(item.tags||[]),...(item.long||[]),...(item.meta||[]).flat()].join(' ').toLowerCase();
    return query.split(/\s+/).every(word=>haystack.includes(word));
  }
  function renderGrid(){
    visible=ITEMS.filter(matches);
    const current=CATEGORIES.find(item=>item.id===category);
    const plural=(count,one,few,many)=>{const n=count%100,m=count%10;return n>=11&&n<=19?many:m===1?one:m>=2&&m<=4?few:many;};
    hint.textContent=query
      ?(visible.length?`${visible.length} ${plural(visible.length,'предмет','предмета','предметов')} по запросу «${search.value.trim()}»${category!=='all'?` на полке «${current.label}»`:''}.`:'')
      :(current?.hint||`${ITEMS.length} предметов на пяти полках. Нажмите на любой, чтобы посмотреть подробнее.`);
    grid.innerHTML=visible.map((item,index)=>`<li class="item-card"><button type="button" data-item="${item.id}" style="--delay:${Math.min(index,12)*40}ms" aria-haspopup="dialog">
      <div class="item-media">${media(item)}<span class="item-badge">${escapeHtml(categoryLabel(item.cat))}</span></div>
      <div class="item-body"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.short)}</p>
      ${item.tags?.length?`<div class="item-tags">${item.tags.slice(0,4).map(tag=>`<span>${escapeHtml(tag)}</span>`).join('')}</div>`:''}
      <span class="item-more">Подробнее ${icon('arrow-up-right')}</span></div></button></li>`).join('');
    empty.hidden=visible.length>0;
    if(window.portfolioShell)requestAnimationFrame(()=>window.portfolioShell.revealAll());
  }
  grid.addEventListener('click',event=>{const button=event.target.closest('[data-item]');if(button)openItem(button.dataset.item,button);});
  // A soft spotlight follows the mouse over a card; touch and reduced motion get the plain card.
  grid.addEventListener('pointermove',event=>{
    if(event.pointerType!=='mouse'||reduceMotion.matches)return;
    const button=event.target.closest('[data-item]');
    if(!button)return;
    const box=button.getBoundingClientRect();
    button.style.setProperty('--mx',`${event.clientX-box.left}px`);
    button.style.setProperty('--my',`${event.clientY-box.top}px`);
  });
  search.addEventListener('input',()=>{query=search.value.trim().toLowerCase();renderGrid();});
  search.addEventListener('keydown',event=>{if(event.key==='Escape'&&search.value){event.preventDefault();search.value='';query='';renderGrid();}});

  /* ---------- Detail window ---------- */
  const dialog=document.querySelector('#item-dialog');
  const parts={cat:document.querySelector('#item-cat'),pos:document.querySelector('#item-pos'),mediaBox:document.querySelector('#item-media'),title:document.querySelector('#item-title'),short:document.querySelector('#item-short'),long:document.querySelector('#item-long'),meta:document.querySelector('#item-meta'),links:document.querySelector('#item-links'),tags:document.querySelector('#item-tags')};
  const prev=document.querySelector('#item-prev'),next=document.querySelector('#item-next');
  const body=dialog.querySelector('.item-dialog-body');
  let opened=null,lastFocus=null,pushed=false,switchTimer=0;
  function fill(item){
    opened=item;
    const list=visible.includes(item)?visible:ITEMS;
    const index=list.indexOf(item);
    // Switching between items fades the body briefly so the change reads as one motion.
    if(dialog.open&&!reduceMotion.matches){
      body.classList.add('is-switching');
      clearTimeout(switchTimer);
      switchTimer=setTimeout(()=>body.classList.remove('is-switching'),160);
    }
    dialog.classList.toggle('item-dialog-tile',!hasPicture(item));
    parts.cat.textContent=categoryLabel(item.cat);
    parts.pos.textContent=`${index+1} / ${list.length}`;
    prev.disabled=index<=0;next.disabled=index>=list.length-1;
    parts.mediaBox.innerHTML=media(item,true);
    parts.title.textContent=item.title;
    parts.short.textContent=item.short;
    parts.long.innerHTML=(item.long||[]).map(text=>`<p>${escapeHtml(text)}</p>`).join('');
    parts.meta.innerHTML=(item.meta||[]).map(([key,value])=>`<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(value)}</dd>`).join('');
    parts.meta.hidden=!(item.meta||[]).length;
    parts.links.innerHTML=(item.links||[]).map(([label,href,external])=>{
      if(href==='#matches')return `<button type="button" class="link-arrow" data-matches>${escapeHtml(label)} ${icon('arrow-up-right')}</button>`;
      return `<a class="link-arrow" href="${href}"${external?' target="_blank" rel="noopener noreferrer"':''}>${escapeHtml(label)} ${icon('arrow-up-right')}</a>`;
    }).join('');
    parts.tags.innerHTML=(item.tags||[]).map(tag=>`<span>${escapeHtml(tag)}</span>`).join('');
    body.scrollTop=0;
    history.replaceState(history.state,'',`#item=${item.id}`);
  }
  // Opening from a card adds one history entry, so the phone's Back button closes
  // the window instead of leaving the site. Arriving by link or Back adds nothing.
  function openItem(id,trigger,viaHistory=false){
    const item=byId.get(id);
    if(!item)return;
    lastFocus=trigger||document.activeElement;
    if(!dialog.open&&!viaHistory){history.pushState({item:id},'',location.pathname+location.search);pushed=true;}
    fill(item);
    if(!dialog.open){document.body.classList.add('item-open');dialog.showModal();}
    parts.title.focus?.({preventScroll:true});
  }
  function step(delta){
    const list=visible.includes(opened)?visible:ITEMS;
    const target=list[list.indexOf(opened)+delta];
    if(target)fill(target);
  }
  prev.addEventListener('click',()=>step(-1));
  next.addEventListener('click',()=>step(1));
  document.querySelector('#item-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'){event.preventDefault();step(1);}
    else if(event.key==='ArrowLeft'){event.preventDefault();step(-1);}
  });
  dialog.addEventListener('close',()=>{
    document.body.classList.remove('item-open');
    body.classList.remove('is-switching');
    if(pushed){pushed=false;history.back();}
    else if(location.hash.startsWith('#item='))history.replaceState(null,'',location.pathname+location.search);
    const target=lastFocus&&document.contains(lastFocus)?lastFocus:document.querySelector(`[data-item="${opened?.id}"]`);
    target?.focus({preventScroll:true});
  });
  parts.links.addEventListener('click',event=>{
    const trigger=event.target.closest('[data-matches]');
    if(trigger&&gallery){dialog.close();gallery.openMatches(trigger);}
  });
  parts.title.tabIndex=-1;

  /* ---------- In-page anchors scroll smoothly even while cards are still rendering ---------- */
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');
    if(!link||link.getAttribute('href').startsWith('#item=')||link.getAttribute('href').length<2)return;
    const target=document.getElementById(link.getAttribute('href').slice(1));
    if(!target)return;
    event.preventDefault();
    target.scrollIntoView({behavior:reduceMotion.matches?'instant':'smooth',block:'start'});
    history.pushState(null,'',link.getAttribute('href'));
  });

  /* ---------- Start ---------- */
  renderTabs();renderGrid();
  const deep=location.hash.match(/^#item=([\w-]+)$/);
  if(deep&&byId.has(deep[1])){
    const item=byId.get(deep[1]);
    setCategory(item.cat);
    document.querySelector('#inventory')?.scrollIntoView({behavior:'instant',block:'start'});
    openItem(item.id,null,true);
  }
  addEventListener('popstate',()=>{
    const match=location.hash.match(/^#item=([\w-]+)$/);
    if(match&&byId.has(match[1])){openItem(match[1],null,true);return;}
    if(dialog.open){pushed=false;dialog.close();}
  });
  // Smooth scrolling is the shell's job; a paused-motion visitor gets instant jumps.
  if(reduceMotion.matches)document.documentElement.style.scrollBehavior='auto';
})();
