// Wspólne dialogi potwierdzania usunięcia i operacji nieodwracalnych.
(() => {
  const dialog = document.createElement('dialog'); dialog.className = 'admin-panel admin-delete-dialog';
  dialog.setAttribute('aria-labelledby', 'delete-dialog-title');
  const heading = document.createElement('h2'); heading.id = 'delete-dialog-title';
  const description = document.createElement('p'); description.id = 'delete-dialog-description'; dialog.setAttribute('aria-describedby', description.id);
  const label = document.createElement('label'); label.textContent = 'Aby potwierdzić, wpisz USUŃ';
  const input = document.createElement('input'); input.autocomplete = 'off'; input.spellcheck = false; label.append(input);
  const actions = document.createElement('div'); actions.className = 'form-actions';
  const button = (text, className) => { const el = document.createElement('button'); el.type = 'button'; el.textContent = text; el.className = className; actions.append(el); return el; };
  const cancel = button('Anuluj', 'subtle');
  const trash = button('Przenieś do kosza', 'subtle');
  const permanent = button('Usuń trwale', 'danger');
  dialog.append(heading, description, label, actions); document.querySelector('.admin-shell').append(dialog);
  let resolveChoice, confirming = false, selectedTitle = '';
  function finish(choice) { dialog.close(); const resolve = resolveChoice; resolveChoice = null; resolve?.(choice); }
  window.chooseAdminDeletion = (title, inTrash = false, message = false) => {
    if (resolveChoice) return Promise.resolve(null);
    selectedTitle = title; confirming = false; label.hidden = true; input.value = ''; permanent.disabled = false;
    heading.textContent = 'Co zrobić z wpisem „' + title + '”?';
    description.textContent = inTrash ? 'Wpis jest już w koszu. Trwałego usunięcia opisu nie będzie można cofnąć w panelu. Plik zdjęcia pozostanie w magazynie.' : 'Kosz ukryje wpis na stronie i zachowa zdjęcie oraz pełny opis do przywrócenia. Możesz też anulować lub wybrać trwałe usunięcie opisu. Plik zdjęcia pozostanie w magazynie.';
    if (message) description.textContent = 'Wiadomość jest w koszu. Trwałego usunięcia jej treści i danych nadawcy nie można cofnąć w panelu. Ta operacja nie dotyczy skrzynki Gmail.';
    trash.hidden = inTrash; dialog.showModal(); cancel.focus();
    return new Promise(resolve => { resolveChoice = resolve; });
  };
  cancel.addEventListener('click', () => finish(null));
  trash.addEventListener('click', () => finish('trash'));
  permanent.addEventListener('click', () => {
    if (!confirming) {
      confirming = true; heading.textContent = 'Trwale usunąć „' + selectedTitle + '”?';
      label.hidden = false; trash.hidden = true; permanent.disabled = true; input.focus(); return;
    }
    if (input.value.trim() === 'USUŃ') finish('permanent');
  });
  input.addEventListener('input', () => { permanent.disabled = input.value.trim() !== 'USUŃ'; });
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(null); });
  dialog.addEventListener('close', () => { const resolve = resolveChoice; resolveChoice = null; resolve?.(null); });
})();

(() => {
  const dialog = document.createElement('dialog'); dialog.className = 'admin-panel admin-delete-dialog';
  dialog.setAttribute('aria-labelledby', 'action-confirm-title');
  const title = document.createElement('h2'); title.id = 'action-confirm-title';
  const message = document.createElement('p'); message.id = 'action-confirm-message'; dialog.setAttribute('aria-describedby', message.id);
  const preference = document.createElement('label'); preference.className = 'admin-confirm-preference';
  const checkbox = document.createElement('input'); checkbox.type = 'checkbox';
  const caption = document.createElement('span'); caption.textContent = 'Nie pytaj ponownie przy przenoszeniu wiadomości do kosza'; preference.append(checkbox, caption);
  const actions = document.createElement('div'); actions.className = 'form-actions';
  const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'subtle'; cancel.textContent = 'Anuluj';
  const accept = document.createElement('button'); accept.type = 'button'; accept.textContent = 'Przenieś do kosza';
  actions.append(cancel, accept); dialog.append(title, message, preference, actions); document.querySelector('.admin-shell').append(dialog);
  let resolveChoice, preferenceKey;
  const stored = key => { try { return key && localStorage.getItem(key) === 'true'; } catch { return false; } };
  function finish(answer) {
    if (answer && preferenceKey && checkbox.checked) { try { localStorage.setItem(preferenceKey, 'true'); } catch {} }
    dialog.close(); const resolve = resolveChoice; resolveChoice = null; resolve?.(answer);
  }
  window.confirmAdminAction = options => {
    if (stored(options.preferenceKey)) return Promise.resolve(true);
    if (resolveChoice) return Promise.resolve(false);
    preferenceKey = options.preferenceKey; checkbox.checked = false; preference.hidden = !preferenceKey;
    title.textContent = options.title; message.textContent = options.message; accept.textContent = options.accept || 'Potwierdź';
    dialog.showModal(); cancel.focus(); return new Promise(resolve => { resolveChoice = resolve; });
  };
  cancel.addEventListener('click', () => finish(false)); accept.addEventListener('click', () => finish(true));
  dialog.addEventListener('cancel', event => { event.preventDefault(); finish(false); });
  dialog.addEventListener('close', () => { const resolve = resolveChoice; resolveChoice = null; resolve?.(false); });
})();
