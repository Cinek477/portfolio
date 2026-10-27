const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('Refresh restores the saved position after layout changes and yields to user input', () => {
  const events = {};
  const frames = [];
  let resize;
  let disconnected = false;
  const history = { state: { portfolioScroll: 1450 }, replaceState(state) { this.state = state; } };
  const context = {
    location: { protocol: 'http:', href: 'http://localhost:3000/', origin: 'http://localhost:3000' },
    history, URL, AbortController, Set, scrollY: 0,
    window: {},
    document: { documentElement: { dataset: {} }, scripts: [], querySelector: () => ({}), addEventListener() {} },
    addEventListener(type, fn) { events[type] = fn; },
    removeEventListener(type) { delete events[type]; },
    requestAnimationFrame(fn) { frames.push(fn); return frames.length; },
    ResizeObserver: class { constructor(fn) { resize = fn; } observe() {} disconnect() { disconnected = true; } },
    setTimeout() { return 1; }, clearTimeout() {},
    scrollTo({ top }) { context.scrollY = top; },
  };
  vm.runInNewContext(fs.readFileSync('assets/js/router.js', 'utf8'), context);
  assert.equal(history.state.portfolioScroll, 1450);
  frames.shift()();
  assert.equal(context.scrollY, 1450);
  context.scrollY = 800;
  resize();
  assert.equal(context.scrollY, 1450);
  events.wheel();
  assert.equal(disconnected, true);
  context.scrollY = 1700;
  resize();
  assert.equal(context.scrollY, 1700);
  events.pagehide();
  assert.equal(history.state.portfolioScroll, 1700);
});
