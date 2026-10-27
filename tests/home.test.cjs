const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createGalleryServer } = require('../server.cjs');

test('Start: private updates, validation, public export and persistence', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-home-'));
  const options = { dataDir: directory, exportFile: path.join(directory, 'gallery.js') };
  let server;
  const start = async () => {
    server = createGalleryServer(options);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    return `http://127.0.0.1:${server.address().port}`;
  };
  let base = await start();
  try {
    const initial = await (await fetch(base + '/api/home')).json();
    const put = (input, cookie = '') => fetch(base + '/api/home', { method: 'PUT', headers: { Origin: base, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    assert.equal((await put(initial)).status, 401);
    const auth = await fetch(base + '/api/auth/setup', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'test-home-password-2026' }) });
    assert.equal(auth.status, 201);
    const cookie = auth.headers.get('set-cookie').split(';')[0];
    assert.equal((await put({ ...initial, featured: ['projects-0', 'projects-0'] }, cookie)).status, 400);
    assert.equal((await put({ ...initial, featured: ['missing'] }, cookie)).status, 400);
    assert.equal((await put({ ...initial, primary: { ...initial.primary, target: 'javascript:alert(1)' } }, cookie)).status, 400);
    const update = { ...initial, bio: { pl: 'Nowy opis', en: 'New bio' }, featured: ['projects-2', 'achievements-1'] };
    assert.equal((await put(update, cookie)).status, 200);
    assert.deepEqual(await (await fetch(base + '/api/home')).json(), update);
    assert.match(fs.readFileSync(path.join(directory, 'home-data.js'), 'utf8'), /Nowy opis/);
    await new Promise(resolve => server.close(resolve));
    base = await start();
    assert.deepEqual(await (await fetch(base + '/api/home')).json(), update);
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
