import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/tui.css',import.meta.url),'utf8');
const coverCss=readFileSync(new URL('../dist/personal-covers.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../dist/gallery.js',import.meta.url),'utf8');
const home=readFileSync(new URL('../dist/home.js',import.meta.url),'utf8');
const inventory=readFileSync(new URL('../dist/inventory.js',import.meta.url),'utf8');
const visuals=js.match(/const personalVisuals=\{[\s\S]*?\n  \};/)?.[0];

test('personal projects live in the inventory; drawn covers only where there is no photo',()=>{
  assert.doesNotMatch(html,/id="lab"|href="lab.css"/);
  for(const cover of ['metacrypt','listen']){
    assert.ok(inventory.includes(`cover:'${cover}'`),`${cover} uses a drawn cover`);
    assert.ok(js.includes(`cover:'${cover}'`),`${cover} cover is defined`);
  }
  assert.ok(inventory.includes("id:'agentf'")&&inventory.includes('agentf-match.webp'),'AgentF shows a real match screenshot');
  assert.doesNotMatch(html+js+home+inventory,/\bDEMO\b|концепц|образец|ОБРАЗЕЦ|демонстрац|orbit-cup/,'no demo or placeholder wording remains');
  assert.doesNotMatch(js,/mylab|campus|agentf-tactics|fm-action|isCase/,'covers of the old gallery are gone');
  assert.ok(js.includes('window.portfolioProjects=Object.freeze('));
  assert.ok(home.includes('gallery.cover(demo)'),'covers come from the shared gallery data');
});

test('personal project links go to the exact application and Telegram bot',()=>{
  for(const href of ['https://nursultannurmukhamet.github.io/MetaCrypt/','https://t.me/ShutUpandListen_Bot'])assert.ok(inventory.includes(`'${href}',true`),href);
  assert.doesNotMatch(inventory,/github\.com\/NursultanNurmukhamet\/(?:AgentF|shut-up-and-listen)|open.source|winner|100%|гарантир/iu);
});

test('drawn covers use local artwork and the page stays readable on small screens',()=>{
  assert.match(html,/href="personal-covers\.css(?:\?v=[^"]+)?"/);
  for(const cover of ['metacrypt','listen'])assert.ok(coverCss.includes('.paper-cover.cover-'+cover));
  assert.doesNotMatch(coverCss,/@import|url\(/i);
  assert.ok(visuals);
  assert.equal((visuals.match(/<svg /g)||[]).length,2);
  assert.doesNotMatch(visuals,/<script|<iframe|<form|<img|<audio|<video|https?:/i);
  assert.equal((visuals.match(/aria-hidden/g)||[]).length,2);
  assert.ok(css.includes('@media(max-width:759px)'));
  assert.ok(css.includes('prefers-reduced-motion:reduce'));
  assert.ok(html.includes('id="inventory-grid"')&&home.includes('class="item-card"'),'projects render as inventory cards');
});

test('AgentF displays three existing match screenshots with exact opponents and scores',()=>{
  const matches=[
    ['match-total-attack.png','Total Attack United','2:1',1200,647],
    ['match-benchmark.png','The Benchmark FC','2:0',1204,650],
    ['match-fort-knox.png','Fort Knox Athletic','2:0',1200,647]
  ];
  for(const [file,opponent,score,width,height] of matches){
    assert.ok(js.includes("file:'assets/agentf/"+file+"',opponent:'"+opponent+"',score:'"+score+"'"));
    const image=new URL('../dist/assets/agentf/'+file,import.meta.url);
    assert.ok(existsSync(image));
    const png=readFileSync(image);
    assert.equal(png.readUInt32BE(16),width);
    assert.equal(png.readUInt32BE(20),height);
    assert.ok(existsSync(new URL('../dist/assets/agentf/'+file.replace('.png','.webp'),import.meta.url)),'a WebP preview sits next to the original');
  }
  assert.ok(inventory.includes("'#matches'"),'the AgentF window opens the matches');
  assert.ok(js.includes("dialog.classList.add('matches-preview')"));
  assert.ok(js.includes("lastFocus=matchTrigger"));
  assert.ok(css.includes('cursor:zoom-in'));
});

test('main page references only files that exist and keeps external links safe',()=>{
  for(const [,path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    if(/^(https?:|mailto:)/.test(path))continue;
    assert.ok(existsSync(new URL('../dist/'+path.split(/[?#]/)[0],import.meta.url)),path);
  }
  for(const link of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g))assert.ok(link[0].includes('noopener noreferrer'),link[0]);
  assert.doesNotMatch(html+js+home,/\bfetch\s*\(|api\.telegram\.org|\d{8,12}:[A-Za-z0-9_-]{30,}/,'the main page scripts make no network calls of their own');
});

test('links from the inner pages back to the main page land on sections that exist',()=>{
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
  for(const file of ['mylab.html','projects/university/index.html']){
    const page=readFileSync(new URL('../dist/'+file,import.meta.url),'utf8');
    // A link is either a section of the main page or a deep link to an inventory item.
    const inventory=readFileSync(new URL('../dist/inventory.js',import.meta.url),'utf8');
    for(const [,hash,item] of page.matchAll(/index\.html#([\w-]+)(?:=([\w-]+))?/g)){
      if(hash==='item')assert.ok(inventory.includes("{id:'"+item+"',"),file+' links to item '+item);
      else assert.ok(ids.has(hash),file+' links to #'+hash);
    }
  }
});
