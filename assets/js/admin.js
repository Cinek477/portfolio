// Panel galerii: sesja administratora, lista zdjęć, kadrowanie i zapis formularza.
const form = document.querySelector('#photo-form');
const statusElement = document.querySelector('#status');
const preview = document.querySelector('#preview');
let editingId = null;
let photos = [];
const selectedPhotos = new Set();
window.createAdminSearch(document.querySelector('#photo-list'),'Tytuł, album, miejsce, artysta…',active=>{
  document.querySelectorAll('[data-photo-order]').forEach(button=>{button.disabled=active||button.dataset.orderUnavailable==='true';button.title=active?'Wyczyść wyszukiwanie, aby zmienić kolejność.':'';});
});
const albumFilter = document.querySelector('#photo-album-filter');
const batchMove = document.querySelector('#photo-batch-move');
const albumKey = value => (value || '').trim().normalize('NFC').toLocaleLowerCase('pl');
function updateSelection() { batchMove.disabled = !selectedPhotos.size; batchMove.textContent = `Przenieś zaznaczone (${selectedPhotos.size})`; }
albumFilter.addEventListener('change', renderPhotos);
batchMove.addEventListener('click', async()=>{
  if (!selectedPhotos.size) return;
  const album=document.querySelector('#photo-batch-album').value.trim();
  if (!confirm(`Przenieść ${selectedPhotos.size} zdjęć ${album ? 'do albumu „'+album+'”' : 'poza albumy'}?`)) return;
  batchMove.disabled=true;
  try { await api('/api/photo-management',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:[...selectedPhotos],album})}); selectedPhotos.clear(); await loadPhotos(); status('Zmieniono album zaznaczonych zdjęć.'); }
  catch(error) { status(error.message,true); updateSelection(); }
});
let previewUrl = null;
const cropBox=document.querySelector('#photo-crop'),cropX=document.querySelector('#crop-x'),cropY=document.querySelector('#crop-y');
function refreshCrop(){
 cropBox.hidden=preview.hidden;
 const x=Number(cropX.value),y=Number(cropY.value);
 document.querySelector('#crop-x-value').textContent=x+'%';document.querySelector('#crop-y-value').textContent=y+'%';
 const shape=form.elements.shape.value;
 document.querySelector('#crop-desktop').style.aspectRatio=shape==='tall'?'230 / 398':shape==='wide'?'478 / 190':'230 / 190';
 for(const image of cropBox.querySelectorAll('img')){if(!preview.hidden&&image.getAttribute('src')!==preview.getAttribute('src'))image.src=preview.getAttribute('src');image.style.objectPosition=x+'% '+y+'%';}
}
cropX.addEventListener('input',refreshCrop);cropY.addEventListener('input',refreshCrop);
form.elements.shape.addEventListener('change',refreshCrop);
document.querySelector('#crop-center').onclick=()=>{cropX.value=cropY.value='50';refreshCrop();cropX.dispatchEvent(new Event('input',{bubbles:true}));};
const pl = (value) => (typeof value === 'string' ? value : value?.pl || '');
function updateCategory() {
  const concert = form.elements.category.value === 'concerts';
  const person = form.elements.category.value === 'people';
  form.elements.instagram.closest('label').hidden = !person;
  form.elements.instagram.disabled = !person;
  for (const key of ['artist', 'event', 'eventEn', 'city', 'cityEn', 'date']) {
    const input = form.elements[key];
    input.closest('label').hidden = !concert;
    input.disabled = !concert;
  }
  form.elements.title.required = concert;
  form.elements.venue.required = !concert;
  form.elements.venue.placeholder = concert ? 'PGE Narodowy' : 'Np. Tatry — Dolina Kościeliska';
}
form.elements.category.addEventListener('change', updateCategory);
updateCategory();
function status(message, error = false) {
  statusElement.textContent = message;
  statusElement.classList.toggle('error', error);
}
async function api(path = '/api/photos', options = {}) {
  const response = await fetch(path, options);
  const result = await response.json();
  if (response.status === 401 && !path.startsWith('/api/auth')) await refreshAuth();
  if (!response.ok) throw new Error(result.error || 'Nie udało się zapisać zmian.');
  if(options.method && !['GET','HEAD'].includes(options.method)) document.dispatchEvent(new Event('portfolio-admin-data-change'));
  return result;
}
function resetForm() {
  editingId = null;
  form.reset();
  updateCategory();
  form.elements.image.required = true;
  form.elements.image.disabled = false;
  preview.hidden = true;
  cropX.value=cropY.value='50';refreshCrop();
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  document.querySelector('#form-title').textContent = 'Dodaj zdjęcie';
  document.querySelector('#save').textContent = 'Zapisz zdjęcie';
  document.querySelector('#cancel').hidden = true;window.markAdminClean?.(form);
}
function edit(photo) {
  resetForm();
  editingId = photo.id;
  for (const key of [
    'title',
    'artist',
    'instagram',
    'album',
    'event',
    'venue',
    'city',
    'description',
    'category',
    'shape',
  ])
    form.elements[key].value = pl(photo[key]);
  for (const key of ['title', 'event', 'city', 'description'])
    form.elements[`${key}En`].value = photo[key]?.en || '';
  form.elements.date.value = photo.date ? photo.date.split('.').reverse().join('-') : '';
  if (photo.category !== 'concerts') form.elements.venue.value = pl(photo.place) || pl(photo.venue);
  updateCategory();
  form.elements.image.required = false;
  form.elements.image.disabled = true;
  preview.src = photo.src;
  preview.hidden = false;
  cropX.value=photo.crop?.x??50;cropY.value=photo.crop?.y??50;refreshCrop();
  document.querySelector('#form-title').textContent = 'Edytuj opis zdjęcia';
  document.querySelector('#save').textContent = 'Zapisz zmiany';
  document.querySelector('#cancel').hidden = false;
  window.markAdminClean?.(form);
  form.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}
async function loadPhotos() {
  photos = await api();
  const albumOptions = document.querySelector('#photo-albums');
  albumOptions.replaceChildren();
  const albums = new Map();
  photos.forEach(photo => { if (photo.album) albums.set(photo.album.toLocaleLowerCase('pl'), photo.album); });
  [...albums.values()].sort((a,b)=>a.localeCompare(b,'pl')).forEach(name => {
    const option = document.createElement('option'); option.value = name; albumOptions.append(option);
  });
  const filterValue=albumFilter.value;
  albumFilter.replaceChildren();
  for(const [value,label] of [['all','Wszystkie zdjęcia'],['none','Bez albumu'],...([...albums.values()].sort((a,b)=>a.localeCompare(b,'pl')).map(name=>['album:'+albumKey(name),name]))]) {
    const option=document.createElement('option');option.value=value;option.textContent=label;albumFilter.append(option);
  }
  albumFilter.value=[...albumFilter.options].some(option=>option.value===filterValue)?filterValue:'all';
  for(const id of selectedPhotos) if(!photos.some(photo=>photo.id===id)) selectedPhotos.delete(id);
  updateSelection(); renderPhotos();
}
function renderPhotos() {
  const visiblePhotos=photos.filter(photo=>albumFilter.value==='all' || (albumFilter.value==='none' ? !photo.album : 'album:'+albumKey(photo.album)===albumFilter.value));
  document.querySelector('#count').textContent = `(${visiblePhotos.length} / ${photos.length})`;
  const list = document.querySelector('#photo-list');
  list.replaceChildren();
  if (!visiblePhotos.length) {
    const message = document.createElement('p');
    message.textContent = photos.length ? 'Brak zdjęć w tym albumie.' : 'Dodaj swoje pierwsze zdjęcie.';
    list.append(message);
  }
  visiblePhotos.forEach((photo, index) => {
    const card = document.createElement('article');
    card.className = 'admin-photo';
    card.dataset.searchText=window.adminSearchText(photo.title,photo.album,photo.artist,photo.event,photo.place,photo.description,photo.date,photo.instagram);
    const image = new Image();
    image.src = photo.thumbUrl || photo.src;
    image.addEventListener(
      'error',
      () => {
        if (photo.thumbUrl) image.src = photo.src;
      },
      { once: true },
    );
    image.alt = pl(photo.title);
    image.loading = 'lazy';
    image.style.objectPosition=(photo.crop?.x??50)+'% '+(photo.crop?.y??50)+'%';
    const content = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = pl(photo.title);
    const summary = document.createElement('p');
    summary.textContent = [photo.album ? 'Album: ' + photo.album : '', pl(photo.place), photo.category === 'concerts' ? photo.date : '']
      .filter(Boolean)
      .join(' · ');
    const actions = document.createElement('div');
    actions.className = 'form-actions';
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'subtle';
    editButton.textContent = 'Edytuj';
    editButton.addEventListener('click', () => edit(photo));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger';
    remove.textContent = 'Usuń…';
    remove.addEventListener('click', async () => {
      const choice = await window.chooseAdminDeletion(pl(photo.title));
      if (!choice) return;
      remove.disabled = true;
      try {
        await api(`/api/photos/${photo.id}${choice === 'permanent' ? '?permanent=1' : ''}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmId: photo.id }) });
        if (editingId === photo.id) resetForm();
        await loadPhotos();
        status(choice === 'permanent' ? 'Trwale usunięto wpis zdjęcia. Plik zdjęcia pozostaje w magazynie.' : 'Zdjęcie przeniesione do kosza. Możesz je przywrócić w zakładce Kosz.');
      } catch (error) {
        status(error.message, true);
        remove.disabled = false;
      }
    });
    const selection=document.createElement('label'); selection.className='photo-selection';
    const check=document.createElement('input');check.type='checkbox';check.checked=selectedPhotos.has(photo.id);
    check.addEventListener('change',()=>{if(check.checked) selectedPhotos.add(photo.id);else selectedPhotos.delete(photo.id);updateSelection();});
    selection.append(check,document.createTextNode('Zaznacz')); content.append(selection);
    const visibility=document.createElement('button');visibility.type='button';visibility.className='subtle';visibility.textContent=photo.visible===false?'Pokaż na stronie':'Ukryj';
    visibility.addEventListener('click',async()=>{visibility.disabled=true;try{await api('/api/photo-management',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:[photo.id],visible:photo.visible===false})});await loadPhotos();status(photo.visible===false?'Zdjęcie pokazane.':'Zdjęcie ukryte — pozostaje w bazie.');}catch(error){status(error.message,true);visibility.disabled=false;}});
    const placement=document.createElement('button');placement.type='button';placement.className='subtle';
    placement.textContent=photo.galleryVisible===false?'Pokaż też w galerii':'Tylko w albumie';placement.disabled=!photo.album;
    placement.title=photo.album?'':'Najpierw przypisz zdjęcie do albumu';
    placement.addEventListener('click',async()=>{placement.disabled=true;try{await api('/api/photo-management',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids:[photo.id],galleryVisible:photo.galleryVisible===false})});await loadPhotos();status(photo.galleryVisible===false?'Zdjęcie widoczne także w galerii.':'Zdjęcie dostępne tylko w albumie.');}catch(error){status(error.message,true);placement.disabled=false;}});
    if(photo.galleryVisible===false) summary.textContent='Tylko w albumie · '+summary.textContent;
    if(photo.visible===false) summary.textContent='Ukryte · '+summary.textContent;
    for(const [direction,label] of [[-1,'↑'],[1,'↓']]){
      const move=document.createElement('button');move.type='button';move.className='subtle';move.textContent=label;move.setAttribute('aria-label',(direction<0?'Przesuń wcześniej: ':'Przesuń później: ')+pl(photo.title));
      move.disabled=!visiblePhotos[index+direction];move.dataset.photoOrder='';move.dataset.orderUnavailable=String(move.disabled);
      move.addEventListener('click',async()=>{const ids=photos.map(item=>item.id),a=ids.indexOf(photo.id),b=ids.indexOf(visiblePhotos[index+direction].id);[ids[a],ids[b]]=[ids[b],ids[a]];document.querySelector('#photo-list').inert=true;try{await api('/api/photo-order',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({ids})});await loadPhotos();}catch(error){status(error.message,true);}finally{document.querySelector('#photo-list').inert=false;}});
      actions.append(move);
    }
    const cover=document.createElement('button');cover.type='button';cover.className='subtle';cover.textContent=photo.albumCover?'✓ Okładka albumu':'Ustaw jako okładkę';cover.disabled=!photo.album||photo.visible===false||photo.albumCover===true;
    cover.title='Okładka otwiera album jako pierwsze zdjęcie. Nie zmienia widoczności zdjęć w głównej galerii.';
    cover.onclick=async()=>{cover.disabled=true;try{await api('/api/album-cover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:photo.id})});await loadPhotos();status('Zapisano okładkę albumu.');}catch(error){cover.disabled=false;status(error.message,true);}};
    actions.append(editButton, placement, cover, visibility, remove);
    content.append(title, summary, actions);
    card.append(image, content);
    list.append(card);
  });
}
form.elements.image.addEventListener('change', () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  const file = form.elements.image.files[0];
  preview.hidden = !file;
  if (file) {
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
  }
  refreshCrop();
});

function dominantColor(context) {
  const { data } = context.getImageData(0, 0, 48, 48);
  const buckets = new Map();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]],
      high = Math.max(r, g, b),
      low = Math.min(r, g, b);
    if (high < 35) continue;
    const saturation = (high - low) / high;
    if (saturation < 0.3) continue;
    const delta = high - low;
    let hue =
      high === r ? ((g - b) / delta) % 6 : high === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
    const key = Math.floor(hue / 15),
      weight = saturation ** 2 * Math.sqrt(high / 255);
    const bin = buckets.get(key) || { w: 0, r: 0, g: 0, b: 0 };
    bin.w += weight;
    bin.r += r * weight;
    bin.g += g * weight;
    bin.b += b * weight;
    buckets.set(key, bin);
  }
  const bin = [...buckets.values()].sort((a, b) => b.w - a.w)[0];
  if (!bin) return '#6273dc';
  const rgb = [bin.r / bin.w, bin.g / bin.w, bin.b / bin.w],
    boost = 220 / Math.max(...rgb);
  return (
    '#' +
    rgb
      .map((value) =>
        Math.round(value * boost)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
async function prepareImage(file) {
  if (file.size > 20 * 1024 * 1024) throw new Error('Wybierz zdjęcie mniejsze niż 20 MB.');
  const url = URL.createObjectURL(file),
    image = new Image();
  image.src = url;
  try {
    await image.decode();
    const canvas = document.createElement('canvas'),
      scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight));
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const sample = document.createElement('canvas');
    sample.width = sample.height = 48;
    const sampleContext = sample.getContext('2d', { willReadFrequently: true });
    sampleContext.drawImage(image, 0, 0, 48, 48);
    const thumbnail = document.createElement('canvas');
    const thumbScale = Math.min(1, 800 / canvas.width);
    thumbnail.width = Math.max(1, Math.round(canvas.width * thumbScale));
    thumbnail.height = Math.max(1, Math.round(canvas.height * thumbScale));
    thumbnail.getContext('2d').drawImage(canvas, 0, 0, thumbnail.width, thumbnail.height);
    return {
      image: canvas.toDataURL('image/jpeg', 0.85),
      thumbnail: thumbnail.toDataURL('image/webp', 0.78),
      glowColor: dominantColor(sampleContext),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const targetId = editingId;
  const save = document.querySelector('#save');
  save.disabled = true;
  form.inert = true;
  document.querySelector('#photo-list').inert = true;
  status(editingId ? 'Zapisywanie zmian…' : 'Przygotowywanie i zapisywanie zdjęcia…');
  try {
    const input = Object.fromEntries(new FormData(form));
    delete input.image;
    input.crop={x:Number(cropX.value),y:Number(cropY.value)};
    if (!targetId) Object.assign(input, await prepareImage(form.elements.image.files[0]));
    await api(targetId ? `/api/photos/${targetId}` : '/api/photos', {
      method: targetId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    resetForm();
    await loadPhotos();
    status('Zapisano w galerii i plikach do Git. Aby wysłać na GitHub, wykonaj commit i push.');
  } catch (error) {
    status(error.message, true);
  } finally {
    save.disabled = false;
    form.inert = false;
    document.querySelector('#photo-list').inert = false;
  }
});
document.querySelector('#cancel').addEventListener('click', resetForm);
const loginForm = document.querySelector('#login-form');
document.querySelectorAll('[data-panel]').forEach((button) =>
  button.addEventListener('click', async () => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    if(!button.dataset.page && window.adminPageHasChanges?.() && !confirm('Masz niezapisane zmiany podstrony. Przejść do innej zakładki? Formularz zachowamy do czasu powrotu.'))return;
    if (button.dataset.page && window.canSelectAdminPage && !window.canSelectAdminPage(button.dataset.page)) return;
    document.querySelectorAll('[data-panel]').forEach((tab) => {
      const active = tab === button;
      tab.setAttribute('aria-pressed', String(active));
    });
    for (const panel of ['gallery', 'projects', 'messages', 'home', 'trash', 'backups', 'reviews', 'preflight', 'spotify'])
      document.querySelector(`#${panel}-panel`).hidden = panel !== (button.dataset.target || button.dataset.panel);
    if (button.dataset.page) window.selectAdminPage?.(button.dataset.page).catch(error => status(error.message, true));
    if (['projects', 'achievements'].includes(button.dataset.panel))
      window.selectAdminProjectSection?.(button.dataset.panel);
    if (button.dataset.panel === 'spotify') window.loadAdminSpotify?.();
    if (button.dataset.panel === 'preflight') window.runAdminPreflight?.();
    if (button.dataset.panel === 'reviews') window.loadAdminReviews?.().catch(error=>status(error.message,true));
    if (button.dataset.panel === 'backups') window.loadAdminBackups?.().catch(error=>status(error.message,true));
    if (button.dataset.panel === 'trash') window.loadAdminTrash?.().catch(error => status(error.message, true));
    if (button.dataset.panel === 'messages' && window.loadAdminMessages)
      window.loadAdminMessages().catch((error) => status(error.message, true));
  }),
);
let requiresSetup = false;
async function refreshAuth() {
  const auth = await api('/api/auth/status');
  requiresSetup = auth.requiresSetup;
  document.querySelector('#admin-tabs').hidden = !auth.authenticated;
  document.querySelector('#home-panel').hidden = !auth.authenticated || !document.querySelector('[data-page][aria-pressed="true"]');
  document.querySelector('#gallery-panel').hidden =
    !auth.authenticated ||
    document.querySelector('[data-panel="gallery"]').getAttribute('aria-pressed') !== 'true';
  document.querySelector('#projects-panel').hidden =
    !auth.authenticated ||
    !document.querySelector('[data-panel="projects"][aria-pressed="true"], [data-panel="achievements"][aria-pressed="true"]');
  document.querySelector('#auth-panel').hidden = auth.authenticated;
  document.querySelector('#messages-panel').hidden =
    !auth.authenticated ||
    document.querySelector('[data-panel="messages"]').getAttribute('aria-pressed') !== 'true';
  document.querySelector('#trash-panel').hidden = !auth.authenticated || !document.querySelector('[data-panel="trash"][aria-pressed="true"]');
  document.querySelector('#spotify-panel').hidden = !auth.authenticated || !document.querySelector('[data-panel="spotify"][aria-pressed="true"]');
  document.querySelector('#preflight-panel').hidden = !auth.authenticated || !document.querySelector('[data-panel="preflight"][aria-pressed="true"]');
  document.querySelector('#reviews-panel').hidden = !auth.authenticated || !document.querySelector('[data-panel="reviews"][aria-pressed="true"]');
  if(auth.authenticated && !document.querySelector('#reviews-panel').hidden) await window.loadAdminReviews?.();
  document.querySelector('#logout').hidden = !auth.authenticated;
  document.querySelector('#admin-stats').hidden = !auth.authenticated;
  document.querySelector('#backups-panel').hidden = !auth.authenticated || !document.querySelector('[data-panel="backups"][aria-pressed="true"]');
  if(auth.authenticated) window.loadAdminStats?.();
  if (auth.authenticated) {
    if (!document.querySelector('#home-panel').hidden) await window.loadAdminHome?.();
    if (!document.querySelector('#trash-panel').hidden) await window.loadAdminTrash?.();
    await loadPhotos();
    if (window.loadAdminProjects) await window.loadAdminProjects();
    if (window.loadAdminMessages) await window.loadAdminMessages();
    return;
  }
  document.querySelector('#photo-list').replaceChildren();
  document.querySelector('#project-list').replaceChildren();
  document.querySelector('#messages-list').replaceChildren();
  document.querySelector('#trash-list').replaceChildren();
  document.querySelector('#messages-badge').textContent = '';
  document.querySelector('#auth-title').textContent = requiresSetup
    ? 'Ustaw swoje hasło'
    : 'Zaloguj się';
  document.querySelector('#auth-description').textContent = requiresSetup
    ? 'Pierwsze uruchomienie. Ustaw hasło dla konta admin (minimum 10 znaków).'
    : 'Wpisz login i hasło, aby zarządzać galerią.';
  document.querySelector('#login-submit').textContent = requiresSetup
    ? 'Utwórz dostęp do panelu'
    : 'Zaloguj się';
  document.querySelector('#confirm-password-label').hidden = !requiresSetup;
  loginForm.elements.confirmPassword.required = requiresSetup;
  loginForm.elements.password.autocomplete = requiresSetup ? 'new-password' : 'current-password';
}
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const password = loginForm.elements.password.value;
  if (requiresSetup && password !== loginForm.elements.confirmPassword.value) {
    status('Hasła muszą być takie same.', true);
    return;
  }
  const button = document.querySelector('#login-submit');
  button.disabled = true;
  try {
    await api(requiresSetup ? '/api/auth/setup' : '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginForm.elements.username.value, password }),
    });
    loginForm.reset();
    await refreshAuth();
    status('Zalogowano do panelu administratora.');
  } catch (error) {
    status(error.message, true);
  } finally {
    button.disabled = false;
  }
});
document.querySelector('#logout').addEventListener('click', async () => {
  try {
    await api('/api/auth/logout', { method: 'POST' });
    resetForm();
    loginForm.reset();
    await refreshAuth();
    status('Wylogowano.');
  } catch (error) {
    status(error.message, true);
  }
});
if (location.protocol === 'file:')
  status('Uruchom serwer i otwórz http://localhost:3000/admin.html.', true);
else refreshAuth().catch((error) => status(error.message, true));

form.addEventListener('admin-discard',resetForm);
