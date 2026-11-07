const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('Neon limits drawing frequency and stops when the tab is hidden', () => {
  let strokes = 0, frame, intersection;
  const events = {}, nodes = [];
  const context2d = { setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() { strokes++; } };
  const button = {
    clientWidth: 160, clientHeight: 48, isConnected: true,
    querySelector: () => nodes[0], append: node => nodes.push(node), getAttribute() {},
  };
  const document = {
    hidden: false,
    body: { classList: { contains: () => false } },
    querySelectorAll: () => [button],
    createElement: () => ({ setAttribute() {}, getContext: () => context2d }),
    createElementNS: () => ({ setAttribute() {}, getTotalLength: () => 400, getPointAtLength: length => ({ x: length, y: 0 }) }),
    addEventListener: (name, callback) => { events[name] = callback; },
  };
  vm.runInNewContext(fs.readFileSync('assets/js/neon.js', 'utf8'), {
    document, devicePixelRatio: 1, performance: { now: () => 0 },
    getComputedStyle: () => ({ borderTopLeftRadius: '20px' }),
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame(callback) { frame = callback; return 1; },
    cancelAnimationFrame() { frame = null; },
    MutationObserver: class { observe() {} },
    ResizeObserver: class { observe() {} },
    IntersectionObserver: class { constructor(callback) { intersection = callback; } observe() {} },
  });
  intersection([{ target: button, isIntersecting: true }]);
  frame(0);
  assert.equal(strokes, 48);
  frame(8);
  assert.equal(strokes, 48, '120–144 Hz screens do not redraw on every frame');
  frame(17);
  assert.equal(strokes, 96, 'The trail redraws at 60 frames per second');
  document.hidden = true;
  events.visibilitychange();
  assert.equal(frame, null);
});

test('Neon keeps drawing after translated text replaces its canvas', () => {
  const frames = new Map(), nodes = [];
  let id = 0, strokes = 0, mutation, intersection, observed = 0;
  const context2d = { setTransform() {}, clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() { strokes++; } };
  const button = {
    clientWidth: 160, clientHeight: 48, isConnected: true,
    querySelector: () => nodes[0], append: node => nodes.push(node), getAttribute() {},
  };
  vm.runInNewContext(fs.readFileSync('assets/js/neon.js', 'utf8'), {
    document: {
      hidden: false, body: { classList: { contains: () => false } },
      querySelectorAll(selector) {
        assert.ok(selector.includes('main a.secondary'), 'Secondary CTA buttons must receive the effect');
        return [button];
      },
      createElement: () => ({ setAttribute() {}, getContext: () => context2d }),
      createElementNS: () => ({ setAttribute() {}, getTotalLength: () => 400, getPointAtLength: length => ({ x: length, y: 0 }) }),
      addEventListener() {},
    },
    devicePixelRatio: 1, performance: { now: () => 0 },
    getComputedStyle: () => ({ borderTopLeftRadius: '20px' }),
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    requestAnimationFrame(callback) { frames.set(++id, callback); return id; },
    cancelAnimationFrame(key) { frames.delete(key); },
    MutationObserver: class { constructor(callback) { mutation = callback; } observe() {} },
    ResizeObserver: class { observe() {} },
    IntersectionObserver: class { constructor(callback) { intersection = callback; } observe() { observed++; } },
  });
  const tick = time => {
    const queued = [...frames.values()];
    frames.clear();
    queued.forEach(callback => callback(time));
  };
  intersection([{ target: button, isIntersecting: true }]);
  tick(0);
  assert.equal(strokes, 48);
  const oldCanvas = nodes.pop(); // textContent during translation removes the child.
  mutation([{ type: 'childList', removedNodes: [oldCanvas], addedNodes: [] }]);
  tick(34);
  assert.equal(nodes.length, 1);
  assert.notEqual(nodes[0], oldCanvas);
  const before = strokes;
  tick(68); // IntersectionObserver deliberately emits no new visibility event.
  assert.equal(strokes, before + 48);
  assert.equal(observed, 1, 'The same control stays registered with its original visibility');
});
