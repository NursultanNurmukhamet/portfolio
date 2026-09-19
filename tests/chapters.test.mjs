import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/chapters.js', import.meta.url), 'utf8');
const sandbox = {window: {}};
vm.runInNewContext(source, sandbox, {filename: 'chapters.js'});
const {createGestureGate, wheelPixels, nextFrame, nativeRegion, swipeDirection} = sandbox.window.portfolioChapterCore;

test('wheel units normalize to CSS pixels without letting strength skip frames', () => {
  assert.equal(wheelPixels({deltaY: 3, deltaMode: 1}, 900).y, 48);
  assert.equal(wheelPixels({deltaY: 2, deltaMode: 2}, 900).y, 1800);
  assert.equal(wheelPixels({deltaY: 4, deltaMode: 0}, 900).y, 4);
  assert.equal(wheelPixels({deltaY: undefined}, 900).y, 0);
  const frames = [{top: 0}, {top: 1000}, {top: 2000}];
  assert.equal(nextFrame(frames, 0, 1).top, 1000);
  assert.equal(nextFrame(frames, 1500, -1).top, 1000);
  assert.equal(nextFrame(frames, 2000, 1), null);
});

test('gesture gate waits for animation AND a quiet momentum tail', () => {
  const gate = createGestureGate();
  assert.equal(gate.sample(15000, 0), 1);
  gate.setBusy(true);
  assert.equal(gate.sample(50, 500), 0, 'a gap during a transition cannot queue a scene');
  assert.equal(gate.sample(-60, 1000), 0, 'direction changes within the gesture are ignored');
  gate.setBusy(false);
  assert.equal(gate.sample(5, 1150), 0, 'momentum remains consumed after completion');
  assert.equal(gate.sample(3, 1330), 0);
  assert.equal(gate.sample(-100, 1600), -1, 'only a fresh gesture can move again');
});

test('every nonzero wheel tick starts a gesture, including fractional pixels', () => {
  for (const delta of [.01, .25, 1, 3, -.01, -.25, -1, -3]) {
    const gate = createGestureGate();
    assert.equal(gate.sample(delta, 0), Math.sign(delta));
    assert.equal(gate.sample(delta, 20), 0, 'same light gesture cannot queue a second scene');
    assert.equal(gate.sample(delta, 300), Math.sign(delta), 'another light gesture works after the quiet gap');
  }
});

test('zero and invalid wheel packets cannot consume a fresh gesture', () => {
  const gate = createGestureGate();
  for (const delta of [0, NaN, Infinity, -Infinity]) assert.equal(gate.sample(delta, 0), 0);
  assert.equal(gate.sample(.01, 10), 1);
  assert.equal(gate.sample(0, 240), 0);
  assert.equal(gate.sample(-.01, 260), -1, 'zero packets do not extend momentum lock');
});

test('static gallery, oversized hero, and contact body keep native reading scroll', () => {
  const layout = {contactTop: 7000, heroOversized: false, heroBottom: 2400, galleryTop: 2600, galleryBottom: 6000, galleryStatic: false};
  assert.equal(nativeRegion(layout, 7000, 1), true);
  assert.equal(nativeRegion(layout, 7000, -1), false);
  assert.equal(nativeRegion(layout, 7100, -1), true);
  assert.equal(nativeRegion({...layout, galleryStatic: true}, 3100, 1), true);
  assert.equal(nativeRegion({...layout, galleryStatic: true}, 3100, -1), true);
  assert.equal(nativeRegion({...layout, galleryStatic: true}, 2600, -1), false);
  assert.equal(nativeRegion({...layout, heroOversized: true}, 100, 1), true);
});

test('swipe detection ignores taps and horizontal gestures', () => {
  const origin = {x: 100, y: 200};
  assert.equal(swipeDirection(origin, {x: 103, y: 160}), 1);
  assert.equal(swipeDirection(origin, {x: 103, y: 240}), -1);
  assert.equal(swipeDirection(origin, {x: 150, y: 160}), 0);
  assert.equal(swipeDirection(origin, {x: 100, y: 192}), 1, 'short deliberate swipe works');
  assert.equal(swipeDirection(origin, {x: 100, y: 208}), -1);
  assert.equal(swipeDirection(origin, {x: 100, y: 197}), 0, 'tap jitter is not navigation');
});

function classList() {
  const values = new Set();
  return {contains: value => values.has(value), add: value => values.add(value), remove: value => values.delete(value)};
}

function harness() {
  let time = 0, nextRaf = 1, openDialog = false;
  const callbacks = new Map(), windowEvents = new Map(), documentEvents = new Map(), scrolls = [];
  const body = {nodeType: 1, classList: classList(), closest: () => null};
  const root = {nodeType: 1, classList: classList(), scrollHeight: 9200};
  const reduced = {matches: false, addEventListener(name, callback) { this.change = callback; }};
  function node(top = 0, height = 1000, options = {}) {
    const result = {
      nodeType: 1, classList: classList(), offsetHeight: height, scrollHeight: height, clientHeight: height,
      parentElement: body, overflowY: 'visible',
      getBoundingClientRect: () => ({top: top - window.scrollY}),
      closest: () => null,
      ...options
    };
    return result;
  }
  const elements = {
    '.hero-story': node(0, 2500), '.hero-stage': node(),
    '.diagonal-showcase': node(2650, 4000), '.gallery-stage': node(), '#contact': node(6650, 2000)
  };
  const window = {
    scrollY: 0, innerHeight: 1000, performance: {now: () => time}, matchMedia: () => reduced,
    getComputedStyle: target => ({overflowY: target.overflowY || 'visible'}),
    requestAnimationFrame(callback) { const id = nextRaf++; callbacks.set(id, callback); return id; },
    cancelAnimationFrame(id) { callbacks.delete(id); },
    scrollTo(options) { this.scrollY = options.top; scrolls.push(options); },
    addEventListener(name, callback) { windowEvents.set(name, [...windowEvents.get(name) || [], callback]); },
    dispatchEvent(event) { for (const callback of windowEvents.get(event.type) || []) callback(event); }
  };
  const document = {
    body, documentElement: root, hidden: false,
    querySelector: selector => selector === 'dialog[open]' ? (openDialog ? {} : null) : elements[selector] || null,
    addEventListener(name, callback) { documentEvents.set(name, [...documentEvents.get(name) || [], callback]); }
  };
  vm.runInNewContext(source, {window, document, CustomEvent: class {constructor(type, options) {this.type = type; this.detail = options.detail;}}}, {filename: 'chapters.js'});
  const emit = (type, input = {}, at = time, documentEvent = false) => {
    time = at;
    const event = {type, target: body, cancelable: true, deltaX: 0, deltaY: 0, deltaMode: 0, prevented: false,
      preventDefault() { this.prevented = true; }, ...input};
    for (const callback of (documentEvent ? documentEvents : windowEvents).get(type) || []) callback(event);
    return event;
  };
  const tick = at => {
    time = at;
    const queued = [...callbacks.values()]; callbacks.clear();
    for (const callback of queued) callback(at);
  };
  return {window, document, root, body, elements, reduced, scrolls, node, emit, tick,
    api: window.portfolioChapters, dialog: value => {openDialog = value;}};
}

test('browser adapter scrolls through measured frames one per wheel gesture', () => {
  const h = harness();
  assert.equal(h.api.state().frames.map(frame => frame.id).join(','), 'hero,hero-outro,project-1,project-2,project-3,contact');
  assert.equal(h.emit('wheel', {deltaY: 20000}, 0).prevented, true);
  assert.equal(h.api.state().target, 'hero-outro');
  h.tick(540);
  assert.equal(h.window.scrollY, 712.5, 'normalized easing is halfway after half the fixed duration');
  assert.equal(h.emit('wheel', {deltaY: 2000}, 1000).prevented, true);
  h.tick(1080);
  assert.equal(h.window.scrollY, 1425);
  assert.equal(h.api.state().animating, false);
  assert.equal(h.emit('wheel', {deltaY: 30}, 1150).prevented, true);
  assert.equal(h.api.state().animating, false, 'momentum does not trigger the next frame');
  h.emit('wheel', {deltaY: 5}, 1500);
  assert.equal(h.api.state().target, 'project-1');
  assert.ok(h.scrolls.every(scroll => scroll.behavior === 'instant'));
});

test('a single fractional wheel tick starts a full chapter in either direction', () => {
  for (const deltaY of [.01, .25, 1, -.01, -.25, -1]) {
    const h = harness();
    if(deltaY < 0)h.window.scrollY=1425;
    assert.equal(h.emit('wheel', {deltaY}, 0).prevented, true);
    assert.equal(h.api.state().target, deltaY > 0 ? 'hero-outro' : 'hero');
    assert.equal(h.emit('wheel', {deltaY}, 1000).prevented, true);
    h.tick(1080);
    assert.equal(h.window.scrollY, deltaY > 0 ? 1425 : 0);
    assert.equal(h.emit('wheel', {deltaY}, 1100).prevented, true);
    assert.equal(h.api.state().animating, false);
  }
});

test('ignored wheel packets do not swallow the following small vertical gesture', () => {
  for (const packet of [{deltaY:0}, {deltaX:12,deltaY:0}, {deltaX:12,deltaY:.1}, {deltaY:Infinity}]) {
    const h=harness();
    assert.equal(h.emit('wheel', packet, 0).prevented, false);
    assert.equal(h.emit('wheel', {deltaY:.1}, 10).prevented, true);
    assert.equal(h.api.state().target, 'hero-outro');
  }
});

test('links and buttons allow light wheel scrolling but keep native keyboard actions', () => {
  for(const tagName of ['A','BUTTON']){
    const h=harness();
    const control=h.node(0,100,{closest:selector=>selector.includes('a[href],button')?{tagName}:null});
    assert.equal(h.emit('keydown',{key:' ',target:control},0).prevented,false);
    assert.equal(h.emit('keydown',{key:'ArrowDown',target:control},10).prevented,false);
    assert.equal(h.emit('wheel',{deltaY:.1,target:control},20).prevented,true);
    assert.equal(h.api.state().target,'hero-outro');
  }
});

test('momentum cannot overshoot into contact; a fresh gesture resumes native scrolling', () => {
  const h = harness();
  h.window.scrollY = 5650;
  h.emit('wheel', {deltaY: 120}, 0);
  h.emit('wheel', {deltaY: 30}, 1000);
  h.tick(1080);
  assert.equal(h.window.scrollY, 6650);
  assert.equal(h.emit('wheel', {deltaY: 15}, 1150).prevented, true);
  assert.equal(h.emit('wheel', {deltaY: 120}, 1500).prevented, false);
  h.window.scrollY = 6800;
  assert.equal(h.emit('wheel', {deltaY: -120}, 1800).prevented, false);
  h.window.scrollY = 6650;
  assert.equal(h.emit('wheel', {deltaY: -120}, 2100).prevented, true);
  assert.equal(h.api.state().target, 'project-3');
});

test('incoming controls and reversed wheel momentum cannot interrupt a captured gesture', () => {
  const h = harness();
  const input = h.node(0, 100, {closest: () => ({tagName: 'INPUT'})});
  h.emit('wheel', {deltaY: 120}, 0);
  assert.equal(h.emit('wheel', {deltaY: -60, target: input}, 1000).prevented, true);
  assert.equal(h.api.state().target, 'hero-outro');
  h.tick(1080);
  assert.equal(h.emit('wheel', {deltaY: -20, target: input}, 1100).prevented, true);
  assert.equal(h.api.state().animating, false);
  assert.equal(h.emit('wheel', {deltaY: -120, target: input}, 1500).prevented, false, 'fresh gestures on forms remain native');
});

test('gallery focus repair does not interrupt a frame; intentional form focus still does', () => {
  const h = harness();
  h.api.next(1);
  const pagination = h.node(0, 100, {closest: () => null});
  h.emit('focusin', {target: pagination}, 100, true);
  assert.equal(h.api.state().animating, true);
  const input = h.node(0, 100, {closest: () => ({tagName: 'INPUT'})});
  h.emit('focusin', {target: input}, 200, true);
  assert.equal(h.api.state().animating, false);
});

test('forms, nested scrolling, zoom, dialogs, intro and reduced motion are not intercepted', () => {
  for (const kind of ['form', 'nested', 'zoom', 'dialog', 'intro', 'paused', 'reduced', 'horizontal', 'uncancelable']) {
    const h = harness();
    const data = {deltaY: 120};
    if (kind === 'form') data.target = h.node(0, 100, {closest: () => ({tagName: 'INPUT'})});
    if (kind === 'nested') data.target = h.node(0, 100, {scrollHeight: 900, clientHeight: 100, overflowY: 'auto'});
    if (kind === 'zoom') data.ctrlKey = true;
    if (kind === 'dialog') h.dialog(true);
    if (kind === 'intro') h.root.classList.add('intro-running');
    if (kind === 'paused') h.body.classList.add('motion-paused');
    if (kind === 'reduced') h.reduced.matches = true;
    if (kind === 'horizontal') data.deltaX = 150;
    if (kind === 'uncancelable') data.cancelable = false;
    assert.equal(h.emit('wheel', data).prevented, false, kind);
    assert.equal(h.api.state().animating, false, kind);
  }
});

test('static gallery content and over-height hero remain readable with native scrolling', () => {
  const h = harness();
  h.elements['.diagonal-showcase'].classList.add('gallery-static');
  h.window.scrollY = 3000;
  assert.equal(h.emit('wheel', {deltaY: 120}).prevented, false);
  assert.equal(h.emit('wheel', {deltaY: -120}, 500).prevented, false);
  h.window.scrollY = 0;
  h.elements['.hero-stage'].offsetHeight = 1200;
  assert.equal(h.emit('wheel', {deltaY: 120}, 1000).prevented, false);
});

test('one touch sequence reserves early movement and triggers only one frame', () => {
  const h = harness();
  const point = y => [{identifier: 1, clientX: 100, clientY: y}];
  h.emit('touchstart', {touches: point(300)});
  assert.equal(h.emit('touchmove', {touches: point(297)}, 10).prevented, true);
  assert.equal(h.api.state().animating, false, 'a small touch does not skip a scene');
  assert.equal(h.emit('touchmove', {touches: point(293)}, 20).prevented, true);
  assert.equal(h.api.state().animating, false, '7px tap jitter remains below the swipe threshold');
  assert.equal(h.emit('touchmove', {touches: point(292)}, 30).prevented, true);
  assert.equal(h.api.state().target, 'hero-outro');
  h.tick(1110);
  assert.equal(h.emit('touchmove', {touches: point(100)}, 1200).prevented, true);
  assert.equal(h.api.state().animating, false, 'same finger cannot queue another frame');
  h.emit('touchend');
  h.emit('touchstart', {touches: point(300)}, 1500);
  h.emit('touchmove', {touches: point(260)}, 1550);
  assert.equal(h.api.state().target, 'project-1');
});

test('multi-touch and horizontal swipes never become chapter navigation', () => {
  const h = harness();
  const p = (id, x, y) => ({identifier: id, clientX: x, clientY: y});
  h.emit('touchstart', {touches: [p(1, 100, 100), p(2, 200, 100)]});
  assert.equal(h.emit('touchmove', {touches: [p(1, 100, 50), p(2, 200, 50)]}).prevented, false);
  h.emit('touchstart', {touches: [p(1, 100, 100)]});
  assert.equal(h.emit('touchmove', {touches: [p(1, 150, 95)]}).prevented, false);
  assert.equal(h.emit('touchmove', {touches: [p(1, 150, 10)]}).prevented, false);
  assert.equal(h.api.state().animating, false);
});

test('Escape, normal Tab, history, resize, intro and motion changes cancel without forced restoration', () => {
  for (const type of ['Escape', 'Tab', 'popstate', 'hashchange', 'resize', 'pageshow', 'portfolio:intro', 'portfolio:motion']) {
    const h = harness();
    h.api.next(1);
    h.tick(300);
    const current = h.window.scrollY;
    const event = type === 'Escape' || type === 'Tab' ? h.emit('keydown', {key: type}) : h.emit(type);
    assert.equal(event.prevented, false, type);
    h.tick(2000);
    assert.equal(h.window.scrollY, current, type);
    assert.equal(h.api.state().animating, false, type);
    assert.equal(h.root.classList.contains('chapter-transition'), false, type);
  }
});

test('keyboard repeat does not skip scenes, and contact keeps normal keyboard scroll', () => {
  const h = harness();
  assert.equal(h.emit('keydown', {key: 'PageDown'}).prevented, true);
  h.tick(1080);
  assert.equal(h.emit('keydown', {key: 'PageDown', repeat: true}, 1200).prevented, true);
  assert.equal(h.api.state().animating, false);
  assert.equal(h.emit('keydown', {key: 'ArrowUp'}, 1500).prevented, true);
  assert.equal(h.api.state().target, 'hero');
  h.api.cancel();
  h.window.scrollY = 6700;
  assert.equal(h.emit('keydown', {key: ' '}).prevented, false);
  assert.equal(h.emit('keydown', {key: 'PageUp'}).prevented, false);
});
