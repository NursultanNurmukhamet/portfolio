import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '../dist');
const html = readFileSync(resolve(root, 'mylab.html'), 'utf8');
const cover = readFileSync(resolve(root, 'mylab-cover.js'), 'utf8');
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
test('MyLab cover links to the real case without the old 3D image', () => {
  assert.ok(cover.includes("action.href = 'mylab.html'"));
  assert.ok(cover.includes('MY<span>LAB</span>'));
  assert.ok(!cover.includes('mylab-core.png'));
  assert.ok(cover.includes('От кабеля до кластера.'));
});
