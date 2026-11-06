import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/home.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../dist/home.js',import.meta.url),'utf8');
const shared=readFileSync(new URL('../dist/tui.css',import.meta.url),'utf8');

test('the first screen answers who, what and how to reach: name, role, two actions, CV and direct links',()=>{
  const hero=html.slice(html.indexOf('<section class="hero"'),html.indexOf('id="featured"'));
  assert.match(hero,/<h1 id="hero-heading">Нурсултан<br>Нурмухамет<\/h1>/);
  assert.match(hero,/Backend \/ Infrastructure Engineer/);
  assert.match(hero,/class="btn btn-primary" href="#featured"/);
  assert.match(hero,/class="btn btn-secondary" href="#contact"/);
  assert.match(hero,/href="assets\/Nursultan-Nurmukhamet-CV\.pdf"/);
  assert.ok(existsSync(new URL('../dist/assets/Nursultan-Nurmukhamet-CV.pdf',import.meta.url)));
  for(const href of ['https://github.com/NursultanNurmukhamet','https://t.me/NurmukhametNursultan','mailto:nnnursultan9506@gmail.com'])assert.ok(hero.includes(`href="${href}"`),href);
  assert.doesNotMatch(html,/НАХОДК|терминал|whoami|@sapa|Седьмая система|ДИЗАЙН-КОНЦЕПЦИЯ|DEMO/i);
});

test('the 3D scene is optional: static stand-in, rack links as plain anchors, lazy import only on wide screens',()=>{
  assert.match(html,/<canvas id="orbit-canvas" aria-hidden="true"><\/canvas>/);
  assert.match(html,/class="scene-static" aria-hidden="true"/);
  const racks=[...html.matchAll(/<a href="([^"]+)" data-rack="(\d)">/g)].map(match=>match[1]);
  assert.deepEqual(racks,['#work','mylab.html','#projects']);
  assert.doesNotMatch(html,/<script[^>]*src="scene\.js/,'Three.js must not be loaded eagerly');
  assert.ok(js.includes("import('./scene.js"));
  assert.ok(js.includes("matchMedia('(min-width:901px)')"));
  assert.ok(js.includes('wants-click')&&html.includes('id="scene-open"'),'phones get an explicit button');
});

test('featured section tells three stories and the work case deep-links into the seven systems',()=>{
  assert.equal((html.match(/<article class="feature /g)||[]).length,3);
  assert.ok(html.includes('data-cover="mylab"')&&html.includes('data-cover="agentf"'));
  assert.ok(html.includes('href="#work-sign"')&&html.includes('id="work-sign"'));
  const cards=html.match(/<li class="work-card"/g)||[];
  assert.equal(cards.length,7);
  assert.equal((html.match(/<details class="work-more">/g)||[]).length,7);
  const filters=[...html.matchAll(/data-filter="([^"]+)" aria-pressed="(true|false)"/g)];
  assert.ok(filters.length>=4);
  assert.equal(filters.filter(match=>match[2]==='true').length,1);
  assert.ok(js.includes('openTargetCard'),'a hash link opens the targeted card');
});

test('catalog lists the five open projects with real destinations',()=>{
  assert.equal((html.match(/<li class="catalog-card">/g)||[]).length,5);
  for(const href of ['mylab.html','projects/university/','https://github.com/NursultanNurmukhamet/AgentF','https://nursultannurmukhamet.github.io/MetaCrypt/','https://t.me/ShutUpandListen_Bot'])assert.ok(html.includes(`href="${href}"`),href);
  for(const match of html.matchAll(/<a [^>]*target="_blank"[^>]*>/g))assert.match(match[0],/rel="noopener noreferrer"/);
});

test('roadmap commits expand and lanes can be toggled with pressed buttons',()=>{
  assert.equal((html.match(/<li class="git-commit"/g)||[]).length,8);
  assert.equal((html.match(/<details class="git-msg">/g)||[]).length,8);
  assert.equal((html.match(/git-legend[\s\S]*?<\/div>/)[0].match(/aria-pressed="true"/g)||[]).length,4);
  assert.match(html,/<svg class="git-graph" id="git-graph" aria-hidden="true"/);
  assert.ok(js.includes('BRANCHES')&&js.includes("gitWrap.classList.add('has-graph')"));
  assert.ok(shared.includes('.git-wrap:not(.has-graph)::before'),'lanes remain visible without JavaScript');
});

test('page keeps state local, respects reduced motion and readable minimum sizes',()=>{
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|localStorage/,'nothing is stored or sent');
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'));
  const sizes=[...css.matchAll(/font:[^;}]*?(\d+)px/g)].map(match=>Number(match[1]));
  assert.ok(Math.min(...sizes)>=11,'no text below 11px');
  assert.match(css,/\.btn\{[^}]*min-height:50px/);
  assert.match(css,/\.rack-links a\{[^}]*min-height:44px/);
  assert.match(shared,/\.tui-tabs\{position:fixed;left:0;right:0;bottom:0/,'phones keep the bottom navigation bar');
});
