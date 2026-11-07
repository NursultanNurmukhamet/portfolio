import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/home.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../dist/home.js',import.meta.url),'utf8');
const shared=readFileSync(new URL('../dist/tui.css',import.meta.url),'utf8');
const inventorySource=readFileSync(new URL('../dist/inventory.js',import.meta.url),'utf8');
const sandbox={window:{}};
vm.runInNewContext(inventorySource,sandbox,{filename:'inventory.js'});
const {CATEGORIES,ITEMS}=sandbox.window.portfolioInventory;

test('the first screen answers who, what and how to reach: name, role, actions, CV and direct links',()=>{
  const hero=html.slice(html.indexOf('<section class="hero"'),html.indexOf('id="inventory"'));
  assert.match(hero,/<h1 id="hero-heading">Нурсултан<br>Нурмухамет<\/h1>/);
  assert.match(hero,/Backend \/ Infrastructure Engineer/);
  assert.match(hero,/class="btn btn-primary" href="#inventory"/);
  assert.match(hero,/href="assets\/Nursultan-Nurmukhamet-CV\.pdf"/);
  assert.ok(existsSync(new URL('../dist/assets/Nursultan-Nurmukhamet-CV.pdf',import.meta.url)));
  for(const href of ['https://github.com/NursultanNurmukhamet','https://t.me/NurmukhametNursultan','mailto:nnnursultan9506@gmail.com'])assert.ok(hero.includes(`href="${href}"`),href);
  assert.doesNotMatch(html,/НАХОДК|терминал|whoami|@sapa|Седьмая система|ДИЗАЙН-КОНЦЕПЦИЯ|DEMO/i);
});

test('inventory data: five shelves, every item complete, every picture present, every link safe',()=>{
  assert.equal(JSON.stringify(CATEGORIES.map(category=>category.id)),JSON.stringify(['all','work','code','hardware','infra','certs']));
  assert.ok(ITEMS.length>=25);
  const ids=new Set();
  for(const item of ITEMS){
    assert.ok(!ids.has(item.id),`duplicate id ${item.id}`);ids.add(item.id);
    assert.ok(CATEGORIES.some(category=>category.id===item.cat&&category.id!=='all'),`${item.id} has a real category`);
    assert.ok(item.title&&item.short&&item.long?.length,`${item.id} has title, short and long text`);
    assert.ok(item.image||item.cover||item.tile,`${item.id} has a picture`);
    if(item.image){
      assert.ok(existsSync(new URL('../dist/'+item.image.src,import.meta.url)),item.image.src);
      assert.ok(item.image.alt&&item.image.w&&item.image.h,`${item.id} image has alt and size`);
    }
    for(const [label,href,external] of item.links||[]){
      assert.ok(label&&href,`${item.id} link`);
      if(/^https?:/.test(href))assert.equal(external,true,`${item.id}: ${href} must open in a new tab`);
      else if(href!=='#matches')assert.ok(existsSync(new URL('../dist/'+href.split(/[?#]/)[0],import.meta.url)),href);
    }
  }
  assert.equal(ITEMS.filter(item=>item.cat==='work').length,7);
  assert.equal(ITEMS.filter(item=>item.cat==='certs').length,4);
  assert.doesNotMatch(inventorySource,/10\.128\.|sapatech\.(?:kz|local)|\d{8,12}:[A-Za-z0-9_-]{30,}|85–100 %/,'no internal addresses, tokens or unverified percentages');
});

test('the page renders cards from data, filters by tab and search, and opens a detail dialog with navigation',()=>{
  for(const id of ['inventory-tabs','inventory-grid','inventory-search','inventory-empty','item-dialog','item-prev','item-next','item-close'])assert.ok(html.includes(`id="${id}"`),id);
  assert.ok(js.includes('renderGrid')&&js.includes('setCategory')&&js.includes("search.addEventListener('input'"));
  assert.ok(js.includes('dialog.showModal()')&&js.includes("event.key==='ArrowRight'")&&js.includes("dialog.addEventListener('close'"));
  assert.ok(js.includes('#item='),'items have deep links');
  assert.ok(js.includes('escapeHtml(item.title)'),'data is escaped before rendering');
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage/,'nothing is stored or sent');
  for(const match of html.matchAll(/<a [^>]*target="_blank"[^>]*>/g))assert.match(match[0],/rel="noopener noreferrer"/);
});

test('readable minimum sizes, tap targets and reduced motion',()=>{
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  const sizes=[...css.matchAll(/font:[^;}]*?(\d+)px/g)].map(match=>Number(match[1]));
  assert.ok(Math.min(...sizes)>=11,'no text below 11px');
  assert.match(css,/\.btn\{[^}]*min-height:50px/);
  assert.match(css,/\.inventory-tabs button\{[^}]*min-height:44px/);
  assert.match(css,/\.item-dialog-nav button\{[^}]*width:44px;height:44px/);
  assert.match(shared,/\.tui-tabs\{position:fixed;left:0;right:0;bottom:0/,'phones keep the bottom navigation bar');
});
