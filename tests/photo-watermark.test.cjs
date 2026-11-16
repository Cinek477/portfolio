const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalize } = require('../shared/normalize.cjs');
test('Photo watermark: custom text, clearing, backward compatibility and validation', () => {
  const input = { category: 'people', venue: 'Mural', title: 'Portret' };
  assert.equal(normalize(input).watermarkText, '');
  const photo = normalize({ ...input, watermarkText: '  KLAUDYNA  ' });
  assert.equal(photo.watermarkText, 'KLAUDYNA');
  assert.equal(normalize(input, photo).watermarkText, 'KLAUDYNA');
  assert.equal(normalize({ ...input, watermarkText: '' }, photo).watermarkText, '');
  assert.equal(normalize({ ...input, watermarkText: 'a'.repeat(80) }).watermarkText.length, 80);
  for (const value of ['a'.repeat(81), null, {}, 123]) assert.throws(() => normalize({ ...input, watermarkText: value }));
});
