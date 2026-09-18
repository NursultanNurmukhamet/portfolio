// Safe HTTP smoke tests: all requests must fail before storing/sending a lead.
// Usage: node smoke.mjs https://YOUR-WORKER.workers.dev [https://YOUR_USERNAME.github.io]
import assert from 'node:assert/strict';
const base=new URL(process.argv[2]);
assert.equal(base.protocol,'https:');
const origin=new URL(process.argv[3]||'http://127.0.0.1:4173').origin;
const cases=[
  ['preflight',{method:'OPTIONS',headers:{Origin:origin}},204,null],
  ['missing origin',{method:'POST'},403,'forbidden'],
  ['foreign origin',{method:'POST',headers:{Origin:'https://example.invalid'}},403,'forbidden'],
  ['read forbidden',{method:'GET',headers:{Origin:origin}},405,'method_not_allowed'],
  ['unknown path',{method:'GET',headers:{Origin:origin}},404,'not_found','/not-a-route'],
  ['wrong content type',{method:'POST',headers:{Origin:origin,'Content-Type':'text/plain'},body:'test'},415,'json_required'],
  ['malformed JSON',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'{'},400,'invalid_json'],
  ['invalid fields',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({chat_id:'not-allowed'})},400,'invalid_fields'],
  ['oversized body',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:'x'.repeat(13*1024)},413,'too_large']
];
for(const [label,init,expectedStatus,expectedError,path='/api/leads']of cases){
  const response=await fetch(new URL(path,base),{...init,redirect:'error',signal:AbortSignal.timeout(60000)});
  assert.equal(response.status,expectedStatus,label);
  assert.equal(response.headers.get('cache-control'),'no-store',label);
  if(expectedStatus===403)assert.equal(response.headers.get('access-control-allow-origin'),null,label);
  else assert.equal(response.headers.get('access-control-allow-origin'),origin,label);
  if(expectedError){const body=await response.json();assert.equal(body.ok,false,label);assert.equal(body.error,expectedError,label);assert.notEqual(body.accepted,true,label);}
  console.log(`PASS ${label}: ${response.status}`);
}
console.log('HTTP guard checks passed. No valid lead or Telegram message submitted.');
