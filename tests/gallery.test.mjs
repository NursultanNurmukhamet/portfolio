import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../dist/gallery.js', import.meta.url), 'utf8');
const sandbox = {window: {}};
vm.runInNewContext(source, sandbox, {filename: 'gallery.js'});
const {sampleTravel, slideFraction} = sandbox.window.portfolioGalleryCore;

const closeTo = (actual, expected, message) => {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${message}: expected ${expected}, got ${actual}`);
};

test('all six projects have exact stops and alternating zigzag anchors', () => {
  for (let index = 0; index < 6; index += 1) {
    const fraction = slideFraction(index, 6);
    closeTo(fraction, index / 5, `slide ${index} fraction`);
    const state = sampleTravel(fraction, 6);
    closeTo(state.travel, index, `slide ${index} travel`);
    assert.equal(state.selected, index);
    closeTo(state.cameraX, index % 2, `slide ${index} horizontal anchor`);
    assert.equal(state.leg, Math.min(index, 4));
  }
});

test('each leg has reading plateaus with a smooth midpoint transition', () => {
  for (let leg = 0; leg < 5; leg += 1) {
    for (const fraction of [0, .1, .22]) {
      const state = sampleTravel((leg + fraction) / 5, 6);
      closeTo(state.travel, leg, `leg ${leg} entry plateau at ${fraction}`);
      assert.equal(state.selected, leg);
    }
    const midpoint = sampleTravel((leg + .5) / 5, 6);
    closeTo(midpoint.travel, leg + .5, `leg ${leg} midpoint`);
    closeTo(midpoint.cameraX, .5, `leg ${leg} midpoint horizontal position`);
    for (const fraction of [.78, .9, 1]) {
      const state = sampleTravel((leg + fraction) / 5, 6);
      closeTo(state.travel, leg + 1, `leg ${leg} exit plateau at ${fraction}`);
      assert.equal(state.selected, leg + 1);
    }
  }
});

test('the horizontal camera reverses on every leg, not just the first corner', () => {
  for (let leg = 0; leg < 5; leg += 1) {
    const before = sampleTravel((leg + .35) / 5, 6);
    const after = sampleTravel((leg + .65) / 5, 6);
    assert.ok(after.travel > before.travel, `leg ${leg} always travels forward`);
    assert.equal(Math.sign(after.cameraX - before.cameraX), leg % 2 ? -1 : 1);
    const reverseBefore = sampleTravel((leg + .65) / 5, 6);
    const reverseAfter = sampleTravel((leg + .35) / 5, 6);
    assert.equal(Math.sign(reverseAfter.cameraX - reverseBefore.cameraX), leg % 2 ? 1 : -1);
  }
});

test('travel and slide fractions clamp at both ends', () => {
  for (const progress of [-Infinity, -100, -.01]) {
    const state = sampleTravel(progress, 6);
    assert.equal(state.travel, 0);
    assert.equal(state.selected, 0);
    assert.equal(state.cameraX, 0);
    assert.equal(state.leg, 0);
  }
  for (const progress of [1.01, 100, Infinity]) {
    const state = sampleTravel(progress, 6);
    assert.equal(state.travel, 5);
    assert.equal(state.selected, 5);
    assert.equal(state.cameraX, 1);
    assert.equal(state.leg, 4);
  }
  assert.equal(slideFraction(-1, 6), 0);
  assert.equal(slideFraction(6, 6), 1);
  assert.equal(slideFraction(-Infinity, 6), 0);
  assert.equal(slideFraction(Infinity, 6), 1);
});

test('a single project needs no travel or division by zero', () => {
  for (const progress of [-Infinity, -1, 0, .5, 1, 2, Infinity]) {
    const state = sampleTravel(progress, 1);
    for (const property of ['travel', 'selected', 'cameraX', 'leg']) {
      assert.equal(state[property], 0, `${property} with a single project`);
    }
  }
  for (const count of [0, 1]) {
    for (const index of [-1, 0, 1, 5]) assert.equal(slideFraction(index, count), 0);
  }
});

test('invalid progress falls back to the first project without NaN transforms', () => {
  for (const progress of [NaN, undefined, 'not-progress', {}]) {
    const state = sampleTravel(progress, 6);
    for (const property of ['travel', 'selected', 'cameraX', 'leg']) {
      assert.equal(state[property], 0, `${property} for invalid progress`);
    }
  }
});

test('gallery math stays finite, bounded and monotonic as the project count grows', () => {
  for (const count of [2, 3, 6, 10]) {
    let previous = -Infinity;
    for (let step = 0; step <= 1000; step += 1) {
      const state = sampleTravel(step / 1000, count);
      for (const property of ['travel', 'selected', 'cameraX', 'leg']) {
        assert.ok(Number.isFinite(state[property]), `${property} is finite at ${step}/${count}`);
      }
      assert.ok(state.travel >= previous, `travel is monotonic at ${step}/${count}`);
      assert.ok(state.travel >= 0 && state.travel <= count - 1);
      assert.ok(state.cameraX >= 0 && state.cameraX <= 1);
      assert.equal(state.selected, Math.round(state.travel));
      assert.ok(state.selected >= 0 && state.selected < count);
      assert.ok(Number.isInteger(state.leg));
      assert.ok(state.leg >= 0 && state.leg <= count - 2);
      previous = state.travel;
    }
  }
});
