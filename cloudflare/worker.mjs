const DAY=86400000,MAX_BYTES=32*1024,TELEGRAM_TEXT_LIMIT=3900;
const FIELDS={problem:[15,6000],outcome:[10,4000],name:[1,80],contact:[3,160]};
const KEYS=new Set([...Object.keys(FIELDS),'phone','requestId','consent','website','turnstileToken']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const encoder=new TextEncoder();
const sha=async text=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text)))].map(n=>n.toString(16).padStart(2,'0')).join('');

function configuration(env){
  const origins=String(env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!env.DB||!/^\d{8,12}:[\w-]{30,}$/.test(env.TELEGRAM_BOT_TOKEN||'')||!/^\d+$/.test(env.TELEGRAM_CHAT_ID||'')||!env.TURNSTILE_SECRET_KEY||String(env.RATE_SALT||'').length<32||!origins.length)throw Error('configuration');
  return {origins,recipient:String(env.TELEGRAM_CHAT_ID)};
}

async function readJson(request){
  if(Number(request.headers.get('content-length')||0)>MAX_BYTES)throw Error('too_large');
  const reader=request.body?.getReader();if(!reader)throw Error('invalid_json');
  const chunks=[];let length=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>MAX_BYTES){await reader.cancel();throw Error('too_large');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw Error('invalid_json');}
}

function normalize(data){
  if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).some(k=>!KEYS.has(k)))throw Error('invalid_fields');
  if(typeof data.requestId!=='string'||!UUID.test(data.requestId)||data.consent!==true||typeof data.turnstileToken!=='string'||data.turnstileToken.length<1||data.turnstileToken.length>2048)throw Error('invalid_fields');
  data.requestId=data.requestId.toLowerCase();
  if(data.website!==undefined&&(typeof data.website!=='string'||data.website.trim()))throw Error('invalid_fields');
  const fields={};
  for(const [key,[min,max]]of Object.entries(FIELDS)){
    if(typeof data[key]!=='string')throw Error('invalid_fields');
    const value=data[key].trim();
    if(value.length<min||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)||/\S{513,}/.test(value))throw Error('invalid_fields');
    fields[key]=value;
  }
  // Optional for compatibility with existing open forms and deduplication hashes.
  // Append only a non-empty phone, preserving the previous field order otherwise.
  if(data.phone!==undefined){
    if(typeof data.phone!=='string')throw Error('invalid_fields');
    const phone=data.phone.trim().replace(/\u00a0/g,' '),digits=phone.replace(/[^0-9]/g,'');
    if(phone){
      if(phone.length>32||!/^\+?[0-9 ()-]+$/.test(phone)||digits.length<7||digits.length>15)throw Error('invalid_fields');
      fields.phone=phone;
    }
  }
  return fields;
}

// Telegram accepts up to 4096 characters. Leave room for the part marker and split
// only at paragraph/whitespace boundaries. Inputs reject individual 513+ character
// tokens, so a word is never broken to make delivery fit.
export function splitTelegramText(text,limit=TELEGRAM_TEXT_LIMIT){
  const source=String(text||'').trim();
  if(!source)return [];
  const chunks=[];let current='';
  const push=()=>{if(current){chunks.push(current);current='';}};
  for(const paragraph of source.split(/\n{2,}/)){
    const units=paragraph.match(/\S+(?:\s+|$)/g)||[];
    if(!units.length)continue;
    for(const unit of units){
      const word=unit.trimEnd(),space=unit.slice(word.length);
      if(word.length>limit)throw Error('word_too_long');
      if(!current){current=word;continue;}
      const separator=current.endsWith('\n\n')?'':' ';
      if(current.length+separator.length+word.length<=limit)current+=separator+word;
      else{push();current=word;}
    }
    if(current&&!current.endsWith('\n\n'))current+='\n\n';
  }
  push();
  return chunks.map(chunk=>chunk.trim());
}
function receipt(row){return {ok:true,accepted:true,requestId:row.id,delivery:row.status==='sent'?'sent':'saved'};}
async function getLead(env,id){return env.DB.prepare('SELECT id,fingerprint,status,payload IS NOT NULL AS has_payload FROM leads WHERE id=?').bind(id).first();}
async function quota(env,scope,bucket,expires,limit){
  return env.DB.prepare('INSERT INTO lead_limits(scope,bucket,count,expires_at) VALUES(?,?,1,?) ON CONFLICT(scope,bucket) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(scope,bucket,expires,limit).first();
}

async function checkTurnstile(env,data,origin,ip,fetcher){
  try{
    const response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/json'},redirect:'manual',signal:AbortSignal.timeout(10000),
      body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:data.turnstileToken,remoteip:ip,idempotency_key:data.requestId})
    });
    // workerd does not support redirect:'error'. Never follow a redirect with secrets.
    if(response.status>=300&&response.status<400||!response.ok)return 'verification_unavailable';
    const result=await response.json();
    const codes=Array.isArray(result?.['error-codes'])?result['error-codes']:[];
    if(codes.some(code=>['missing-input-secret','invalid-input-secret'].includes(code)))return 'verification_configuration';
    if(codes.includes('internal-error'))return 'verification_unavailable';
    if(codes.includes('timeout-or-duplicate'))return 'verification_expired';
    return result?.success===true&&result.hostname===new URL(origin).hostname&&result.action==='portfolio_lead'?null:'verification_failed';
  }catch{return 'verification_unavailable';}
}

export async function deliver(id,env,{fetcher=fetch,now=Date.now}={}){
  const {recipient}=configuration(env),timestamp=now(),attemptId=crypto.randomUUID();
  const row=await env.DB.prepare("UPDATE leads SET status='sending',attempts=attempts+1,attempt_id=?,lease_until=? WHERE id=? AND status='pending' AND next_attempt<=? AND created_at>? AND payload IS NOT NULL RETURNING *").bind(attemptId,timestamp+60000,id,timestamp,timestamp-DAY).first();
  if(!row)return;
  let status='uncertain',error=null,messageId=null,nextAttempt=timestamp;
  try{
    const f=JSON.parse(row.payload);
    const text=`Новая заявка с портфолио\n№ ${id}\n\nПроблема:\n${f.problem}\n\nЖелаемый результат:\n${f.outcome}\n\nИмя: ${f.name}${f.phone?`\nТелефон: ${f.phone}`:''}\nКонтакт: ${f.contact}`;
    const parts=splitTelegramText(text);let deliveredParts=0;
    for(let index=0;index<parts.length;index++){
      const part=parts.length===1?parts[index]:`Заявка № ${id} · ${index+1}/${parts.length}\n\n${parts[index]}`;
      if(part.length>4096)throw Error('telegram_part_too_long');
      const response=await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{
        method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),redirect:'manual',
        body:JSON.stringify({chat_id:recipient,text:part,link_preview_options:{is_disabled:true}})
      });
      if(response.status>=300&&response.status<400)throw Error('redirect_rejected');
      const body=await response.json();
      if(response.ok&&body.ok===true&&String(body.result?.chat?.id)===recipient&&Number.isInteger(body.result?.message_id)){
        messageId=body.result.message_id;
        deliveredParts++;
        continue;
      }
      if(response.status<500&&body.ok===false&&Number.isInteger(body.error_code)&&body.error_code>=400&&body.error_code<500){
        if(body.error_code===429&&row.attempts<3&&deliveredParts===0){status='pending';error='telegram_rate_limit';nextAttempt=timestamp+Math.max(60,Math.min(86400,Number(body.parameters?.retry_after)||60))*1000;}
        else if(deliveredParts>0){status='uncertain';error='partial_delivery';}
        else{status='failed';error='telegram_rejected';}
      }else error='delivery_unknown';
      break;
    }
    if(!error){status='sent';}
  }catch{error='delivery_unknown';/* A timeout may follow delivery. Never automatically resend. */}
  // If this commit fails, the expired sending lease becomes uncertain, not pending.
  await env.DB.prepare("UPDATE leads SET status=?,last_error=?,telegram_message_id=?,next_attempt=?,lease_until=NULL WHERE id=? AND status='sending' AND attempt_id=?").bind(status,error,messageId,nextAttempt,id,attemptId).run();
}

export async function handle(request,env,ctx,{fetcher=fetch,now=Date.now}={}){
  const origin=request.headers.get('Origin');
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'};
  const reply=(status,body,extra={})=>new Response(JSON.stringify(body),{status,headers:{...headers,...extra}});
  let config;
  try{config=configuration(env);}catch{return reply(503,{ok:false,error:'not_configured'});}
  if(!origin||!config.origins.includes(origin))return reply(403,{ok:false,error:'forbidden'});
  headers['Access-Control-Allow-Origin']=origin;
  if(new URL(request.url).pathname!=='/api/leads')return reply(404,{ok:false,error:'not_found'});
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
  if(request.method!=='POST')return reply(405,{ok:false,error:'method_not_allowed'},{Allow:'POST, OPTIONS'});
  if(request.headers.get('Content-Type')?.split(';')[0].trim()!=='application/json')return reply(415,{ok:false,error:'json_required'});
  let data,fields;
  try{data=await readJson(request);fields=normalize(data);}catch(error){return reply(error.message==='too_large'?413:400,{ok:false,error:['too_large','invalid_json'].includes(error.message)?error.message:'invalid_fields'});}
  try{
    const timestamp=now(),fingerprint=await sha(JSON.stringify(fields));
    const existing=await getLead(env,data.requestId);
    if(existing){
      if(existing.fingerprint!==fingerprint)return reply(409,{ok:false,error:'request_changed'});
      if(!existing.has_payload)return reply(410,{ok:false,error:'request_expired'});
      return reply(existing.status==='sent'?200:202,receipt(existing));
    }
    const ip=request.headers.get('CF-Connecting-IP');if(!ip)return reply(403,{ok:false,error:'forbidden'});
    // Salted digest only: no raw IP address is persisted.
    const ipKey=await sha(`${env.RATE_SALT}:${Math.floor(timestamp/DAY)}:${ip}`);
    const ipQuota=await quota(env,`ip:${ipKey}`,Math.floor(timestamp/600000),timestamp+DAY,5);
    if(!ipQuota)return reply(429,{ok:false,error:'rate_limited'},{'Retry-After':'600'});
    const verificationError=await checkTurnstile(env,data,origin,ip,fetcher);
    if(verificationError)return reply(['verification_unavailable','verification_configuration'].includes(verificationError)?503:400,{ok:false,error:verificationError});
    const dailyQuota=await quota(env,'accepted',Math.floor(timestamp/DAY),timestamp+2*DAY,1000);
    if(!dailyQuota)return reply(429,{ok:false,error:'daily_limit'},{'Retry-After':'3600'});
    await env.DB.prepare("INSERT INTO leads(id,fingerprint,payload,created_at,expires_at,status,attempts,next_attempt) VALUES(?,?,?,?,?,'pending',0,?) ON CONFLICT(id) DO NOTHING").bind(data.requestId,fingerprint,JSON.stringify(fields),timestamp,timestamp+30*DAY,timestamp).run();
    const saved=await getLead(env,data.requestId);
    if(!saved)throw Error('storage');
    if(saved.fingerprint!==fingerprint)return reply(409,{ok:false,error:'request_changed'});
    // No PII in the HTTP response. Telegram delivery can finish after the visitor leaves.
    if(saved.status==='pending')ctx.waitUntil(deliver(saved.id,env,{fetcher,now}).catch(()=>{}));
    return reply(saved.status==='sent'?200:202,receipt(saved));
  }catch{return reply(503,{ok:false,error:'temporarily_unavailable',ambiguous:true});}
}

export async function scheduled(env,{fetcher=fetch,now=Date.now}={}){
  configuration(env);const timestamp=now();
  await env.DB.batch([
    env.DB.prepare("UPDATE leads SET status='uncertain',last_error='interrupted_delivery',lease_until=NULL WHERE id IN (SELECT id FROM leads WHERE status='sending' AND lease_until<? LIMIT 10)").bind(timestamp),
    env.DB.prepare("UPDATE leads SET status='failed',last_error='delivery_expired' WHERE id IN (SELECT id FROM leads WHERE status='pending' AND created_at<? LIMIT 10)").bind(timestamp-DAY),
    env.DB.prepare('UPDATE leads SET payload=NULL WHERE id IN (SELECT id FROM leads WHERE expires_at<? AND payload IS NOT NULL LIMIT 50)').bind(timestamp),
    env.DB.prepare('DELETE FROM leads WHERE id IN (SELECT id FROM leads WHERE created_at<? LIMIT 50)').bind(timestamp-90*DAY),
    env.DB.prepare('DELETE FROM lead_limits WHERE rowid IN (SELECT rowid FROM lead_limits WHERE expires_at<? LIMIT 50)').bind(timestamp)
  ]);
  const candidate=await env.DB.prepare("SELECT id FROM leads WHERE status='pending' AND next_attempt<=? AND created_at>? AND payload IS NOT NULL ORDER BY next_attempt LIMIT 1").bind(timestamp,timestamp-DAY).first();
  if(candidate)await deliver(candidate.id,env,{fetcher,now});
}

export default {
  fetch:(request,env,ctx)=>handle(request,env,ctx),
  scheduled:(_event,env,ctx)=>ctx.waitUntil(scheduled(env).catch(()=>{}))
};
