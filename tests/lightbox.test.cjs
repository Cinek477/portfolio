const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
test('Desktop lightbox keeps one image, old frame while decoding and ignores stale navigation', async () => {
  class Element {
    children = []; style = { setProperty() {} }; dataset = {}; events = {}; isConnected = true;
    classList = { add() {}, remove() {}, contains() { return false; }, toggle() {} };
    append(...nodes) { for (const node of nodes) { this.children.push(node); node.parentElement = this; } }
    prepend(node) { this.children.unshift(node); node.parentElement = this; }
    replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
    replaceWith(node) { this.replacement = node; }
    setAttribute() {} removeAttribute() {} addEventListener(name, listener) { this.events[name] = listener; }
    get firstElementChild() { return this.children[0]; }
    querySelector() { return null; }
  }
  const carousel = new Element(), information = new Element(), counter = new Element(), prev = new Element(), next = new Element();
  const dialog = new Element(); dialog.open = true; dialog.clientWidth = 1200; dialog.append(prev, next);
  dialog.querySelector = selector => ({ '.lightbox-carousel': carousel, '.lightbox-metadata': information, '.lightbox-counter': counter, '.lightbox-prev': prev, '.lightbox-next': next }[selector]);
  const cleanups = [], images = [];
  const context = {
    document: { querySelector: () => dialog, createElement: () => new Element(), documentElement: { lang: 'pl' } },
    navigator: { connection: { saveData: true } },
    window: null, devicePixelRatio: 1,
    matchMedia: () => ({ matches: false }),
    AbortController, setTimeout, clearTimeout,
    Image: class extends Element {
      constructor() { super(); this.naturalWidth = 800; images.push(this); }
      decode = async () => {};
    },
  };
  context.window = context;
  context.portfolioPageScope = { signal: new AbortController().signal, cleanup: fn => cleanups.push(fn) };
  vm.runInNewContext(fs.readFileSync('assets/js/photo-loader.js', 'utf8'), context);
  vm.runInNewContext(fs.readFileSync('assets/js/lightbox.js', 'utf8'), context);
  const photos = Array.from({ length: 50 }, (_, index) => ({ id: String(index), src: `full-${index}.jpg`, thumbUrl: `thumb-${index}.jpg`, category: 'places', title: { pl: 'Zdjęcie' }, place: { pl: 'Kraków' } }));
  try {
    const first = context.renderPortfolioLightbox(photos[0], photos, () => {});
    assert.equal(images.length, 1, 'Opening must not construct all 50 photographs');
    await images[0].onload(); await first;
    assert.equal(carousel.children.length, 1);
    assert.equal(carousel.firstElementChild.firstElementChild, images[0]);
    const stale = context.renderPortfolioLightbox(photos[1], photos, () => {});
    const current = context.renderPortfolioLightbox(photos[2], photos, () => {});
    assert.equal(carousel.firstElementChild.firstElementChild, images[0], 'Keep the old photograph while loading');
    await images[2].onload(); await current;
    assert.equal(carousel.firstElementChild.firstElementChild, images[2]);
    assert.equal(images[1].onload, null, 'Obsolete requests are cancelled rather than decoded'); await stale;
    assert.equal(carousel.firstElementChild.firstElementChild, images[2], 'An older request cannot overwrite newer navigation');
    assert.equal(carousel.children.length, 1);
    const closing = context.renderPortfolioLightbox(photos[3], photos, () => {});
    dialog.events['lightbox-closing'](); await closing;
    assert.equal(images[3].src, '');
    assert.equal(carousel.firstElementChild.firstElementChild, images[2]);
  } finally { cleanups.forEach(fn => fn()); }
});
