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
    assert.match(read('assets/js/router.js'), /startViewTransition/);
    assert.match(read('assets/js/router.js'), /documentBase/);
    assert.ok(read('index.html').indexOf('data-theme-init') < read('index.html').indexOf('rel="stylesheet"'));
    assert.match(read('hobby.html'), /photo-loader\.js/);
    // Obrazy, warianty srcset i dane muszą zmieniać adres po aktualizacji zawartości.
    assert.match(read('about.html'), /marcin-about\.webp\?v=[a-f0-9]{10}/);
    assert.match(read('about.html'), /marcin-about-400\.webp\?v=[a-f0-9]{10} 400w/);
    assert.match(read('project.html'), /project-detail\.css\?v=[a-f0-9]{10}/);
    assert.doesNotMatch(read('project.html'), /project-detail\.css\?v=4["&]/);
    assert.match(read('assets/js/projects.js'), /static-api\/projects\.json\?v=[a-f0-9]{10}/);
    assert.match(read('assets/js/page-content.js'), /static-api\/pages\/.*\.json\?v=/);
    const imageContext = { window: {}, document: { baseURI: 'https://example.test/WDAI-2026/' }, URL };
    vm.runInNewContext(read('assets/js/image-versions.js'), imageContext);
    for (const image of ['marcin-about.webp', 'marcin-about-400.webp']) {
      assert.match(imageContext.window.portfolioImageUrl('assets/images/profile/' + image), /\?v=[a-f0-9]{10}$/);
    }
    assert.match(imageContext.window.portfolioImageUrl('assets/images/projects/illustrations/krakhack-dark.svg'), /krakhack-dark\.svg\?v=[a-f0-9]{10}$/);
    assert.equal(imageContext.window.portfolioImageUrl('https://external.test/photo.jpg'), 'https://external.test/photo.jpg');
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
