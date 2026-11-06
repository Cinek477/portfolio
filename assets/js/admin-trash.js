// Kosz panelu: przywracanie wpisów i potwierdzone trwałe usuwanie.
(() => {
  const list = document.querySelector('#trash-list');
  const category = item => item.kind === 'photos' ? 'Zdjęcie' : item.data.section === 'achievements' ? 'Osiągnięcie' : 'Projekt';
  let version = 0;
  window.loadAdminTrash = async () => {
    const request = ++version;
    const items = await api('/api/trash');
    if (request !== version) return;
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('p'); empty.textContent = 'Kosz jest pusty.'; list.append(empty);
    }
    for (const item of items) {
      const card = document.createElement('article'); card.className = 'admin-photo';
      const photo = item.data;
      if (photo.src) {
        const image = new Image(); image.src = photo.thumbUrl || photo.src;
        image.alt = pl(photo.title); image.loading = 'lazy';
        image.addEventListener('error', () => { if (photo.thumbUrl) image.src = photo.src; }, { once: true });
        card.append(image);
      }
      const content = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = pl(photo.title) || pl(photo.place) || 'Bez tytułu';
      const meta = document.createElement('p'); meta.textContent = category(item) + ' · ' + new Date(item.deleted_at).toLocaleString('pl-PL');
      const description = document.createElement('p'); description.textContent = pl(photo.description) || pl(photo.summary);
      const restore = document.createElement('button'); restore.type = 'button'; restore.className = 'subtle'; restore.textContent = 'Przywróć';
      restore.setAttribute('aria-label', 'Przywróć: ' + title.textContent);
      restore.addEventListener('click', async () => {
        restore.disabled = true;
        try {
          await api('/api/trash/' + item.kind + '/' + item.id + '/restore', { method: 'POST' });
          await window.loadAdminTrash();
          if (item.kind === 'photos') await loadPhotos();
          else await window.loadAdminProjects();
          status('Przywrócono: ' + title.textContent + '. Zachowano opis, zdjęcie i poprzednią widoczność.');
        } catch (error) { status(error.message, true); restore.disabled = false; }
      });
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger'; remove.textContent = 'Usuń trwale…';
      remove.addEventListener('click', async () => {
        if (await window.chooseAdminDeletion(title.textContent, true) !== 'permanent') return;
        remove.disabled = true;
        try {
          await api('/api/trash/' + item.kind + '/' + item.id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmId: item.id }) });
          await window.loadAdminTrash(); status('Trwale usunięto wpis: ' + title.textContent + '. Plik zdjęcia pozostaje w magazynie.');
        } catch (error) { status(error.message, true); remove.disabled = false; }
      });
      const actions = document.createElement('div'); actions.className = 'form-actions'; actions.append(restore, remove);
      content.append(title, meta, description, actions); card.append(content); list.append(card);
    }
  };
  document.querySelector('#trash-refresh').addEventListener('click', () => window.loadAdminTrash().catch(error => status(error.message, true)));
})();
