(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const story = $('.story'), screen = $('.story-screen'), track = $('.story-track');
  const athlete = $('.athlete'), copy = $('.opening-copy'), widget = $('.event-widget');
  const ball = $('.flying-ball'), toss = $('.toss-caption'), end = $('.return-card'), cue = $('.scroll-cue');
  const toggle = $('#motion-toggle'), reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false, raf = 0;
  const clamp = (x) => Math.max(0, Math.min(1,x));
  const smooth = (x) => { const y = clamp(x);return y*y*(3-2*y); };
  const segment = (p,a,b) => smooth((p-a)/(b-a));
  const lerp = (a,b,t) => a+(b-a)*t;
  function fade(el,alpha) { el.style.opacity = String(alpha);el.style.visibility = alpha < .01 ? 'hidden' : 'visible'; }
  // Original keyframe path; native scrolling, no interception of wheel/touch.
  const flight = [[0,.67,.72,.6],[.18,.73,.25,1],[.32,.78,.22,.92],[.48,.81,.34,.8],[.60,.72,.76,1.1],[.71,.67,.29,.94],[.86,.43,.23,.84],[1,.23,.32,.68]];
  function positionAt(p) { let i=0;while(i<flight.length-2&&p>flight[i+1][0])i++;const a=flight[i],b=flight[i+1],t=segment(p,a[0],b[0]);return [lerp(a[1],b[1],t),lerp(a[2],b[2],t),lerp(a[3],b[3],t)]; }
  function paint() {
    raf=0;
    const stopped=paused||reduce.matches;
    const p=stopped?0:clamp(-story.getBoundingClientRect().top/Math.max(1,story.offsetHeight-screen.clientHeight));
    story.style.setProperty('--progress',p.toFixed(4));
    const slide=segment(p,.25,.36)+segment(p,.44,.56)-2*segment(p,.77,.95);
    track.style.transform=`translate3d(${-slide*screen.clientWidth}px,0,0)`;
    fade(copy,1-segment(p,.025,.14));copy.style.transform=`translateY(${-segment(p,0,.16)*55}px)`;
    fade(widget,1-segment(p,.055,.16));
    const exit=segment(p,.055,.24);athlete.style.transform=`translate3d(${exit*screen.clientWidth*.6}px,${-exit*screen.clientHeight*.2}px,0) rotate(${exit*7}deg)`;
    fade(athlete,1-segment(p,.14,.26));fade(toss,segment(p,.13,.19)*(1-segment(p,.22,.28)));fade(end,segment(p,.9,.99));
    const q=positionAt(p);ball.style.transform=`translate3d(${q[0]*screen.clientWidth}px,${q[1]*screen.clientHeight}px,0) translate(-50%,-50%) scale(${q[2]}) rotate(${p*820}deg)`;
    fade(ball,stopped?0:segment(p,.005,.045));
    const opacity=stopped?1:1-segment(p,.025,.11);fade(cue,opacity);cue.inert=opacity<.01;
  }
  function queue(){if(!raf)raf=requestAnimationFrame(paint);}
  function sync(){
    const before=story.offsetHeight, oldY=scrollY, top=story.getBoundingClientRect().top+scrollY, below=oldY>=top+before;
    const stop=paused||reduce.matches;document.body.classList.toggle('motion-off',stop);
    toggle.setAttribute('aria-pressed',String(stop));toggle.setAttribute('aria-label',reduce.matches?'Анимация отключена в настройках устройства':stop?'Включить анимацию':'Отключить анимацию');toggle.textContent=stop?'▷':'Ⅱ';toggle.disabled=reduce.matches;
    if(below)window.scrollTo({top:oldY+story.offsetHeight-before,behavior:'instant'});else if(stop&&oldY>top)window.scrollTo({top,behavior:'instant'});
    paint();
  }
  toggle.hidden=false;toggle.addEventListener('click',()=>{paused=!paused;sync();});reduce.addEventListener('change',sync);addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);sync();
  function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
  const grid=$('#program-grid');
  for(const day of window.EVENT_PROGRAM||[]){
    const card=el('article',`day-card day-${day.color}`),head=el('header','day-head'),title=el('div','day-heading'),list=el('ol','day-items');
    head.append(el('p','','OPENCOURT / WEEKEND PROGRAM'));title.append(el('strong','',day.day),el('span','',`ДЕНЬ / ${day.label}`));head.append(title,el('h3','',day.subtitle));
    for(const item of day.items){const row=el('li',item.optional?'is-optional':''),icon=el('span','event-icon',item.icon),body=el('div');icon.setAttribute('aria-hidden','true');if(item.optional)body.append(el('span','optional-label','ПО ЖЕЛАНИЮ'));body.append(el('p','event-time',item.time),el('h4','',item.title),el('p','',item.description));row.append(icon,body);list.append(row);}
    card.append(head,list);grid.append(card);
  }
  // Presets only: no editable contacts, endpoints, requests, analytics or storage.
  const form=$('#guest-form'),confirmation=$('#confirmation');
  form.addEventListener('submit',(event)=>{
    event.preventDefault();const data=new FormData(form);
    const rows=[['Участник','Демо-гость'],['Формат',data.get('format')==='player'?'На корте — дружеские матчи':'Гость — общение и отдых'],['Размещение',data.get('stay')==='hotel'?'Клубный гостевой дом':'Самостоятельно'],['Прибытие',`День 01 · ${data.get('arrival')}`],['Отъезд',`День 03 · ${data.get('departure')}`],['Свободное время',[data.has('walk')&&'прогулка',data.has('dinner')&&'общий ужин'].filter(Boolean).join(', ')||'своя программа']];
    const details=$('#confirmation-details');details.replaceChildren();for(const [key,value] of rows){const row=el('div');row.append(el('dt','',key),el('dd','',value));details.append(row);}
    form.hidden=true;confirmation.hidden=false;$('#confirmation-title').focus();
  });
  $('#reset-form').addEventListener('click',()=>{confirmation.hidden=true;form.hidden=false;form.querySelector('[name="format"]:checked').focus();});form.hidden=false;
})();
