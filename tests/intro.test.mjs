// Offline resource-loader tests. No browser, network, real assets or storage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/intro.css',import.meta.url),'utf8');
const source=readFileSync(new URL('../dist/intro.js',import.meta.url),'utf8');
const bootstrap=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
const seenKey='portfolio:loader-seen-v2';
assert.ok(bootstrap,'The fail-open bootstrap is present before page assets.');

function classList(){
  const values=new Set();
  return {
    add(...names){names.forEach(name=>values.add(name));},
    remove(...names){names.forEach(name=>values.delete(name));},
    contains(name){return values.has(name);},
    toggle(name,force){const enabled=force??!values.has(name);if(enabled)values.add(name);else values.delete(name);return enabled;}
  };
}
function target(){
  const listeners=new Map();
  return {
    addEventListener(type,listener){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(listener);},
    dispatchEvent(event){for(const listener of listeners.get(event.type)||[])listener(event);return !event.defaultPrevented;},
    emit(type,detail={}){const event={type,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...detail};this.dispatchEvent(event);return event;}
  };
}
function element(){
  return {...target(),classList:classList(),style:{setProperty(name,value){this[name]=value;}},attributes:new Map(),textContent:'',
    setAttribute(name,value){this.attributes.set(name,value);},
    focus(options){this.focusOptions=options;this.focused=true;}
  };
}
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
async function flush(){for(let index=0;index<12;index++)await Promise.resolve();}

function fixture({hash='',navigation='navigate',reducedMotion=false,motionPaused=false,seen=false,legacySeen=false,storageFails=false,load=true,cached=false}={}){
  let now=0,nextJob=0;
  const timers=new Map(),frames=new Map(),resources=[],events=[],saved=new Map();
  if(seen)saved.set(seenKey,'1');
  if(legacySeen)saved.set('portfolio:intro-seen','1');
  const setTimeout=(callback,delay=0)=>{const id=++nextJob;timers.set(id,{callback,at:now+Math.max(0,Number(delay))});return id;};
  const clearTimeout=id=>timers.delete(id);
  const requestAnimationFrame=callback=>{const id=++nextJob;frames.set(id,{callback,at:now+16});return id;};
  const cancelAnimationFrame=id=>frames.delete(id);
  const advance=duration=>{
    const end=now+duration;
    for(;;){
      const next=[...[...timers].map(([id,job])=>({id,job,queue:timers})),...[...frames].map(([id,job])=>({id,job,queue:frames}))]
        .filter(({job})=>job.at<=end).sort((a,b)=>a.job.at-b.job.at||a.id-b.id)[0];
      if(!next)break;
      next.queue.delete(next.id);now=next.job.at;next.job.callback(now);
    }
    now=end;
  };
  const root=element(),body=element(),skip=element(),fill=element(),progress=element(),value=element();
  if(motionPaused)body.classList.add('motion-paused');
  const dialog={...element(),open:false,opens:0,closes:0,
    querySelector(selector){const node={'.intro-skip':skip,'.loader-fill':fill,'.loader-progress':progress,'.loader-value':value}[selector];assert.ok(node,selector);return node;},
    showModal(){this.open=true;this.opens++;},
    close(){if(!this.open)return;this.open=false;this.closes++;setTimeout(()=>this.emit('close'));}
  };
  const footer={children:[],append(child){this.children.push(child);}};
  const loadResource=name=>{const resource={name,...deferred()};resources.push(resource);if(cached)resource.resolve();return resource.promise;};
  const sculpture={decode(){return loadResource('image.decode');}};
  const media={...target(),matches:reducedMotion};
  const window=target();
  window.addEventListener('portfolio:intro',event=>events.push(event.detail.active));
  const document={documentElement:root,body,fonts:{load:loadResource},
    querySelector(selector){return {'#cinematic-intro':dialog,'.site-footer':footer,'.hero-sculpture':sculpture}[selector]??null;},
    createElement(tag){assert.equal(tag,'button');return element();}
  };
  const sessionStorage={getItem(key){if(storageFails)throw new Error('Storage blocked');return saved.get(key)??null;},setItem(key,value){if(storageFails)throw new Error('Storage blocked');saved.set(key,value);}};
  const context=vm.createContext({document,window,location:{hash},sessionStorage,
    performance:{now:()=>now,getEntriesByType(type){assert.equal(type,'navigation');return [{type:navigation}];}},
    matchMedia(query){assert.equal(query,'(prefers-reduced-motion: reduce)');return media;},
    CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
    setTimeout,clearTimeout,requestAnimationFrame,cancelAnimationFrame,addEventListener:window.addEventListener.bind(window)
  });
  vm.runInContext(bootstrap,context,{filename:'intro-bootstrap.js'});
  const start=()=>vm.runInContext(source,context,{filename:'intro.js'});
  if(load)start();
  return {root,body,dialog,skip,footer,fill,progress,value,media,window,events,saved,timers,frames,resources,start,advance,
    get replay(){return footer.children[0];},get now(){return now;},get percent(){return Number(progress.attributes.get('aria-valuenow'));},
    resolveAll(from=0){resources.slice(from).forEach(resource=>resource.resolve());},
    changeMotion(value){media.matches=value;media.emit('change',{matches:value});}
  };
}
function assertClean(f){
  assert.equal(f.dialog.open,false);assert.equal(f.root.classList.contains('intro-pending'),false);
  assert.equal(f.root.classList.contains('intro-running'),false);assert.equal(f.timers.size,0);assert.equal(f.frames.size,0);
}
async function readyAll(f){await flush();f.resolveAll();await flush();}
async function exitStarted(f){await readyAll(f);f.advance(612);assert.equal(f.dialog.classList.contains('is-leaving'),true);}

test('first visit focuses the modal, leaves skip keyboard-only and exposes real progress semantics',async()=>{
  for(const hash of ['','#top']){
    const f=fixture({hash});await flush();
    assert.equal(f.dialog.open,true);assert.equal(f.dialog.opens,1);assert.equal(f.root.classList.contains('intro-running'),true);
    assert.equal(f.dialog.focused,true);assert.equal(f.dialog.focusOptions.preventScroll,true);assert.equal(f.skip.focused,undefined);
    assert.equal(f.percent,0);assert.equal(f.value.textContent,'0%');assert.equal(f.fill.style.transform,'scaleX(0)');
    assert.equal(f.replay.type,'button');assert.equal(f.events.at(-1),true);
    assert.deepEqual(f.resources.map(resource=>resource.name),['image.decode','400 16px Anton','500 16px Manrope','800 16px Manrope']);
  }
  assert.match(html,/<dialog[^>]*id="cinematic-intro"[^>]*aria-label="Загрузка сайта"[^>]*tabindex="-1"/);
  assert.match(html,/class="loader-progress"[^>]*role="progressbar"[^>]*aria-valuemin="0"[^>]*aria-valuemax="100"/);
  assert.match(css,/\.intro-skip:focus-visible\s*\{\s*opacity:1;pointer-events:auto/);
  const skipStyles=css.match(/\.intro-skip\s*\{([^}]+)\}/)?.[1];
  assert.ok(skipStyles);assert.match(skipStyles,/opacity:0/);assert.doesNotMatch(skipStyles,/transform:/,'UA modal autofocus must not scroll to an offscreen translated button.');
});

test('deep links, history restoration, reduced motion and same-session visits skip automatically',()=>{
  for(const options of [{hash:'#projects'},{hash:'#contact'},{hash:'#lead-form'},{navigation:'back_forward'},{reducedMotion:true},{seen:true},{storageFails:true},{motionPaused:true}]){
    const f=fixture(options);assertClean(f);assert.ok(f.replay,'Manual replay remains available.');
  }
  const upgraded=fixture({legacySeen:true});assert.equal(upgraded.dialog.open,true,'The new resource loader uses its own session version.');
});

test('the head watchdog reveals the site if loader code never arrives',()=>{
  const f=fixture({load:false});assert.equal(f.root.classList.contains('intro-pending'),true);
  f.advance(4999);assert.equal(f.root.classList.contains('intro-pending'),true);
  f.advance(1);assertClean(f);f.start();assert.equal(f.dialog.open,false,'Late code must not cover the revealed page.');
});

test('progress advances at 0.2 percentage points per ms and never beyond finished resources',async()=>{
  const f=fixture();await flush();f.advance(200);assert.equal(f.percent,0);assert.equal(f.frames.size,0);
  f.resources[0].resolve();await flush();f.advance(16);assert.equal(f.percent,3);assert.equal(f.fill.style.transform,'scaleX(0.032)');
  f.advance(112);assert.equal(f.percent,25);assert.equal(f.frames.size,0);assert.equal(f.progress.style['--loader-right'],'75%');assert.equal(f.progress.attributes.get('data-progress'),'25%');
  f.advance(500);assert.equal(f.percent,25,'A stalled font cannot cause fabricated progress.');
  f.resources[1].resolve();await flush();f.advance(128);assert.equal(f.percent,50);assert.equal(f.progress.style['--loader-right'],'50%');assert.equal(f.progress.attributes.get('data-progress'),'50%');
  f.resources[2].resolve();await flush();f.advance(128);assert.equal(f.percent,75);assert.equal(f.frames.size,0);
  f.advance(500);assert.equal(f.percent,75);assert.equal(f.dialog.open,true);
});

test('cached resources complete in under one second with 100 ms hold and 180 ms fade',async()=>{
  const f=fixture({cached:true});await flush();
  f.advance(496);assert.equal(f.percent,99);assert.equal(f.dialog.classList.contains('is-leaving'),false);
  f.advance(16);assert.equal(f.percent,100);assert.equal(f.value.textContent,'100%');assert.equal(f.fill.style.transform,'scaleX(1)');
  assert.equal(f.frames.size,0);f.advance(99);assert.equal(f.dialog.classList.contains('is-leaving'),false);
  f.advance(1);assert.equal(f.dialog.classList.contains('is-leaving'),true);assert.equal(f.root.classList.contains('intro-running'),true);
  f.advance(179);assert.equal(f.dialog.open,true);f.advance(1);assertClean(f);
  assert.ok(f.now<1000);assert.equal(f.events.at(-1),false);assert.equal(f.saved.get(seenKey),'1');
});

test('a stalled resource exits at the 2500 ms deadline without inventing 100 percent',async()=>{
  const f=fixture();await flush();f.resources.slice(0,3).forEach(resource=>resource.resolve());await flush();
  f.advance(2499);assert.equal(f.percent,75);assert.equal(f.dialog.classList.contains('is-leaving'),false);
  f.advance(1);assert.equal(f.dialog.classList.contains('is-leaving'),true);assert.equal(f.percent,75);
  f.advance(180);assertClean(f);assert.equal(f.percent,75);
  f.resources[3].resolve();await flush();assert.equal(f.percent,75);assertClean(f);
});

test('failed image or font fails open without claiming completion or leaving frames behind',async()=>{
  for(const failedIndex of [0,1,2,3]){
    const f=fixture();await flush();
    const successfulIndex=(failedIndex+1)%4;f.resources[successfulIndex].resolve();await flush();f.advance(128);
    assert.equal(f.percent,25);f.resources[failedIndex].reject(new Error('Synthetic resource failure'));await flush();
    assert.equal(f.dialog.classList.contains('is-leaving'),true);assert.equal(f.frames.size,0);
    f.resolveAll();await flush();assert.equal(f.percent,25);f.advance(180);assertClean(f);assert.equal(f.percent,25);
  }
});

test('skip and Escape close immediately, remember the new session key and clear all work',async()=>{
  for(const action of ['click','cancel']){
    const f=fixture();await flush();f.resources[0].resolve();await flush();f.advance(16);
    const event=action==='click'?f.skip.emit('click'):f.dialog.emit('cancel');if(action==='cancel')assert.equal(event.defaultPrevented,true);
    f.advance(0);assertClean(f);assert.equal(f.saved.get(seenKey),'1');assert.equal(f.events.at(-1),false);
    f.resolveAll();await flush();assertClean(f);
  }
});

test('late successful or failed resources from a skipped run cannot mutate a replay',async()=>{
  for(const staleFailure of [false,true]){
    const f=fixture();await flush();f.skip.emit('click');f.advance(0);f.replay.emit('click');await flush();
    assert.equal(f.dialog.opens,2);assert.equal(f.resources.length,8);
    if(staleFailure)f.resources[0].reject(new Error('Old load failed'));
    f.resources.slice(0,4).forEach(resource=>resource.resolve());await flush();f.advance(300);
    assert.equal(f.percent,0);assert.equal(f.dialog.classList.contains('is-leaving'),false);assert.equal(f.frames.size,0);
    f.resolveAll(4);await flush();f.advance(792);assertClean(f);assert.equal(f.percent,100);
  }
});

test('a queued close event from the previous modal cannot clean up an immediate replay',async()=>{
  const f=fixture();await flush();f.skip.emit('click');f.replay.emit('click');await flush();
  assert.equal(f.dialog.opens,2);f.advance(0);
  assert.equal(f.dialog.open,true);assert.equal(f.root.classList.contains('intro-running'),true);assert.equal(f.events.at(-1),true);
  f.resources.slice(4).forEach(resource=>resource.resolve());await flush();f.advance(792);assertClean(f);assert.equal(f.percent,100);
});

test('manual reduced-motion and paused replays show actual resource fractions without animating',async()=>{
  for(const options of [{reducedMotion:true},{seen:true,motionPaused:true}]){
    const f=fixture(options);f.replay.emit('click');await flush();assert.equal(f.dialog.open,true);
    f.resources[0].resolve();await flush();assert.equal(f.percent,25);assert.equal(f.frames.size,0);assert.equal(f.dialog.open,true);
    f.resources.slice(1).forEach(resource=>resource.resolve());await flush();f.advance(0);
    assertClean(f);assert.equal(f.percent,100);assert.equal(f.now,0,'No ceremonial delay is added in quiet mode.');
  }
});

test('quiet-motion manual replay still has a deadline when resources stall',async()=>{
  const f=fixture({reducedMotion:true});f.replay.emit('click');await flush();f.advance(2499);assert.equal(f.dialog.open,true);
  f.advance(1);assertClean(f);assert.equal(f.percent,0);
});

test('Escape, reduced motion and site pause can immediately interrupt the exit',async()=>{
  for(const action of ['escape','reduced','paused']){
    const f=fixture();await exitStarted(f);
    if(action==='escape')f.dialog.emit('cancel');else if(action==='reduced')f.changeMotion(true);
    else{f.body.classList.add('motion-paused');f.window.emit('portfolio:motion',{detail:{paused:true}});}
    f.advance(0);assertClean(f);if(action==='paused')assert.equal(f.body.classList.contains('motion-paused'),true);
  }
});

test('turning off motion while loading closes; unpausing is not a dismiss action',async()=>{
  for(const mode of ['reduced','paused']){
    const f=fixture();await flush();f.window.emit('portfolio:motion',{detail:{paused:false}});assert.equal(f.dialog.open,true);
    f.resources[0].resolve();await flush();assert.equal(f.frames.size,1);
    if(mode==='reduced')f.changeMotion(true);else f.window.emit('portfolio:motion',{detail:{paused:true}});
    f.advance(0);assertClean(f);f.resolveAll();await flush();assertClean(f);
  }
});

test('pagehide cleans pending animation, deadline and late resource callbacks',async()=>{
  const f=fixture();await flush();f.resources[0].resolve();await flush();assert.equal(f.frames.size,1);
  f.window.emit('pagehide');f.advance(0);assertClean(f);assert.equal(f.events.at(-1),false);
  f.resolveAll();await flush();f.advance(10000);assertClean(f);assert.equal(f.dialog.opens,1);
});

test('external dialog close clears root state, frames and the active resource generation',async()=>{
  const f=fixture();await flush();f.resources[0].resolve();await flush();f.dialog.close();f.advance(0);assertClean(f);
  f.resolveAll();await flush();assertClean(f);assert.equal(f.events.at(-1),false);
});
