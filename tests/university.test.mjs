import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../dist/projects/university/', import.meta.url));
const html = readFileSync(path.join(root, 'index.html'), 'utf8');
const css = readFileSync(path.join(root, 'style.css'), 'utf8');
const js = readFileSync(path.join(root, 'main.js'), 'utf8');

test('university groups the three named projects and the contribution certificate', () => {
  assert.equal((html.match(/class="project-card"/g) || []).length, 3);
  for (const id of ['unitrack', 'masterclass', 'speech', 'certificate']) assert.ok(html.includes(`id="${id}"`));
  for (const name of ['UniTrack', 'AI MASTERCLASS MATERIALS', 'Whisper/MMS', '07.09.2026']) assert.ok(html.includes(name));
  assert.doesNotMatch(html, /privacy-note|подпись скрыты|signature hidden|public copy|публичная копия/i);
  assert.equal((html.match(/width="2561" height="1855"/g) || []).length, 2);
});

test('local links, assets and anchors resolve relative to a GitHub Pages subpath', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  references.push(...[...css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)].map(match => match[1]));
  for (const reference of references) {
    if (/^https?:/.test(reference)) continue;
    if (reference.startsWith('#')) { assert.ok(ids.includes(reference.slice(1)), reference); continue; }
    assert.ok(!reference.startsWith('/'), reference);
    assert.ok(existsSync(path.resolve(root, reference.split(/[?#]/)[0])), reference);
  }
});

test('bilingual controls and accessible, progressive certificate preview exist', () => {
  assert.ok(html.includes('data-set-lang="ru"'));
  assert.ok(html.includes('data-set-lang="en"'));
  assert.ok(js.includes('document.documentElement.lang = language'));
  assert.ok(js.includes('dialog.showModal()'));
  assert.ok(js.includes("dialog.addEventListener('close'"));
  assert.ok(js.includes('lastFocus?.focus'));
  assert.ok(html.includes('href="assets/certificate-public.png?v=2"'));
  assert.ok(css.includes('prefers-reduced-motion:reduce'));
});

test('case has no form, tracking, credentials or student recordings', () => {
  assert.doesNotMatch(html, /<form|type="file"|<audio|<iframe/i);
  assert.doesNotMatch(html + css + js, /\bfetch\s*\(|XMLHttpRequest|api\.telegram\.org|Bearer\s+[A-Za-z0-9]|\d{8,12}:[A-Za-z0-9_-]{30,}/);
  assert.doesNotMatch(html, /certificate_original|certificate_public_redacted|AppData|C:\\/);
  for (const link of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) assert.ok(link[0].includes('noopener noreferrer'));
});
