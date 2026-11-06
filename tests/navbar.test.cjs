const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { renderPage } = require('../shared/render-page.cjs');

test('Shared navbar: each public page has one menu and the correct active link', () => {
  for (const page of ['index.html', 'projects.html', 'project.html', 'about.html', 'knowledge.html', 'hobby.html', 'contact.html', '404.html']) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'pages', page), 'utf8');
    assert.ok(source.includes('<!-- component:navbar -->'));
    const html = renderPage(source, page);
    assert.equal((html.match(/class="navbar"/g) || []).length, 1);
    assert.ok(html.includes('id="navigation"'));
    assert.ok(html.includes('class="theme"'));
    assert.ok(html.includes('class="language"'));
    const active = [...html.matchAll(/<a href="([^"]+)" aria-current="page"/g)];
    assert.deepEqual(active.map(match => match[1]), page === '404.html' ? [] : [page === 'project.html' ? 'projects.html' : page]);
    assert.ok(!html.includes('<!-- component:navbar -->'));
    assert.doesNotMatch(html, /<!-- component:/);
    assert.equal((html.match(/<footer>/g) || []).length, page === '404.html' ? 0 : 1);
    assert.equal((html.match(/class="contact-fab"/g) || []).length, ['404.html', 'contact.html'].includes(page) ? 0 : 1);
  }
});
