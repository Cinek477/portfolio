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
  frame(8); frame(16); frame(24);
  assert.equal(strokes, 48, 'Fast screens do not redraw on every frame');
  frame(34);
  assert.equal(strokes, 96);
  document.hidden = true;
  events.visibilitychange();
  assert.equal(frame, null);
});
