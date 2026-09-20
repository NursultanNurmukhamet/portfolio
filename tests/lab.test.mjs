import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/gallery.css',import.meta.url),'utf8');
const coverCss=readFileSync(new URL('../dist/personal-covers.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../dist/gallery.js',import.meta.url),'utf8');
const personal=js.split('\n').filter(line=>line.includes('isPersonal:true'));
const visuals=js.match(/const personalVisuals=\{[\s\S]*?\n  \};/)?.[0];

test('three personal projects join the gallery without a duplicate standalone section',()=>{
  assert.doesNotMatch(html,/id="lab"|href="lab.css"/);
  assert.equal(personal.length,3);
  for(const [index,cover] of ['agentf','metacrypt','listen'].entries()){
    assert.ok(personal[index].includes("cover:'"+cover+"'"));
    assert.ok(personal[index].includes("ru:'"));
    assert.ok(personal[index].includes("en:'"));
    assert.ok(personal[index].includes("angle:"+(index%2?-5:5)));
  }
  assert.ok(html.includes('6 ИСТОРИЙ'));
  assert.ok(js.includes('showcase.dataset.projectCount=String(demos.length)'));
});

test('personal actions open the exact repository, application and Telegram bot requested',()=>{
  const destinations=[
    'https://github.com/NursultanNurmukhamet/AgentF',
    'https://nursultannurmukhamet.github.io/MetaCrypt/',
    'https://t.me/ShutUpandListen_Bot'
  ];
  for(const [index,href] of destinations.entries())assert.ok(personal[index].includes("href:'"+href+"'"));
  assert.ok(personal[1].includes('isApp:true'));
  assert.ok(personal[2].includes('isBot:true'));
  assert.ok(personal[2].includes("title:'ULMusic'"));
  assert.ok(personal[2].includes("coverTitle:'UL<br>MUSIC'"));
  for(const label of ['Открыть GitHub','Открыть приложение','Открыть бота'])assert.ok(js.includes(label));
  assert.ok(js.includes("link.target='_blank';link.rel='noopener noreferrer'"));
  assert.doesNotMatch(personal.join(''),/github.com\/NursultanNurmukhamet\/(?:MetaCrypt|shut-up-and-listen)|open.source|winner|100%|гарантир/iu);
});

test('new gallery covers use local artwork and six-button navigation fits small screens',()=>{
  assert.match(html,/href="personal-covers\.css(?:\?v=[^"]+)?"/);
  for(const cover of ['agentf','metacrypt','listen'])assert.ok(coverCss.includes('.paper-cover.cover-'+cover));
  assert.doesNotMatch(coverCss,/@import|url\(/i);
  assert.ok(visuals);
  assert.equal((visuals.match(/<svg /g)||[]).length,2);
  assert.doesNotMatch(visuals,/<script|<iframe|<form|<img|<audio|<video|https?:/i);
  assert.equal((visuals.match(/aria-hidden/g)||[]).length,2);
  assert.ok(css.includes('.gallery-pagination button:focus-visible'));
  assert.ok(css.includes('@media(max-width:519px)'));
  assert.ok(css.includes('height:var(--gallery-height,400svh)'));
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
  }
  assert.ok(js.includes('data-matches'));
  assert.ok(js.includes('Individual match wins'));
  assert.ok(js.includes("dialog.classList.add('matches-preview')"));
  assert.ok(js.includes("lastFocus=matchTrigger"));
  assert.ok(css.includes('cursor:zoom-in'));
});
