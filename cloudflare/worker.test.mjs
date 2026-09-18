import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {handle,deliver,scheduled} from './worker.mjs';

function fixture(options={}){
  const sqlite=new DatabaseSync(':memory:');
  for(const file of readdirSync(new URL('./drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync(new URL(`./drizzle/${file}`,import.meta.url),'utf8'));
  const DB={prepare(sql){const args=[];return {bind(...values){args.push(...values);return this;},async first(){return sqlite.prepare(sql).get(...args)||null;},async run(){const result=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}};}};},async batch(statements){sqlite.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
  const env={DB,ALLOWED_ORIGINS:'https://example.github.io',TELEGRAM_BOT_TOKEN:'0'.repeat(10)+':'+ 'x'.repeat(35),TELEGRAM_CHAT_ID:'12345',TURNSTILE_SECRET_KEY:'dummy',RATE_SALT:'x'.repeat(32)};
  const tasks=[],calls=[],ctx={waitUntil(task){tasks.push(task);}};
  const fetcher=async(url,init)=>{const payload=JSON.parse(init.body);calls.push({kind:url.includes('siteverify')?'verify':'telegram',payload});if(url.includes('siteverify'))return Response.json({success:true,hostname:'example.github.io',action:'portfolio_lead'});return options.telegram?options.telegram():Response.json({ok:true,result:{message_id:7,chat:{id:12345}}});};
  return {env,ctx,sqlite,calls,tasks,fetcher};
}
const data=()=>({requestId:randomUUID(),problem:'Проверка сохранения реальной заявки.',outcome:'Не терять заявки при отключении компьютера.',name:'Тест',contact:'demo@example.com',consent:true,website:'',turnstileToken:'dummy'});
const request=(body,headers={})=>new Request('https://example.workers.dev/api/leads',{method:'POST',headers:{Origin:'https://example.github.io','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1',...headers},body:JSON.stringify(body)});
const finish=async fixture=>Promise.all(fixture.tasks);

test('save before acceptance, fixed recipient, duplicate requests and atomic claim',async()=>{
  const f=fixture(),body=data();
  const replies=await Promise.all([handle(request(body),f.env,f.ctx,f),handle(request(body),f.env,f.ctx,f)]);
  for(const response of replies){const result=await response.json();assert.equal(result.accepted,true);assert.equal(result.requestId,body.requestId);}
  await finish(f);
  assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get().n,1);
  const sends=f.calls.filter(c=>c.kind==='telegram');assert.equal(sends.length,1);assert.equal(sends[0].payload.chat_id,'12345');
  assert.equal(f.sqlite.prepare('SELECT status FROM leads').get().status,'sent');
  assert.equal((await handle(request({...body,name:'Другой'}),f.env,f.ctx,f)).status,409);
  const repeated=await handle(request({...body,requestId:body.requestId.toUpperCase()}),f.env,f.ctx,f);assert.equal((await repeated.json()).delivery,'sent');assert.equal(f.calls.filter(c=>c.kind==='telegram').length,1);
});
test('strict validation rejects recipient injection, origin, consent, malformed types and body size',async()=>{
  const f=fixture();
  for(const bad of [{...data(),chat_id:'999'},{...data(),name:[]},{...data(),requestId:[randomUUID()]},{...data(),consent:false},{...data(),website:'spam'},null,[]])assert.equal((await handle(request(bad),f.env,f.ctx,f)).status,400);
  assert.equal((await handle(request(data(),{Origin:'https://evil.invalid'}),f.env,f.ctx,f)).status,403);
  assert.equal((await handle(request({...data(),problem:'x'.repeat(13000)}),f.env,f.ctx,f)).status,413);
  assert.equal(f.calls.length,0);
});

test('optional phone is validated, stored, delivered and included in deduplication',async()=>{
  for(const phone of ['+1 (202) 555-0123','1234567','+123456789012345','  +1\u00a0(202) 555-0123  ']){
    const f=fixture(),body={...data(),phone},expected=phone.trim().replace(/\u00a0/g,' ');
    assert.equal((await handle(request(body),f.env,f.ctx,f)).status,202);await finish(f);
    assert.equal(JSON.parse(f.sqlite.prepare('SELECT payload FROM leads').get().payload).phone,expected);
    assert.ok(f.calls.find(c=>c.kind==='telegram').payload.text.includes(`Телефон: ${expected}`));
    assert.equal((await handle(request({...body,phone:'+1 (202) 555-0199'}),f.env,f.ctx,f)).status,409);
    assert.equal((await handle(request(body),f.env,f.ctx,f)).status,200);
    assert.equal(f.calls.filter(c=>c.kind==='telegram').length,1);
  }
  for(const phone of [null,1234567,[],{},'123456','1234567890123456','+1 abc 202 555 0123','++12025550123','1202+5550123','+1\n2025550123','+1\t2025550123','() -','+1'+' '.repeat(24)+'2025550123']){
    const f=fixture();assert.equal((await handle(request({...data(),phone}),f.env,f.ctx,f)).status,400);assert.equal(f.calls.length,0);
  }
});

test('legacy request fingerprints and messages remain compatible without phone',async()=>{
  const f=fixture(),body=data();await handle(request(body),f.env,f.ctx,f);await finish(f);
  const saved=f.sqlite.prepare('SELECT fingerprint,payload FROM leads').get();
  const expectedFields={problem:body.problem,outcome:body.outcome,name:body.name,contact:body.contact};
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(expectedFields)));
  assert.equal(saved.fingerprint,Buffer.from(digest).toString('hex'));
  assert.equal('phone' in JSON.parse(saved.payload),false);
  for(const phone of ['', '   '])assert.equal((await handle(request({...body,phone}),f.env,f.ctx,f)).status,200);
  assert.equal(f.calls.filter(c=>c.kind==='telegram').length,1);
  assert.equal(f.calls.find(c=>c.kind==='telegram').payload.text.includes('Телефон:'),false);
  assert.equal((await handle(request({...body,phone:'+1 (202) 555-0123'}),f.env,f.ctx,f)).status,409);
});
test('Turnstile validation requires exact hostname and action; D1 failure is not success',async()=>{
  for(const result of [{success:false},{success:true,hostname:'evil.invalid',action:'portfolio_lead'},{success:true,hostname:'example.github.io',action:'wrong'}]){
    const f=fixture();const response=await handle(request(data()),f.env,f.ctx,{fetcher:async()=>Response.json(result)});
    assert.equal(response.status,400);assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get().n,0);
  }
  const f=fixture();f.env.DB.prepare=()=>{throw Error('private upstream details');};const response=await handle(request(data()),f.env,f.ctx,f);assert.equal(response.status,503);assert.equal((await response.text()).includes('private upstream'),false);assert.equal(f.calls.length,0);
});
test('timeout and 5xx remain uncertain; scheduled job never resends uncertain records',async()=>{
  for(const telegram of [async()=>{throw Error('secret URL');},async()=>Response.json({ok:false,error_code:500},{status:500}),async()=>Response.json({})]){
    const f=fixture({telegram});await handle(request(data()),f.env,f.ctx,f);await finish(f);assert.equal(f.sqlite.prepare('SELECT status FROM leads').get().status,'uncertain');await scheduled(f.env,f);assert.equal(f.calls.filter(c=>c.kind==='telegram').length,1);
  }
});
test('429 has bounded retries; expired sending lease becomes uncertain',async()=>{
  let clock=Date.now();const f=fixture({telegram:async()=>Response.json({ok:false,error_code:429,parameters:{retry_after:60}},{status:429})}),body=data();
  const options={fetcher:f.fetcher,now:()=>clock};await handle(request(body),f.env,f.ctx,options);await finish(f);
  for(let i=0;i<2;i++){clock+=61000;await scheduled(f.env,options);}
  assert.equal(f.sqlite.prepare('SELECT status,attempts FROM leads').get().status,'failed');assert.equal(f.calls.filter(c=>c.kind==='telegram').length,3);
  f.sqlite.prepare("UPDATE leads SET status='sending',lease_until=?").run(clock-1);await scheduled(f.env,options);assert.equal(f.sqlite.prepare('SELECT status FROM leads').get().status,'uncertain');
});
test('per-IP quotas; retention removes payload and keeps deduplication marker',async()=>{
  const f=fixture();for(let i=0;i<5;i++)assert.equal((await handle(request(data()),f.env,f.ctx,f)).status,202);await finish(f);
  assert.equal((await handle(request(data()),f.env,f.ctx,f)).status,429);
  await scheduled(f.env,{fetcher:f.fetcher,now:()=>Date.now()+31*86400000});assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM leads WHERE payload IS NOT NULL').get().n,0);assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get().n,5);
  await scheduled(f.env,{fetcher:f.fetcher,now:()=>Date.now()+91*86400000});assert.equal(f.sqlite.prepare('SELECT COUNT(*) AS n FROM leads').get().n,0);
});
