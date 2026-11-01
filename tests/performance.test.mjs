import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';
import {gzipSync} from 'node:zlib';

const read = name => readFileSync(new URL(`../${name}`, import.meta.url));
const sceneSource = read('src/scene.js').toString().replace(/^import .*;\r?\n/, '');
function classes(...initial) {
  const values = new Set(initial);
  return {contains: value => values.has(value), add: value => values.add(value), remove: value => values.delete(value),
    toggle(value, force) { const next = force ?? !values.has(value); next ? values.add(value) : values.delete(value); return next; }};
}
function events() {
  const listeners = new Map();
  return {addEventListener(name, callback) { const list = listeners.get(name) || []; list.push(callback); listeners.set(name, list); },
    emit(name, event = {}) { for(const callback of listeners.get(name) || [])callback(event); }};
}
function frameClock() {
  let id = 0, time = 0;
  const frames = new Map();
  return {requestAnimationFrame(callback) { frames.set(++id, callback); return id; }, cancelAnimationFrame(key) { frames.delete(key); },
    step() { time += 16; const queued = [...frames.values()]; frames.clear(); for(const callback of queued)callback(time); },
    get pending() { return frames.size; }};
}

function sceneHarness({pending = false, reduced = false, failWebGL = false} = {}) {
  const root = {classList: classes(...(pending ? ['intro-pending'] : []))};
  const body = {classList: classes()};
  const canvas = {...events(), hidden: false};
  const host = {clientWidth: 700, clientHeight: 650};
  const window = events(), clock = frameClock();
  let resize, intersection, mutation, renders = 0, sizes = 0;
  const document = {...events(), documentElement: root, body, hidden: false,
    querySelector(name) { return {'#orbit-canvas': canvas, '.mon-map': host}[name]; }};
  class Object3D {
    constructor() { this.position = {set() {}}; this.rotation = {set() {}}; this.scale = {setScalar() {}}; }
    add() {} updateProjectionMatrix() {}
  }
  class Renderer {
    constructor() { if(failWebGL)throw new Error('No WebGL'); }
    setPixelRatio() {} setClearColor() {} setSize() { sizes++; } render() { renders++; }
  }
  const THREE = {WebGLRenderer: Renderer};
  for(const name of ['Scene', 'PerspectiveCamera', 'HemisphereLight', 'DirectionalLight', 'PointLight', 'Group', 'MeshBasicMaterial', 'Mesh', 'TorusGeometry', 'SphereGeometry', 'BoxGeometry', 'MeshStandardMaterial'])THREE[name] = Object3D;
  vm.runInNewContext(sceneSource, {document, THREE, devicePixelRatio: 2, matchMedia: () => ({matches: reduced}),
    addEventListener: window.addEventListener, requestAnimationFrame: clock.requestAnimationFrame, cancelAnimationFrame: clock.cancelAnimationFrame,
    ResizeObserver: class { constructor(callback) { resize = callback; } observe() {} },
    IntersectionObserver: class { constructor(callback) { intersection = callback; } observe() {} },
    MutationObserver: class { constructor(callback) { mutation = callback; } observe() {} }
  }, {filename: 'scene-source.js'});
  return {root, body, canvas, host, document, window, clock,
    get renders() { return renders; }, get sizes() { return sizes; },
    resize: () => resize(), mutation: () => mutation(), intersect: visible => intersection([{isIntersecting: visible}])};
}

test('generated scene and sculpture have bounded weight and preserve vendored licensing', () => {
  const bundle = read('dist/scene.js'), picture = read('dist/assets/chrome-knot.webp');
  assert.ok(bundle.length < 520_000);
  assert.ok(gzipSync(bundle).length < 135_000);
  assert.match(bundle.toString(), /Copyright 2010-2025 Three\.js Authors/);
  assert.match(bundle.toString(), /SPDX-License-Identifier: MIT/);
  assert.doesNotMatch(bundle.toString(), /from\s*["']\.\/vendor\//);
  assert.doesNotMatch(read('dist/index.html').toString(), /(?:src|href)=["'][^"']*vendor\/three\./);
  assert.ok(picture.length < 1_350_000);
  assert.equal(picture.toString('ascii', 0, 4), 'RIFF');
  assert.equal(picture.toString('ascii', 8, 12), 'WEBP');
  assert.ok(read('src/assets/chrome-knot.png').length > picture.length);
  assert.equal(existsSync(new URL('../dist/assets/chrome-knot.png', import.meta.url)), false, 'original sculpture stays outside the public directory');
  assert.match(read('src/vendor/three.module.js').toString(), /SPDX-License-Identifier: MIT/);
  assert.match(read('src/vendor/three.core.js').toString(), /SPDX-License-Identifier: MIT/);
});

test('opaque loader suspends WebGL frames and watchdog removal resumes rendering', () => {
  const h = sceneHarness({pending: true});
  assert.equal(h.clock.pending, 0);
  h.resize();h.window.emit('portfolio:progress', {detail: {phase: .5}});
  assert.equal(h.clock.pending, 0);
  h.root.classList.remove('intro-pending');h.mutation();
  assert.equal(h.clock.pending, 1);
  h.clock.step();assert.equal(h.renders, 1);assert.equal(h.clock.pending, 1);
  h.root.classList.add('intro-running');h.window.emit('portfolio:intro', {detail: {active: true}});
  assert.equal(h.clock.pending, 0);
  h.clock.step();assert.equal(h.renders, 1);
  h.root.classList.remove('intro-running');h.window.emit('portfolio:intro', {detail: {active: false}});
  assert.equal(h.clock.pending, 1);
});

test('reduced motion renders one static frame and unchanged resize does not reallocate canvas', () => {
  const h = sceneHarness({reduced: true});
  assert.equal(h.sizes, 1);h.clock.step();
  assert.equal(h.renders, 1);assert.equal(h.clock.pending, 0);
  h.resize();h.clock.step();assert.equal(h.sizes, 1);assert.equal(h.clock.pending, 0);
  h.host.clientWidth = 800;h.resize();h.clock.step();assert.equal(h.sizes, 2);
  h.window.emit('portfolio:progress', {detail: {phase: .5}});h.clock.step();
  assert.equal(h.clock.pending, 0);
  const rendered = h.renders;h.window.emit('portfolio:progress', {detail: {phase: .5}});h.clock.step();
  assert.equal(h.renders, rendered, 'unchanged phase does not trigger a static repaint');
});

test('offscreen, hidden and lost-context scenes stay suspended despite update events', () => {
  const h = sceneHarness();h.clock.step();
  h.intersect(false);h.resize();h.window.emit('portfolio:progress', {detail: {phase: .4}});
  assert.equal(h.clock.pending, 0);
  h.intersect(true);assert.equal(h.clock.pending, 1);
  h.document.hidden = true;h.document.emit('visibilitychange');h.resize();
  assert.equal(h.clock.pending, 0);
  h.document.hidden = false;h.document.emit('visibilitychange');
  assert.equal(h.clock.pending, 1);
  let prevented = false;h.canvas.emit('webglcontextlost', {preventDefault() { prevented = true; }});
  h.resize();h.window.emit('portfolio:progress', {detail: {phase: .8}});
  assert.equal(prevented, true);assert.equal(h.canvas.hidden, true);assert.equal(h.clock.pending, 0);
  h.canvas.emit('webglcontextrestored');assert.equal(h.canvas.hidden, false);assert.equal(h.clock.pending, 1);
  h.window.emit('portfolio:motion', {detail: {paused: true}});h.clock.step();
  assert.equal(h.clock.pending, 0);
});

test('WebGL failure leaves the ordinary sculpture fallback available', () => {
  const h = sceneHarness({failWebGL: true});
  assert.equal(h.canvas.hidden, true);assert.equal(h.clock.pending, 0);
});
