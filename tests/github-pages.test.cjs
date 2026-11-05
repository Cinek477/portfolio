const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { preparePages } = require('../scripts/prepare-pages.cjs');
test('Pages export: base paths, complete pages, snapshots, privacy and honest static contact', () => {
  const output = path.resolve('dist/pages-export-test');
  try {
    assert.throws(() => preparePages({ base: '/../../', output }));
    preparePages({ output, base: '/WDAI-2026/' });
    const read = name => fs.readFileSync(path.join(output, name), 'utf8');
    assert.match(read('index.html'), /<base href="\/WDAI-2026\/">/);
    assert.match(read('index.html'), /aria-current="page"/);
    assert.doesNotMatch(read('index.html'), /<!-- component:navbar -->/);
    assert.match(read('o-mnie/index.html'), /<base href="\/WDAI-2026\/">/);
    assert.match(read('projekty/swoja-droga/index.html'), /portfolioStaticProjectId="achievements-1"/);
    assert.doesNotMatch(read('admin.html'), /login-form/);
    const contact = read('assets/js/contact.js');
    assert.match(contact, /mailto:podyma\.marcin33@gmail\.com/);
    assert.doesNotMatch(contact, /fetch\('\/api\/contact/);
    assert.match(read('assets/js/gallery.js'), /new URL\('hobby.html',document.baseURI\)/);
    assert.doesNotMatch(read('assets/js/spotify.js'), /\/api\//);
    const snapshots = JSON.parse(read('static-api/photos.json'));
    assert.ok(snapshots.every(photo => photo.visible !== false && !photo.archived));
    for (const file of fs.readdirSync(path.join(output, 'assets/js')).filter(name => name.endsWith('.js'))) {
      const script = read('assets/js/' + file);
      new vm.Script(script, { filename: file });
      assert.doesNotMatch(script, /fetch\(['"`]\/api\//, file);
    }
    for (const forbidden of ['data', 'backups', '.git', '.env', 'server.cjs', 'CNAME', 'assets/js/admin.js']) assert.ok(!fs.existsSync(path.join(output, forbidden)), forbidden);
    for (const name of ['index.html', 'about.html', 'projects.html', 'project.html', 'hobby.html', 'knowledge.html', 'contact.html']) {
      for (const [, value] of read(name).matchAll(/(?:src|href)="([^"#]+)"/g)) {
        if (/^(?:https?:|mailto:|tel:|data:|\/)/.test(value)) continue;
        assert.ok(fs.existsSync(path.join(output, decodeURIComponent(value.split(/[?#]/)[0]))), name + ': ' + value);
      }
    }
    preparePages({ output, base: '/' });
    assert.match(read('index.html'), /<base href="\/">/);
  } finally { fs.rmSync(output, { recursive: true, force: true }); }
});
