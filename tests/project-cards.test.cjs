const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('Cards retain their DOM on redundant refresh and stay expanded after delayed data', async () => {
  class Element {
    constructor() { this.children = []; this.attributes = {}; this.events = {}; this.classes = new Set(); }
    set className(value) { this.classes = new Set(value.split(' ')); }
    get classList() {
      return { add: value => this.classes.add(value), remove: value => this.classes.delete(value), contains: value => this.classes.has(value), toggle: value => { if (this.classes.has(value)) { this.classes.delete(value); return false; } this.classes.add(value); return true; } };
    }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(key, value) { this.attributes[key] = value; }
    getAttribute(key) { return this.attributes[key]; }
    addEventListener(event, callback) { this.events[event] = callback; }
    contains(element) { return this === element || this.children.some(child => child.contains(element)); }
    focus() { document.activeElement = this; }
    blur() { document.activeElement = null; }
    style = { setProperty() {} };
  }
  const grid = new Element();
  const listeners = {};
  const document = { documentElement: { lang: 'pl' }, activeElement: null,
    querySelector: selector => selector === '#featured-projects .projects-grid' ? grid : null,
    createElement: () => new Element(),
    addEventListener: (type, fn) => { listeners[type] = fn; },
  };
  let resolveFetch;
  const project = { id: 'test', section: 'projects', title: { pl: 'Test' }, description: { pl: 'Opis' }, year: 2026 };
  const context = { document, AbortController, Image: Element, location: { protocol: 'http:' }, matchMedia: () => ({ matches: false }),
    history: { state: {}, replaceState(state) { this.state = state; } },
    window: { portfolioHome: { featured: ['test'] }, portfolioProjects: [project] },
    fetch: () => new Promise(resolve => { resolveFetch = resolve; }),
  };
  vm.runInNewContext(fs.readFileSync('assets/js/projects.js', 'utf8'), context);
  const first = grid.children[0];
  const toggle = first.children.find(child => child.classList.contains('card-toggle'));
  toggle.events.click();
  assert.equal(toggle.getAttribute('aria-expanded'), 'true');
  listeners['portfolio-home-change']();
  listeners['portfolio-language-change']();
  assert.equal(grid.children[0], first);
  resolveFetch({ ok: true, json: async () => [{ ...project, visible: true, description: { pl: 'Nowy opis' } }] });
  await new Promise(resolve => setImmediate(resolve));
  const updated = grid.children[0];
  assert.notEqual(updated, first);
  assert.ok(updated.classList.contains('expanded'));
  const nextToggle = updated.children.find(child => child.classList.contains('card-toggle'));
  nextToggle.events.click();
  assert.equal(nextToggle.getAttribute('aria-expanded'), 'false');
  assert.equal(updated.classList.contains('expanded'), false);
  assert.equal(updated.classList.contains('is-collapsed'), true);
  updated.events.pointerenter({ pointerType: 'touch' });
  assert.equal(updated.classList.contains('is-collapsed'), true);
  nextToggle.events.click();
  assert.equal(updated.classList.contains('expanded'), true);
  assert.equal(updated.classList.contains('is-collapsed'), false);
  nextToggle.events.click();
  updated.events.pointerleave();
  updated.events.pointerenter({ pointerType: 'mouse' });
  assert.equal(updated.classList.contains('is-collapsed'), false);
});
