const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { createGalleryServer } = require('../server.cjs');

test('Trash: private, durable, exact restore without duplicates and confirmed permanent removal', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-trash-'));
  const options = { dataDir: directory, uploadDir: path.join(directory, 'images'), exportFile: path.join(directory, 'gallery-data.js') };
  let server, base, cookie = '';
  const start = async () => { server = createGalleryServer(options); server.listen(0, '127.0.0.1'); await once(server, 'listening'); base = 'http://127.0.0.1:' + server.address().port; };
  const stop = () => new Promise(resolve => server.close(resolve));
  const call = (url, method = 'GET', data, auth = true) => fetch(base + url, { method, headers: { Origin: base, 'Content-Type': 'application/json', ...(auth ? { Cookie: cookie } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) });
  const login = async setup => { const r = await call('/api/auth/' + (setup ? 'setup' : 'login'), 'POST', { username: 'admin', password: 'Disposable-trash-test-2026' }); assert.equal(r.status, setup ? 201 : 200); cookie = r.headers.get('set-cookie').split(';')[0]; };
  try {
    await start(); await login(true);
    assert.equal((await call('/api/trash', 'GET', undefined, false)).status, 401);
    const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aOioAAAAASUVORK5CYII=';
    for (const kind of ['photos', 'projects']) {
      const input = kind === 'photos' ? { category: 'nature', venue: 'Tatry', title: 'Zdjęcie do odzyskania', description: 'Pełny opis zdjęcia', image, thumbnail: image } : { section: 'achievements', title: 'Osiągnięcie do odzyskania', summary: 'Krótki opis', description: 'Pełny opis', year: 2026, visible: false, image, thumbnail: image };
      const created = await (await call('/api/' + kind, 'POST', input)).json();
      const endpoint = '/api/' + kind + '/' + created.id;
      assert.equal((await call(endpoint, 'DELETE', undefined, false)).status, 401);
      assert.equal((await call(endpoint, 'DELETE')).status, 200);
      assert.ok(!(await (await call('/api/' + kind)).json()).some(x => x.id === created.id));
      const items = await (await call('/api/trash')).json();
      const archived = items.find(x => x.id === created.id && x.kind === kind);
      assert.deepEqual(archived.data, created);
      const exportPath = path.join(directory, kind === 'photos' ? 'gallery-data.js' : 'projects-data.js');
      assert.ok(!fs.readFileSync(exportPath, 'utf8').includes(created.id));
      await stop(); await start(); await login(false);
      assert.ok((await (await call('/api/trash')).json()).some(x => x.id === created.id));
      const restore = '/api/trash/' + kind + '/' + created.id + '/restore';
      assert.equal((await call(restore, 'POST', undefined, false)).status, 401);
      assert.equal((await call(restore, 'POST')).status, 200);
      assert.equal((await call(restore, 'POST')).status, 404);
      const restored = (await (await call('/api/' + kind)).json()).filter(x => x.id === created.id);
      assert.equal(restored.length, 1); assert.deepEqual(restored[0], created);
      assert.ok(fs.existsSync(path.join(options.uploadDir, kind === 'photos' ? 'gallery' : 'projects', '2400px', path.basename(created.src))));
      assert.equal((await call(endpoint + '?permanent=1', 'DELETE', {})).status, 400);
      assert.equal((await call(endpoint, 'DELETE')).status, 200);
      const purge = '/api/trash/' + kind + '/' + created.id;
      assert.equal((await call(purge, 'DELETE', {})).status, 400);
      assert.equal((await call(purge, 'DELETE', { confirmId: created.id })).status, 200);
      assert.equal((await call(restore, 'POST')).status, 404);
      const extra = await (await call('/api/' + kind, 'POST', input)).json();
      assert.equal((await call('/api/' + kind + '/' + extra.id + '?permanent=1', 'DELETE', { confirmId: extra.id })).status, 200);
      assert.ok(!(await (await call('/api/trash')).json()).some(x => x.id === extra.id));
    }
  } finally { if (server?.listening) await stop(); fs.rmSync(directory, { recursive: true, force: true }); }
});
