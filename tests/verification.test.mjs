// Isolated provider simulation; no network, real challenge, or form submission.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../dist/verification.js',import.meta.url),'utf8');
function fixture({loaded=true}={}){
  const timers=new Map(),states=[],scripts=[],calls=[];
  let nextTimer=0,visible=true,options;
  const api={render(container,config){options=config;calls.push('render');return 'widget-id';},reset(id){assert.equal(id,'widget-id');calls.push('reset');}};
  const window=loaded?{turnstile:api}:{};
  const document={createElement(){return {remove(){this.removed=true;}};},head:{append(script){scripts.push(script);}}};
  vm.runInNewContext(source,{window,document,setTimeout(fn,ms){const id=++nextTimer;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);}});
  const controller=window.createPortfolioVerification({container:{},sitekey:'public-test-sitekey',isVisible:()=>visible,onState:state=>states.push({...state})});
  return {controller,window,api,scripts,calls,states,get options(){return options;},setVisible(value){visible=value;},fire(ms){for(const [id,timer] of [...timers])if(timer.ms===ms){timers.delete(id);timer.fn();}}};
}
test('failed challenge can be reset in place; only a success callback supplies a token',()=>{
  const f=fixture();f.controller.ensure();
  assert.equal(f.controller.token,'');assert.deepEqual(f.calls,['render']);
  f.options['error-callback']('600010');
  assert.equal(f.controller.phase,'failed');assert.equal(f.states.at(-1).code,'600010');
  f.controller.ensure();assert.deepEqual(f.calls,['render']);
  f.controller.retry();assert.deepEqual(f.calls,['render','reset']);assert.equal(f.controller.token,'');
  f.options.callback('provider-token');assert.equal(f.controller.phase,'ready');assert.equal(f.controller.token,'provider-token');
  f.controller.ensure();assert.deepEqual(f.calls,['render','reset']);
  assert.equal(f.options.action,'portfolio_lead');assert.equal(f.options['response-field'],false);
  assert.equal(f.options.retry,'never');assert.equal(f.options['refresh-expired'],'manual');
});
test('script loading is single-flight and rendering is deferred while contact step is hidden',()=>{
  const f=fixture({loaded:false});f.controller.ensure();f.controller.ensure();assert.equal(f.scripts.length,1);
  f.setVisible(false);f.window.turnstile=f.api;f.scripts[0].onload();assert.deepEqual(f.calls,[]);
  f.setVisible(true);f.controller.ensure();assert.deepEqual(f.calls,['render']);
});
test('load failure can retry and old script callbacks cannot affect the new attempt',()=>{
  const f=fixture({loaded:false});f.controller.ensure();const old=f.scripts[0];old.onerror();
  assert.equal(f.controller.phase,'failed');assert.equal(f.states.at(-1).code,'load');assert.equal(old.removed,true);
  f.controller.retry();assert.equal(f.scripts.length,2);
  old.onload();assert.equal(f.controller.phase,'loading');
  f.window.turnstile=f.api;f.scripts[1].onload();assert.deepEqual(f.calls,['render']);
});
test('bounded loading and challenge waits expose a retry, not endless checking',()=>{
  const f=fixture({loaded:false});f.controller.ensure();f.fire(25000);
  assert.equal(f.controller.phase,'failed');assert.equal(f.states.at(-1).code,'load');
  const g=fixture();g.controller.ensure();g.fire(45000);
  assert.equal(g.controller.phase,'failed');assert.equal(g.states.at(-1).code,'timeout');assert.equal(g.controller.token,'');
  g.controller.retry();assert.deepEqual(g.calls,['render','reset']);
});
test('expired, unsupported, and interaction-timeout callbacks invalidate tokens',()=>{
  for(const callback of ['expired-callback','unsupported-callback','timeout-callback']){
    const f=fixture();f.controller.ensure();f.options.callback('provider-token');f.options[callback]();
    assert.equal(f.controller.phase,'failed');assert.equal(f.controller.token,'');
  }
});
test('invalidation never runs a challenge on a hidden step',()=>{
  const f=fixture();f.controller.ensure();f.options.callback('provider-token');f.setVisible(false);
  f.controller.invalidate();f.controller.ensure();assert.equal(f.controller.token,'');assert.deepEqual(f.calls,['render']);
  f.setVisible(true);f.controller.ensure();assert.deepEqual(f.calls,['render','reset']);
});
test('successful verification cancels the waiting watchdog',()=>{
  const f=fixture();f.controller.ensure();f.options.callback('provider-token');f.fire(45000);
  assert.equal(f.controller.phase,'ready');assert.equal(f.controller.token,'provider-token');
});
test('late callbacks cannot restore an invalidated token before the next visible reset',()=>{
  const f=fixture();f.controller.ensure();f.setVisible(false);f.controller.invalidate();
  f.options.callback('stale-provider-token');f.options['error-callback']('600010');
  assert.equal(f.controller.phase,'idle');assert.equal(f.controller.token,'');
  f.setVisible(true);f.controller.ensure();assert.deepEqual(f.calls,['render','reset']);
  f.options.callback('fresh-provider-token');assert.equal(f.controller.token,'fresh-provider-token');
});
test('server rejection does not automatically restart the challenge on another submit',()=>{
  const f=fixture();f.controller.ensure();f.options.callback('provider-token');
  f.controller.requireRetry();f.controller.ensure();f.controller.ensure();
  assert.equal(f.controller.token,'');assert.equal(f.controller.phase,'failed');assert.deepEqual(f.calls,['render']);
  f.controller.retry();assert.deepEqual(f.calls,['render','reset']);
});
test('script can load during the previous step without running a hidden challenge',()=>{
  const f=fixture({loaded:false});f.setVisible(false);f.controller.warmup();f.controller.warmup();
  assert.equal(f.scripts.length,1);assert.deepEqual(f.calls,[]);
  f.window.turnstile=f.api;f.scripts[0].onload();assert.deepEqual(f.calls,[]);
  f.setVisible(true);f.controller.ensure();assert.deepEqual(f.calls,['render']);
});
