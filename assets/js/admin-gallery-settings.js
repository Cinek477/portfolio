(() => {
  const form = document.querySelector('#gallery-settings-form');
  const status = document.querySelector('#gallery-settings-status');
  const preview = document.querySelector('#watermark-preview');
  let loaded = false;
  const updatePreview = () => {
    preview.textContent = !form.elements.watermarkEnabled.checked ? 'Wyłączony' : form.elements.watermarkText.value.trim() || 'Nazwa artysty / tytuł zdjęcia';
  };
  form.addEventListener('input', updatePreview);
  window.loadAdminGallerySettings = async () => {
    loaded = false;
    form.querySelector('button').disabled = true;
    try {
      const response = await fetch('/api/gallery-settings');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Nie udało się wczytać ustawień.');
      form.elements.watermarkEnabled.checked = data.watermarkEnabled;
      form.elements.watermarkText.value = data.watermarkText;
      loaded = true;
      status.textContent = '';
      updatePreview();
    } catch (error) { status.textContent = error.message; }
    finally { form.querySelector('button').disabled = !loaded; }
  };
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!loaded) return;
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const response = await fetch('/api/gallery-settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ watermarkEnabled: form.elements.watermarkEnabled.checked, watermarkText: form.elements.watermarkText.value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Nie udało się zapisać ustawień.');
      status.textContent = 'Zapisano lokalnie. Odśwież galerię, aby zobaczyć zmianę. Publikacja wymaga commit i push.';
    } catch (error) { status.textContent = error.message; }
    finally { button.disabled = false; }
  });
})();
