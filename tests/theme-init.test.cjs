const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { renderPage } = require('../shared/render-page.cjs');
test('Saved theme is set before styles, with system fallback and blocked-storage support', () => {
  const html = renderPage(fs.readFileSync('pages/index.html', 'utf8'), 'index.html');
  const script = html.match(/<script data-theme-init>([\s\S]*?)<\/script>/)[1];
  assert.ok(html.indexOf('data-theme-init') < html.indexOf('rel="stylesheet"'));
  for (const [stored, systemDark, expected, blocked] of [['dark', false, 'dark'], ['light', true, 'light'], [null, true, 'dark'], ['invalid', false, 'light'], [null, true, 'dark', true]]) {
    const root = { dataset: {}, style: {} }, meta = {};
    vm.runInNewContext(script, {
      document: { documentElement: root, querySelector: selector => { assert.equal(selector, 'meta[name="theme-color"]'); return meta; } },
      localStorage: { getItem() { if (blocked) throw Error('blocked'); return stored; } },
      matchMedia: () => ({ matches: systemDark }),
    });
    assert.equal(root.dataset.theme, expected);
    assert.equal(root.style.colorScheme, expected);
    assert.equal(root.style.backgroundColor, expected === 'dark' ? '#091526' : '#eef4fc');
    assert.equal(meta.content, root.style.backgroundColor);
  }
});
