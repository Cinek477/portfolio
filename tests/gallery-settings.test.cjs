const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createGalleryServer } = require('../server.cjs');
test('Gallery watermark settings: private write, validation, export and persistence', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-settings-'));
  let server, base, cookie = '';
  const start = async () => {
    server = createGalleryServer({ dataDir: dir, uploadDir: path.join(dir, 'images'), exportFile: path.join(dir, 'gallery.js') });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = 'http://127.0.0.1:' + server.address().port;
  };
  const request = (method, endpoint, input, origin = base) => fetch(base + endpoint, { method, headers: { Origin: origin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  await start();
  try {
    const value = { watermarkEnabled: true, watermarkText: 'Fotografie Marcina' };
    assert.equal((await request('PUT', '/api/gallery-settings', value)).status, 401);
    const auth = await request('POST', '/api/auth/setup', { username: 'admin', password: 'watermark-password-2026' });
    cookie = auth.headers.get('set-cookie').split(';')[0];
    assert.deepEqual(await (await request('GET', '/api/gallery-settings')).json(), { watermarkEnabled: true, watermarkText: '' });
    assert.equal((await request('PUT', '/api/gallery-settings', value, 'https://evil.test')).status, 403);
    for (const bad of [{ watermarkEnabled: 'yes' }, { watermarkText: 'a'.repeat(81) }, { watermarkText: null }]) assert.equal((await request('PUT', '/api/gallery-settings', { ...value, ...bad })).status, 400);
    assert.equal((await request('PUT', '/api/gallery-settings', value)).status, 200);
    assert.ok(fs.readFileSync(path.join(dir, 'gallery-settings-data.js'), 'utf8').includes(value.watermarkText));
    await new Promise(resolve => server.close(resolve));
    await start();
    const login = await request('POST', '/api/auth/login', { username: 'admin', password: 'watermark-password-2026' });
    cookie = login.headers.get('set-cookie').split(';')[0];
    assert.deepEqual(await (await request('GET', '/api/gallery-settings')).json(), value);
    const disabled = { watermarkEnabled: false, watermarkText: '' };
    await request('PUT', '/api/gallery-settings', disabled);
    assert.deepEqual(await (await request('GET', '/api/gallery-settings')).json(), disabled);
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
