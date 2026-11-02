import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/tui.css',import.meta.url),'utf8');
const js=readFileSync(new URL('../dist/tui.js',import.meta.url),'utf8');

test('the terminal sits on the first screen with clickable commands for non-technical visitors',()=>{
  const hero=html.slice(html.indexOf('id="top"'),html.indexOf('id="work"'));
  assert.match(hero,/<form class="terminal" id="terminal"/);
  const chips=[...hero.matchAll(/<button type="button" data-cmd="([^"]+)">/g)].map(match=>match[1]);
  for(const command of ['whoami','deploy','top','ls projects','theme','ping nursultan','help'])assert.ok(chips.includes(command),command);
  for(const command of chips){
    const name=command.split(' ')[0];
    assert.ok(new RegExp(`(^|[\\s{,])${name}(\\(|:|,)`,'m').test(js),`terminal implements ${name}`);
  }
  assert.match(hero,/role="log" aria-live="polite"/);
});

test('seven systems are shown and every one expands with native details',()=>{
  const cards=html.match(/<li class="work-card[^"]*"/g)||[];
  assert.equal(cards.length,7);
  assert.equal((html.match(/<details class="work-more">/g)||[]).length,7);
  assert.doesNotMatch(html,/work-card-locked|Седьмая система/);
  assert.ok(existsSync(new URL('../dist/assets/Nursultan-Nurmukhamet-CV.pdf',import.meta.url)),'the CV link in the hero has a real file behind it');
  const filters=[...html.matchAll(/data-filter="([^"]+)" aria-pressed="(true|false)"/g)];
  assert.ok(filters.length>=4);
  assert.equal(filters.filter(match=>match[2]==='true').length,1,'exactly one filter starts pressed');
});

test('roadmap commits expand and lanes can be toggled with pressed buttons',()=>{
  assert.equal((html.match(/<li class="git-commit"/g)||[]).length,8);
  assert.equal((html.match(/<details class="git-msg">/g)||[]).length,8);
  assert.equal((html.match(/git-legend[\s\S]*?<\/div>/)[0].match(/aria-pressed="true"/g)||[]).length,4);
  assert.match(html,/<svg class="git-graph" id="git-graph" aria-hidden="true"/);
  assert.ok(js.includes('BRANCHES')&&js.includes("gitWrap.classList.add('has-graph')"));
  assert.ok(css.includes('.git-wrap:not(.has-graph)::before'),'lanes remain visible without JavaScript');
});

test('finds, themes and the release game keep state local and respect reduced motion',()=>{
  const flags=js.match(/const FLAGS=\[([\s\S]*?)\n  \];/)[1];
  assert.equal((flags.match(/\{id:'/g)||[]).length,10);
  assert.match(html,/class="flag-total">10</);
  assert.doesNotMatch(js,/\bfetch\s*\(|XMLHttpRequest|sendBeacon/,'progress is never sent anywhere');
  assert.ok(js.includes('try{localStorage.setItem'),'storage failures are tolerated');
  assert.ok(js.includes("if(quiet()){bar.style.width='100%';return;}"),'pipeline stages finish instantly without motion');
  assert.ok(js.includes("if(!quiet()){let ticks=0;topTimer=setInterval"),'live skills only animate when motion is allowed');
  for(const theme of ['green','amber','ice'])assert.ok(css.includes(`:root[data-theme=${theme}]`),theme);
  assert.ok(js.includes("name==='ice'&&!rewarded"),'the secret theme stays locked until all finds');
});

test('phones get a bottom navigation bar and readable minimum sizes',()=>{
  const mobile=css.slice(css.indexOf('@media(max-width:759px)'));
  assert.match(mobile,/\.tui-tabs\{position:fixed;left:0;right:0;bottom:0/);
  assert.match(mobile,/\.tui-bar\{[^}]*backdrop-filter:none/,'the header must not trap the fixed bottom bar');
  assert.match(css,/--mute:#8692a4/);
  const sizes=[...css.matchAll(/font-size:(\d+)px/g)].map(match=>Number(match[1]));
  assert.ok(Math.min(...sizes)>=11,'no text below 11px');
});
