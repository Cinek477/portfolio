const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { createGalleryServer } = require('../server.cjs');
const { hydrateHome } = require('../shared/home.cjs');
const { pageDefaults } = require('../shared/page-content.cjs');

test('Page editor: protected save, lists/order, safe links, photo upload, isolation and persistence', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-pages-'));
  const options = { dataDir: directory, uploadDir: path.join(directory, 'images'), exportFile: path.join(directory, 'gallery.js') };
  let server, base, cookie = '';
  const start = async () => { server = createGalleryServer(options); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`; };
  await start();
  const get = async page => (await fetch(base + '/api/pages/' + page)).json();
  const put = (page, input, origin = base) => fetch(base + '/api/pages/' + page, { method: 'PUT', headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  try {
    const beforeHome = await get('home'), beforeAbout = await get('about');
    assert.equal((await put('about', beforeAbout)).status, 401);
    const auth = await fetch(base + '/api/auth/setup', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'page-test-password-2026' }) });
    assert.equal(auth.status, 201);
    cookie = auth.headers.get('set-cookie').split(';')[0];
    assert.equal((await put('about', beforeAbout, 'https://evil.test')).status, 403);
    for (const href of ['javascript:alert(1)', '//evil.test', 'data:text/html,test', 'assets/../server.cjs', 'assets/%2e%2e/server.cjs']) {
      const invalid = structuredClone(beforeAbout);
      invalid.content.buttons[0].href = href;
      assert.equal((await put('about', invalid)).status, 400, href);
    }
    const tooMany = structuredClone(beforeAbout);
    tooMany.content.tags = Array.from({ length: 13 }, () => ({ pl: 'Test', en: 'Test' }));
    assert.equal((await put('about', tooMany)).status, 400);
    const changed = structuredClone(beforeAbout);
    changed.content.heading = { pl: 'Nowy nagłówek', en: 'New heading' };
    changed.content.tags.reverse();
    changed.content.tags.pop();
    changed.content.buttons[0].visible = false;
    changed.content.buttons.push({ label: { pl: 'Kontakt', en: 'Contact' }, href: 'contact.html', visible: true, download: false });
    changed.content.sections[0].visible = false;
    changed.content.sections[1].entries.reverse();
    const excessiveEntries = structuredClone(changed);
    excessiveEntries.content.sections[1].entries = Array(21).fill(changed.content.sections[1].entries[0]);
    assert.equal((await put('about', excessiveEntries)).status, 400);
    changed.content.photo.src = 'https://evil.test/image.jpg';
    const response = await put('about', changed);
    assert.equal(response.status, 200);
    const saved = await response.json();
    assert.equal(saved.content.photo.src, beforeAbout.content.photo.src);
    assert.equal(saved.content.heading.pl, 'Nowy nagłówek');
    assert.deepEqual(saved.content.tags, changed.content.tags);
    assert.deepEqual(saved.content.sections[1].entries, changed.content.sections[1].entries);
    assert.deepEqual(await get('home'), beforeHome);
    const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aOioAAAAASUVORK5CYII=';
    const uploadedResponse = await put('about', { ...saved, image, thumbnail: image });
    assert.equal(uploadedResponse.status, 200);
    const uploaded = await uploadedResponse.json();
    assert.match(uploaded.content.photo.src, /^assets\/images\/pages\/2400px\//);
    assert.match(uploaded.content.photo.thumbUrl, /^assets\/images\/pages\/800px\//);
    const hiddenPhoto = structuredClone(uploaded);
    hiddenPhoto.content.photo.visible = false;
    assert.equal((await put('about', hiddenPhoto)).status, 200);
    const exported = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(directory, 'pages-data.js'), 'utf8'), exported);
    assert.equal(exported.window.portfolioPageContent.about.photo.visible, false);
    assert.equal(exported.window.portfolioPageContent.about.heading.pl, 'Nowy nagłówek');
    const changedHome = structuredClone(beforeHome);
    changedHome.content.tags = [{ pl: 'Nowa kapsułka', en: 'New tag' }];
    changedHome.featured.reverse();
    assert.equal((await put('home', changedHome)).status, 200);
    assert.deepEqual((await get('about')).content, hiddenPhoto.content);
    await new Promise(resolve => server.close(resolve));
    await start();
    assert.deepEqual((await get('about')).content, hiddenPhoto.content);
    assert.deepEqual(await get('home'), changedHome);
  } finally { await new Promise(resolve => server.close(resolve)); fs.rmSync(directory, { recursive: true, force: true }); }
});

test('Existing Start settings acquire editable content without losing custom buttons or picks', () => {
  const old = { bio: { pl: 'Opis', en: 'Bio' }, primary: { target: 'contact', pl: 'Napisz', en: 'Write' }, secondary: { target: 'cv', pl: 'Moje CV', en: 'My CV' }, featured: ['projects-0'] };
  const result = hydrateHome(old);
  assert.deepEqual(result.featured, old.featured);
  assert.deepEqual(result.bio, old.bio);
  assert.equal(result.content.buttons[0].href, 'contact.html');
  assert.equal(result.content.buttons[0].label.pl, 'Napisz');
  assert.equal(result.content.buttons[1].download, true);
  assert.equal(result.content.photo.src, pageDefaults.home.photo.src);
  assert.equal(old.content, undefined);
});
