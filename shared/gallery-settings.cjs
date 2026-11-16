const defaults = { watermarkEnabled: true, watermarkText: '' };
function normalizeGallerySettings(input) {
  if (!input || typeof input.watermarkEnabled !== 'boolean' || typeof input.watermarkText !== 'string' || input.watermarkText.length > 80) {
    throw Object.assign(new Error('Podaj napis do 80 znaków i poprawną widoczność.'), { status: 400 });
  }
  return { watermarkEnabled: input.watermarkEnabled, watermarkText: input.watermarkText.trim() };
}
module.exports = { defaults, normalizeGallerySettings };
