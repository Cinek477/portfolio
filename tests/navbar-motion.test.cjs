const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
test('Navbar measures layout only at thresholds, coalesces scroll events and respects reduced motion', () => {
  const source = fs.readFileSync('assets/js/portfolio.js', 'utf8');
  const start = source.indexOf('let navbarAnimations = []');
  const end = source.indexOf('\nupdateScroll();\nmatchMedia', start);
  assert.ok(start >= 0 && end > start);
  for (const mode of ['desktop', 'mobile', 'reduced']) {
    const classes = new Set(), events = {}, frames = [], animations = [];
    let reads = 0;
    const element = {
      getBoundingClientRect() { reads++; return { left: classes.has('scrolled') ? 16 : 36, top: 20 }; },
      animate(keyframes, options) { const animation = { cancel() {} }; animations.push({ keyframes, options }); return animation; },
    };
    const navbar = {
      classList: { contains: name => classes.has(name), toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } },
      querySelectorAll: () => [element],
      getBoundingClientRect() { reads++; return { width: classes.has('scrolled') ? 840 : 1152, height: 76 }; },
      animate: element.animate,
    };
    const context = {
      navbar, scrollY: 0,
      matchMedia: query => ({ matches: mode === 'mobile' ? query.includes('max-width') : mode === 'reduced' && query.includes('reduced-motion') }),
      addEventListener: (name, fn) => { events[name] = fn; },
      requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
    };
    vm.runInNewContext(source.slice(start, end), context);
    context.updateScroll(); assert.equal(reads, 0);
    context.scrollY = 120; context.updateScroll(); assert.equal(classes.has('scrolled'), true);
    const firstReads = reads;
    context.scrollY = 90; context.updateScroll(); assert.equal(classes.has('scrolled'), true);
    context.scrollY = 500; context.updateScroll(); assert.equal(reads, firstReads);
    for (let i = 0; i < 20; i++) events.scroll();
    assert.equal(frames.length, 1); frames.shift()(); assert.equal(reads, firstReads);
    context.scrollY = 60; context.updateScroll(); assert.equal(classes.has('scrolled'), false);
    if (mode === 'desktop') {
      assert.ok(reads > 0);
      assert.equal(animations[0].options.pseudoElement, '::before');
      for (const { keyframes } of animations) assert.ok(keyframes.every(frame => Object.keys(frame).every(key => key === 'transform')));
    } else { assert.equal(reads, 0); assert.equal(animations.length, 0); }
  }
});
