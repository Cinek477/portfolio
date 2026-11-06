const fs = require('node:fs');

// Zasoby zachowują adresy po edycji, więc przeglądarka ma je rewalidować.
// ETag pozwala odpowiedzieć 304 bez ponownego przesyłania zdjęć, fontów i JS.
function sendAsset(req, res, file, stats, contentType) {
  const etag = `W/"${stats.size.toString(16)}-${stats.mtimeMs.toString(16)}"`;
  const headers = {
    'Content-Type': contentType,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-cache',
    ETag: etag,
  };
  const matches = (req.headers['if-none-match'] || '').split(',').map(value => value.trim());
  if (matches.includes(etag) || matches.includes('*')) {
    res.writeHead(304, headers);
    return res.end();
  }
  res.writeHead(200, { ...headers, 'Content-Length': stats.size });
  if (req.method === 'HEAD') return res.end();

  const stream = fs.createReadStream(file);
  // Przerwane pobieranie nie powinno zostawiać otwartego pliku na serwerze.
  res.on('close', () => stream.destroy());
  stream.on('error', error => res.destroy(error));
  stream.pipe(res);
}

module.exports = { sendAsset };
