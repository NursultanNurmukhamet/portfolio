import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const configSource=readFileSync(new URL('../dist/contact-config.js',import.meta.url),'utf8');
const contactSource=readFileSync(new URL('../dist/contact.js',import.meta.url),'utf8');
const publicSandbox={window:{}};
vm.runInNewContext(configSource,publicSandbox);
const publicConfig=publicSandbox.window.PORTFOLIO_CONTACTS;

// Execute the production link builder in isolation; no provider, network or
// form submission is needed to verify configured navigation and draft links.
const start=contactSource.indexOf('  const approved=[];');
const end=contactSource.indexOf('  function showStep(',start);
assert.ok(start>=0&&end>start,'the direct-contact initialization block exists');
const linksSource=contactSource.slice(start,end)+'\nwindow.testLinks={approved,makeLink};';
function fixture(config=publicConfig,draft=''){
  const links={children:[],append(child){this.children.push(child);}};
  const pending={hidden:false};
  const context={
    config,message:{value:draft},
    window:{portfolioIcon:()=>'<svg></svg>'},
    document:{
      createElement(tag){return {tag,children:[],textContent:'',setAttribute(name,value){this[name]=value;},append(...children){this.children.push(...children);}};},
      querySelector(selector){if(selector==='#direct-contact-links')return links;if(selector==='#contact-pending')return pending;throw new Error(selector);}
    }
  };
  vm.runInNewContext(linksSource,context);
  return {links:links.children,pending,...context.window.testLinks};
}

test('approved public contacts are exact and do not add an email or private credential',()=>{
  assert.equal(publicConfig.telegram,'https://t.me/NurmukhametNursultan');
  assert.equal(publicConfig.whatsapp,'https://wa.me/77000225339');
  assert.equal(publicConfig.email,'');
  assert.doesNotMatch(configSource,/\b\d{8,12}:[A-Za-z0-9_-]{30,}\b|TELEGRAM_BOT_TOKEN|TELEGRAM_CHAT_ID/);
  assert.equal(publicConfig.cloudEndpoint,'https://nursultan-portfolio-leads.nursultan-portfolio-leads.workers.dev/api/leads');
});

test('Telegram and WhatsApp replace the pending notice with safe direct links',()=>{
  const f=fixture();
  assert.equal(f.links.length,2);
  assert.equal(f.pending.hidden,true);
  assert.deepEqual(f.links.map(link=>link.href),['https://t.me/NurmukhametNursultan','https://wa.me/77000225339']);
  assert.match(f.links[0].textContent,/@NurmukhametNursultan/);
  assert.match(f.links[1].textContent,/WhatsApp.*\+77000225339/);
  for(const link of f.links){assert.equal(link.target,'_blank');assert.equal(link.rel,'noopener noreferrer');}
});

test('WhatsApp result link opens an encoded message draft, without automatic sending',()=>{
  const draft='Здравствуйте!\nЗадача: сайт & форма? +7 700';
  const f=fixture(publicConfig,draft);
  const whatsapp=f.approved.find(contact=>contact.type==='whatsapp');
  const link=f.makeLink(whatsapp,true);
  const url=new URL(link.href);
  assert.equal(url.origin+url.pathname,publicConfig.whatsapp);
  assert.equal(url.searchParams.get('text'),draft);
  assert.equal(link.textContent,'Открыть WhatsApp');
  assert.equal(link.target,'_blank');
  assert.equal(link.rel,'noopener noreferrer');
  assert.equal(f.makeLink(f.approved.find(contact=>contact.type==='telegram'),true).textContent,'Открыть Telegram');
});

test('unconfigured or malformed destinations never become public links',()=>{
  for(const config of [{},{telegram:'javascript:alert(1)',whatsapp:'https://wa.me.evil.test/77000225339'},{telegram:'https://t.me/user?redirect=evil',whatsapp:'https://wa.me/+77000225339'},{whatsapp:'https://wa.me/0000000'}]){
    const f=fixture(config);assert.equal(f.links.length,0);assert.equal(f.pending.hidden,false);
  }
});
