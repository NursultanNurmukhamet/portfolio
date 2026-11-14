import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '../dist');
const html = readFileSync(resolve(root, 'mylab.html'), 'utf8');
const cover = readFileSync(resolve(root, 'gallery.js'), 'utf8');
const index = readFileSync(resolve(root, 'index.html'), 'utf8');
test('MyLab has six linked chapters and a system-map hero', () => {
  assert.equal((html.match(/data-chapter=/g) || []).length, 6);
  assert.equal((html.match(/class="ml-map-node /g) || []).length, 6);
  assert.ok(!html.includes('class="ml-hero-proof"'));
});
test('MyLab ships all technology logos and local page resources', () => {
  const logos = [...html.matchAll(/src="(assets\/logos\/[^"]+)"/g)];
  assert.equal(logos.length, 24);
  for (const [,path] of logos) {
    assert.ok(existsSync(resolve(root, path)), path);
    assert.match(readFileSync(resolve(root, path), 'utf8'), /<svg[\s>]/);
  }
  for (const [,path] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^(https?:|mailto:)/.test(path)) continue;
    assert.ok(existsSync(resolve(root, path.split(/[?#]/)[0])), path);
  }
});
test('MyLab is an inventory item that links to the real case', () => {
  const inventory = readFileSync(resolve(root, 'inventory.js'), 'utf8');
  assert.ok(inventory.includes("id:'mylab'"));
  assert.ok(inventory.includes("['Открыть кейс MyLab','mylab.html']"));
  assert.ok(!cover.includes('mylab'), 'the old gallery cover is gone');
  assert.ok(!index.includes('mylab-cover'), 'the old cover stylesheet and script are gone');
  assert.ok(!existsSync(resolve(root, 'mylab-cover.js')) && !existsSync(resolve(root, 'mylab-cover.css')));
});
