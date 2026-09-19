// Real workerd + local D1; outbound services are simulated, never contacted.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,realpathSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
const require=createRequire(import.meta.url);
const runtimeRequire=createRequire(realpathSync(require.resolve('wrangler/package.json')));
const {Miniflare,convertV4MiniflareOptions}=runtimeRequire('miniflare');

test('workerd verifies, stores and delivers the actual Worker using no-follow requests',{timeout:60000},async()=>{
  const calls=[];
  const mf=new Miniflare(convertV4MiniflareOptions({
    modules:true,scriptPath:fileURLToPath(new URL('./worker.mjs',import.meta.url)),compatibilityDate:'2026-09-18',cf:false,
    d1Databases:{DB:'runtime-test'},
    bindings:{ALLOWED_ORIGINS:'https://example.github.io',TELEGRAM_BOT_TOKEN:'0'.repeat(10)+':'+'x'.repeat(35),TELEGRAM_CHAT_ID:'12345',TURNSTILE_SECRET_KEY:'synthetic',RATE_SALT:'x'.repeat(32)},
    outboundService:async request=>{
      const url=new URL(request.url),body=await request.json();
      if(url.hostname==='challenges.cloudflare.com'&&url.pathname==='/turnstile/v0/siteverify'){
        assert.equal(body.response,'synthetic-provider-token');calls.push('verify');
        return Response.json({success:true,hostname:'example.github.io',action:'portfolio_lead'});
      }
      if(url.hostname==='api.telegram.org'&&url.pathname.endsWith('/sendMessage')){
        assert.equal(body.chat_id,'12345');calls.push('telegram');
        return Response.json({ok:true,result:{message_id:123,chat:{id:12345}}});
      }
      throw Error('Unexpected outbound destination');
    }
  }));
  try{
    const db=await mf.getD1Database('DB');
    for(const file of readdirSync(new URL('./drizzle/',import.meta.url)).filter(x=>x.endsWith('.sql')).sort()){
      const sql=readFileSync(new URL(`./drizzle/${file}`,import.meta.url),'utf8');
      for(const statement of sql.split('--> statement-breakpoint').filter(x=>x.trim()))await db.exec(statement.replace(/\r?\n/g,' '));
    }
    const payload={requestId:randomUUID(),problem:'Runtime compatibility test only.',outcome:'A verified lead reaches the simulated Telegram recipient.',name:'Test',contact:'test@example.com',consent:true,website:'',turnstileToken:'synthetic-provider-token'};
    const response=await mf.dispatchFetch('https://worker.test/api/leads',{method:'POST',headers:{Origin:'https://example.github.io','Content-Type':'application/json','CF-Connecting-IP':'192.0.2.1'},body:JSON.stringify(payload)});
    assert.equal(response.status,202);assert.equal((await response.json()).accepted,true);
    let row;
    for(let attempt=0;attempt<100;attempt++){
      row=await db.prepare('SELECT status FROM leads WHERE id=?').bind(payload.requestId).first();
      if(row?.status==='sent')break;
      await new Promise(resolve=>setTimeout(resolve,50));
    }
    assert.equal(row?.status,'sent');assert.deepEqual(calls,['verify','telegram']);
  }finally{await mf.dispose();}
});
