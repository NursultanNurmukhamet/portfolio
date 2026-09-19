import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../dist/lab.css',import.meta.url),'utf8');
const block=html.match(/<section class="lab-section"[\s\S]*?<\/section>/)?.[0];

test('side projects have an independent static section before contact',()=>{
  assert.ok(block);
  assert.ok(block.includes('id="lab"'));
  assert.ok(block.includes('aria-labelledby="lab-heading"'));
  assert.ok(html.indexOf('id="lab"')>html.indexOf('id="projects"'));
  assert.ok(html.indexOf('id="lab"')<html.indexOf('id="contact"'));
  assert.ok(html.includes('href="lab.css"'));
});

test('three bilingual cards link exactly to the requested repositories',()=>{
  const cards=[...block.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(match=>match[0]);
  assert.equal(cards.length,3);
  for(const [index,repo] of ['AgentF','MetaCrypt','shut-up-and-listen'].entries()){
    assert.ok(cards[index].includes(`href="https://github.com/NursultanNurmukhamet/${repo}"`));
    assert.ok(cards[index].includes('target="_blank" rel="noopener noreferrer"'));
    assert.ok(cards[index].includes('class="lab-description"'));
    assert.ok(cards[index].includes('class="lab-description lab-en" lang="en"'));
    assert.ok(cards[index].includes('aria-hidden="true"'));
  }
  assert.ok(cards[2].includes('ДОСТУП МОЖЕТ БЫТЬ ОГРАНИЧЕН'));
  assert.doesNotMatch(block,/open.source|production|winner|100%|гарантир/iu);
});

test('section adds no network-dependent covers, embeds, forms or executable third-party code',()=>{
  assert.doesNotMatch(block,/<script|<iframe|<form|<img|<audio|<video|on\w+=/i);
  assert.doesNotMatch(css,/https?:|@import|url\(/i);
  assert.ok(css.includes('prefers-reduced-motion:reduce'));
  assert.ok(css.includes('.lab-repo:focus-visible'));
  assert.ok(css.includes('@media(max-width:359px)'));
});
