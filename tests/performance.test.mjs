import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import vm from 'node:vm';
import {gzipSync} from 'node:zlib';

const read = name => readFileSync(new URL(`../${name}`, import.meta.url));
const sceneSource = read('src/scene.js').toString().replace(/^import .*;\r?\n/, '');
const appSource = read('dist/app.js').toString();
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
    querySelector(name) { return {'#orbit-canvas': canvas, '.art-stage': host, '.hero-story': {}}[name]; }};
  class Object3D {
    constructor() { this.position = {set() {}}; this.rotation = {set() {}}; this.scale = {setScalar() {}}; }
    add() {} updateProjectionMatrix() {}
  }
  class Renderer {
    constructor() { if(failWebGL)throw new Error('No WebGL'); }
    setPixelRatio() {} setClearColor() {} setSize() { sizes++; } render() { renders++; }
  }
  const THREE = {WebGLRenderer: Renderer};
  for(const name of ['Scene', 'PerspectiveCamera', 'HemisphereLight', 'DirectionalLight', 'PointLight', 'Group', 'MeshBasicMaterial', 'Mesh', 'TorusGeometry', 'SphereGeometry', 'MeshStandardMaterial'])THREE[name] = Object3D;
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

test('hero skips repeated offscreen DOM writes but retains pointer and scroll transitions', () => {
  const clock = frameClock(), window = events();
  let writes = 0, rectangles = 0, position = 0, progressEvents = 0;
  function node() { return {...events(), style: new Proxy({}, {set(target, key, value) { writes++;target[key] = value;return true; }}),
    classList: classes(), setAttribute() {}, querySelector() { return coordinate; }}; }
  const coordinate = node();
  const names = ['.motion-toggle', '.hero-story', '.hero-stage', '.hero-intro', '.hero-outro', '.art-stage', '.pink-panel', '.hero-bottom', '#scene-number', '.scroll-progress'];
  const nodes = Object.fromEntries(names.map(name => [name, node()]));
  nodes['.hero-story'].offsetHeight = 2550;
  nodes['.hero-story'].getBoundingClientRect = () => { rectangles++;return {top: -position, bottom: 2550 - position}; };
  nodes['.hero-stage'].offsetHeight = 1000;
  const reduced = {...events(), matches: false};
  const document = {body: {classList: classes()}, documentElement: {classList: classes()}, querySelector: name => nodes[name]};
  window.dispatchEvent = event => { if(event.type === 'portfolio:progress')progressEvents++;window.emit(event.type, event); };
  window.portfolioIcon = name => name;
  vm.runInNewContext(appSource, {document, window, innerWidth: 1440, innerHeight: 1000, matchMedia: () => reduced,
    addEventListener: window.addEventListener, requestAnimationFrame: clock.requestAnimationFrame,
    CustomEvent: class { constructor(type, options) { this.type = type;this.detail = options.detail; } }
  });
  clock.step();assert.equal(rectangles, 1);
  position = 5000;window.emit('scroll');clock.step();
  const afterExit = writes, eventsAfterExit = progressEvents;
  position = 5200;window.emit('scroll');clock.step();
  assert.equal(writes, afterExit);assert.equal(progressEvents, eventsAfterExit);
  assert.equal(rectangles, 3, 'one rectangle read per scheduled frame');
  position = 0;window.emit('scroll');clock.step();assert.ok(writes > afterExit);
  const beforePointer = writes, eventsBeforePointer = progressEvents;
  nodes['.hero-stage'].emit('pointermove', {pointerType: 'mouse', clientX: 1000, clientY: 100});clock.step();
  assert.ok(writes > beforePointer);assert.equal(progressEvents, eventsBeforePointer, 'pointer parallax does not rebroadcast unchanged progress');
  nodes['.motion-toggle'].emit('click');clock.step();
  assert.equal(document.body.classList.contains('motion-paused'), true);
});
