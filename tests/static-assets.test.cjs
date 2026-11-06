const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createGalleryServer } = require('../server.cjs');

test('Static assets revalidate with ETag; HEAD and 304 transfer no body and API stays private', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-assets-'));
  const server = createGalleryServer({
    dataDir: directory,
    uploadDir: path.join(directory, 'images'),
    exportFile: path.join(directory, 'gallery-data.js'),
  });
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    const asset = '/assets/css/portfolio.css';
    const response = await fetch(base + asset);
    assert.equal(response.status, 200);
    const etag = response.headers.get('etag');
    assert.ok(etag);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
    assert.equal(await response.text(), fs.readFileSync(path.join(__dirname, '..', asset.slice(1)), 'utf8'));

    for (const method of ['GET', 'HEAD']) {
      const cached = await fetch(base + asset, { method, headers: { 'If-None-Match': `"old", ${etag}` } });
      assert.equal(cached.status, 304);
      assert.equal(await cached.text(), '');
      assert.equal(cached.headers.get('etag'), etag);
    }
    const head = await fetch(base + asset, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    const changed = await fetch(base + asset, { headers: { 'If-None-Match': '"outdated"' } });
    assert.equal(changed.status, 200);
    await changed.arrayBuffer();
    const api = await fetch(base + '/api/photos', { headers: { 'If-None-Match': '*' } });
    assert.equal(api.status, 200);
    assert.equal(api.headers.get('cache-control'), 'no-store');
    assert.equal(api.headers.get('etag'), null);
    await api.arrayBuffer();
  } finally {
    await new Promise(resolve => server.close(resolve));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
