const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('Router coalesces scrolling history writes and saves immediately on exit', () => {
  const events = {}, timers = new Map();
  let nextTimer = 0, writes = 0;
  const context = {
    location: { protocol: 'http:', href: 'http://localhost/', origin: 'http://localhost' },
    history: { state: {}, replaceState(state) { this.state = state; writes++; } },
    document: { documentElement: { dataset: {} }, scripts: [], querySelector: () => ({}), addEventListener() {} },
    window: {}, URL, AbortController, scrollY: 0,
    addEventListener(name, callback) { events[name] = callback; },
    setTimeout(callback, delay) { assert.equal(delay, 150); timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
  };
  vm.runInNewContext(fs.readFileSync('assets/js/router.js', 'utf8'), context);
  assert.equal(writes, 1);
  for (let i = 1; i <= 60; i++) { context.scrollY = i; events.scroll(); }
  assert.equal(writes, 1);
  assert.equal(timers.size, 1);
  [...timers.values()][0]();
  assert.equal(writes, 2);
  assert.equal(context.history.state.portfolioScroll, 60);
  context.scrollY = 100;
  events.scroll();
  events.pagehide();
  assert.equal(context.history.state.portfolioScroll, 100);
  assert.equal(timers.size, 0);
  events.beforeunload();
  assert.equal(writes, 3, 'Identical position does not write history again');
});
