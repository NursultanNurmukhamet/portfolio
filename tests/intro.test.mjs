// Offline opening-credit tests. No browser, network, real assets or storage.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../dist/intro.js',import.meta.url),'utf8');
const bootstrap=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(bootstrap,'The fail-open bootstrap is present before page assets.');

function classList(){
  const values=new Set();
  return {add(...names){names.forEach(name=>values.add(name));},remove(...names){names.forEach(name=>values.delete(name));},contains(name){return values.has(name);}};
}
function target(){
  const listeners=new Map();
  return {
    addEventListener(type,listener){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(listener);},
    dispatchEvent(event){for(const listener of listeners.get(event.type)||[])listener(event);return !event.defaultPrevented;},
    emit(type,detail={}){const event={type,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...detail};this.dispatchEvent(event);return event;}
  };
}
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
async function flush(){for(let index=0;index<5;index++)await Promise.resolve();}

function fixture({hash='',navigation='navigate',reducedMotion=false,motionPaused=false,seen=false,storageFails=false,load=true}={}){
  let now=0,nextTimer=0;
  const timers=new Map(),assets=[],events=[],saved=new Map(seen?[['portfolio:intro-seen','1']]:[]);
  const setTimeout=(callback,delay=0)=>{const id=++nextTimer;timers.set(id,{callback,at:now+Math.max(0,Number(delay))});return id;};
  const clearTimeout=id=>timers.delete(id);
  const advance=duration=>{
    const end=now+duration;
    for(;;){
      const next=[...timers.entries()].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at||a[0]-b[0])[0];
      if(!next)break;
      timers.delete(next[0]);now=next[1].at;next[1].callback();
    }
    now=end;
  };
  const root={classList:classList()},body={classList:classList()},skip={...target(),focus(options){this.focusOptions=options;this.focused=true;}};
  if(motionPaused)body.classList.add('motion-paused');
  const dialog={...target(),classList:classList(),open:false,opens:0,closes:0,
    querySelector(selector){assert.equal(selector,'.intro-skip');return skip;},
    showModal(){this.open=true;this.opens++;},
    close(){if(!this.open)return;this.open=false;this.closes++;setTimeout(()=>this.emit('close'));}
  };
  const footer={children:[],append(child){this.children.push(child);}};
  const sculpture={decode(){const asset=deferred();assets.push(asset);return asset.promise;}};
  const media={...target(),matches:reducedMotion};
  const window=target();
  window.addEventListener('portfolio:intro',event=>events.push(event.detail.active));
  const document={documentElement:root,body,fonts:{ready:Promise.resolve()},
    querySelector(selector){return {'#cinematic-intro':dialog,'.site-footer':footer,'.hero-sculpture':sculpture}[selector]??null;},
    createElement(tag){assert.equal(tag,'button');return target();}
  };
  const sessionStorage={getItem(key){if(storageFails)throw new Error('Storage blocked');return saved.get(key)??null;},setItem(key,value){if(storageFails)throw new Error('Storage blocked');saved.set(key,value);}};
  const context=vm.createContext({document,window,location:{hash},sessionStorage,
    performance:{now:()=>now,getEntriesByType(type){assert.equal(type,'navigation');return [{type:navigation}];}},
    matchMedia(query){assert.equal(query,'(prefers-reduced-motion: reduce)');return media;},
    CustomEvent:class{constructor(type,options={}){this.type=type;this.detail=options.detail;}},
    setTimeout,clearTimeout,addEventListener:window.addEventListener.bind(window)
  });
  vm.runInContext(bootstrap,context,{filename:'intro-bootstrap.js'});
  const start=()=>vm.runInContext(source,context,{filename:'intro.js'});
  if(load)start();
  return {root,body,dialog,skip,footer,media,window,events,saved,timers,assets,start,advance,
    get replay(){return footer.children[0];},get now(){return now;},
    changeMotion(value){media.matches=value;media.emit('change',{matches:value});}
  };
}

test('first eligible visit starts an accessible modal and focuses its skip control',()=>{
  for(const hash of ['','#top']){
    const f=fixture({hash});
    assert.equal(f.dialog.open,true);assert.equal(f.dialog.opens,1);
    assert.equal(f.root.classList.contains('intro-pending'),false,'Modal state replaces the bootstrap-only pending state.');
    assert.equal(f.root.classList.contains('intro-running'),true);
    assert.equal(f.skip.focused,true);assert.equal(f.skip.focusOptions.preventScroll,true);
    assert.equal(f.replay.type,'button');assert.equal(f.events.at(-1),true);
    assert.match(html,/<dialog[^>]*id="cinematic-intro"[^>]*aria-labelledby="intro-title"[^>]*aria-describedby="intro-description"/);
  }
});

test('deep links, history restoration, reduced motion and same-session visits skip automatic intro',()=>{
  for(const options of [{hash:'#projects'},{hash:'#contact'},{hash:'#lead-form'},{navigation:'back_forward'},{reducedMotion:true},{seen:true},{storageFails:true}]){
    const f=fixture(options);
    assert.equal(f.dialog.open,false,JSON.stringify(options));
    assert.equal(f.root.classList.contains('intro-pending'),false);
    assert.equal(f.root.classList.contains('intro-running'),false);
    assert.equal(f.timers.size,0);
    assert.ok(f.replay,'Manual replay remains available even when the automatic intro is skipped.');
  }
});

test('head watchdog reveals the site when deferred intro code never loads',()=>{
  const f=fixture({load:false});
  assert.equal(f.root.classList.contains('intro-pending'),true);
  f.advance(4999);assert.equal(f.root.classList.contains('intro-pending'),true);
  f.advance(1);assert.equal(f.root.classList.contains('intro-pending'),false);
  assert.equal(f.root.classList.contains('intro-running'),false);assert.equal(f.timers.size,0);
  f.start();assert.equal(f.dialog.open,false,'Late script arrival must not cover an already revealed page.');
});

test('ready assets preserve a 2.5 second credit before the bounded exit',async()=>{
  const f=fixture();f.assets[0].resolve();await flush();
  f.advance(2499);assert.equal(f.dialog.classList.contains('is-leaving'),false);
  f.advance(1);assert.equal(f.dialog.classList.contains('is-leaving'),true);
  assert.equal(f.root.classList.contains('intro-pending'),false,'Page is revealed under the departing card.');
  assert.equal(f.root.classList.contains('intro-running'),true);
  f.advance(679);assert.equal(f.dialog.open,true);
  f.advance(1);assert.equal(f.dialog.open,false);assert.equal(f.root.classList.contains('intro-running'),false);
  assert.equal(f.events.at(-1),false);assert.equal(f.timers.size,0);
  assert.equal(f.saved.get('portfolio:intro-seen'),'1');
});

test('unresolved assets cannot hold the intro longer than 3.4 seconds plus the exit',()=>{
  const f=fixture();
  f.advance(3399);assert.equal(f.dialog.classList.contains('is-leaving'),false);
  f.advance(1);assert.equal(f.dialog.classList.contains('is-leaving'),true);
  f.advance(680);assert.equal(f.dialog.open,false);assert.equal(f.timers.size,0);
});

test('failed image decode still releases the intro without a simulated loading stall',async()=>{
  const f=fixture();f.assets[0].reject(new Error('Synthetic decode failure'));await flush();
  f.advance(3180);assert.equal(f.dialog.open,false);assert.equal(f.timers.size,0);
});

test('skip and Escape immediately close and remember the intro with no remaining lock',()=>{
  for(const action of ['click','cancel']){
    const f=fixture();f.advance(100);
    const event=action==='click'?f.skip.emit('click'):f.dialog.emit('cancel');
    if(action==='cancel')assert.equal(event.defaultPrevented,true);
    assert.equal(f.dialog.open,false);assert.equal(f.root.classList.contains('intro-pending'),false);
    assert.equal(f.root.classList.contains('intro-running'),false);assert.equal(f.events.at(-1),false);
    assert.equal(f.saved.get('portfolio:intro-seen'),'1');
    f.advance(0);assert.equal(f.timers.size,0);
  }
});

test('late asset readiness from a skipped run cannot shorten a new replay',async()=>{
  const f=fixture();f.advance(100);f.skip.emit('click');f.advance(0);f.replay.emit('click');
  assert.equal(f.dialog.opens,2);assert.equal(f.assets.length,2);
  f.advance(1000);const dueBefore=[...f.timers.values()].map(timer=>timer.at);
  f.assets[0].resolve();await flush();
  assert.deepEqual([...f.timers.values()].map(timer=>timer.at),dueBefore);
  f.advance(1500);assert.equal(f.dialog.classList.contains('is-leaving'),false);
  f.assets[1].resolve();await flush();f.advance(0);
  assert.equal(f.dialog.classList.contains('is-leaving'),true);
  f.advance(680);assert.equal(f.dialog.open,false);
});

test('manual replay under reduced motion is static and always skippable',async()=>{
  const f=fixture({reducedMotion:true});f.replay.emit('click');
  assert.equal(f.dialog.open,true);f.assets[0].resolve();await flush();f.advance(10000);
  assert.equal(f.dialog.open,true);assert.equal(f.dialog.classList.contains('is-leaving'),false);
  assert.equal(f.timers.size,0);f.skip.emit('click');f.advance(0);
  assert.equal(f.dialog.open,false);assert.equal(f.root.classList.contains('intro-running'),false);
});

test('manual replay respects the site motion pause as a static card too',async()=>{
  const f=fixture({seen:true,motionPaused:true});f.replay.emit('click');
  assert.equal(f.dialog.open,true);f.assets[0].resolve();await flush();f.advance(10000);
  assert.equal(f.dialog.open,true,'A paused replay should remain a readable static title card.');
  assert.equal(f.dialog.classList.contains('is-leaving'),false);assert.equal(f.timers.size,0);
  f.skip.emit('click');f.advance(0);assert.equal(f.dialog.open,false);
});

test('enabling reduced motion during an active credit closes it immediately',()=>{
  const f=fixture();f.changeMotion(true);f.advance(0);
  assert.equal(f.dialog.open,false);assert.equal(f.root.classList.contains('intro-running'),false);
  assert.equal(f.timers.size,0);
});

test('site pause events close the credit and its exit without changing the pause preference',async()=>{
  for(const exiting of [false,true]){
    const f=fixture();
    f.window.emit('portfolio:motion',{detail:{paused:false}});
    assert.equal(f.dialog.open,true,'Resuming motion must not dismiss an active credit.');
    if(exiting){f.assets[0].resolve();await flush();f.advance(2500);}
    f.body.classList.add('motion-paused');
    f.window.emit('portfolio:motion',{detail:{paused:true}});f.advance(0);
    assert.equal(f.dialog.open,false);assert.equal(f.root.classList.contains('intro-running'),false);
    assert.equal(f.body.classList.contains('motion-paused'),true);assert.equal(f.timers.size,0);
    f.assets[0].resolve();await flush();assert.equal(f.timers.size,0);
  }
});

test('Escape or reduced motion can interrupt the exit animation immediately',async()=>{
  for(const action of ['escape','reduced']){
    const f=fixture();f.assets[0].resolve();await flush();f.advance(2500);
    assert.equal(f.dialog.classList.contains('is-leaving'),true);
    if(action==='escape')f.dialog.emit('cancel');else f.changeMotion(true);
    assert.equal(f.dialog.open,false,`${action} must not wait for the remaining animated exit.`);
    f.advance(0);assert.equal(f.root.classList.contains('intro-running'),false);assert.equal(f.timers.size,0);
  }
});

test('pagehide cleans pending timers and ignores later asset callbacks',async()=>{
  const f=fixture();f.window.emit('pagehide');f.advance(0);
  assert.equal(f.dialog.open,false);assert.equal(f.root.classList.contains('intro-pending'),false);
  assert.equal(f.root.classList.contains('intro-running'),false);assert.equal(f.events.at(-1),false);
  f.assets[0].resolve();await flush();f.advance(10000);
  assert.equal(f.timers.size,0);assert.equal(f.dialog.opens,1);
});

test('external dialog close also cleans root state and the current asset generation',async()=>{
  const f=fixture();f.dialog.close();f.advance(0);
  assert.equal(f.root.classList.contains('intro-running'),false);
  assert.equal(f.root.classList.contains('intro-pending'),false);
  f.assets[0].resolve();await flush();assert.equal(f.timers.size,0);assert.equal(f.events.at(-1),false);
});
