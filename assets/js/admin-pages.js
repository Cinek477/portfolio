(() => {
  const form = document.querySelector('#page-editor-form');
  const fields = document.querySelector('#page-editor-fields');
  const state = document.querySelector('#page-editor-state');
  const sectionTabs = document.querySelector('#page-editor-sections');
  const picker = document.querySelector('#page-section-picker');
  const currentSection = document.querySelector('#page-section-current');
  const sectionSearch = document.querySelector('#page-section-search');
  const emptySections = document.querySelector('#section-picker-empty');
  function filterSections() {
    const query = sectionSearch.value.trim().toLocaleLowerCase('pl');
    let count = 0;
    editorSections.forEach(({ tab }) => {
      tab.hidden = !tab.textContent.toLocaleLowerCase('pl').includes(query);
      if (!tab.hidden) count++;
    });
    emptySections.hidden = count !== 0;
  }
  sectionSearch.addEventListener('input', filterSections);
  picker.addEventListener('toggle', () => {
    if (picker.open) { sectionSearch.value = ''; filterSections(); sectionSearch.focus(); }
  });
  document.addEventListener('click', event => { if (!picker.contains(event.target)) picker.open = false; });
  picker.addEventListener('focusout', event => { if (event.relatedTarget && !picker.contains(event.relatedTarget)) picker.open = false; });
  picker.addEventListener('keydown', event => {
    const options = editorSections.map(entry => entry.tab).filter(tab => !tab.hidden);
    const current = options.indexOf(document.activeElement);
    if (event.key === 'Escape') { event.preventDefault(); picker.open = false; picker.querySelector('summary').focus(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); picker.open = true;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const next = current < 0 ? (direction > 0 ? 0 : options.length - 1) : (current + direction + options.length) % options.length;
      options[next]?.focus();
    }
  });
  const activeSections = new Map();
  let editorSections = [];
  function activateSection(index, focus = false) {
    if (!editorSections[index]) return;
    activeSections.set(selected, index);
    editorSections.forEach(({ panel, tab }, i) => {
      panel.hidden = i !== index;
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = 0;
    });
    currentSection.textContent = editorSections[index].tab.textContent;
    picker.hidden = false;
    picker.open = false;
    if (focus) picker.querySelector('summary').focus();
  }
  form.addEventListener('invalid', () => {
    const first = form.querySelector(':invalid');
    const index = editorSections.findIndex(entry => first && entry.panel.contains(first));
    if (index >= 0) activateSection(index);
  }, true);
  let selected = 'home', record, projects = [], readFields, dirty = false, busy = false, previewUrl;
  let saving = false, loadController, projectsLoadedAt = 0, savedDraft = false;
  const publishButton = document.querySelector('#page-editor-publish');
  const historyButton = document.querySelector('#page-editor-history');
  const cache = new Map();
  document.addEventListener('portfolio-admin-projects-change', () => { projectsLoadedAt = 0; });
  const names = { home: 'Start', about: 'O mnie', projects: 'Projekty', knowledge: 'Korepetycje', hobby: 'Po godzinach', contact: 'Kontakt' };
  const urls = { home: 'index.html', about: 'about.html', projects: 'projects.html', knowledge: 'knowledge.html', hobby: 'hobby.html', contact: 'contact.html' };
  window.adminPageHasChanges=()=>dirty;
  const markDirty = () => { dirty = true; state.textContent = 'Masz niezapisane zmiany.'; };
  form.addEventListener('input', markDirty);
  form.addEventListener('change', markDirty);
  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }
  function field(parent, label, value, type = 'text', max = 500) {
    const wrapper = node('label', '', label);
    const input = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') input.type = type;
    else input.rows = 4;
    if (type === 'checkbox') input.checked = value;
    else if (type !== 'file') input.value = value || '';
    if (!['file', 'checkbox'].includes(type)) input.maxLength = max;
    wrapper.append(input);
    parent.append(wrapper);
    return input;
  }
  function bilingual(parent, label, value, multiline = false, max = 500, optional = false) {
    const row = node('div', multiline ? '' : 'form-row');
    const pl = field(row, label + ' PL', value?.pl, multiline ? 'textarea' : 'text', max);
    const en = field(row, label + ' EN', value?.en, multiline ? 'textarea' : 'text', max);
    pl.required = !optional;
    en.placeholder = 'Jeśli puste, użyj tekstu PL';
    parent.append(row);
    return () => ({ pl: pl.value.trim(), en: en.value.trim() || pl.value.trim() });
  }
  function section(title) {
    const existing = editorSections.find(entry => entry.panel.querySelector('legend')?.textContent === title);
    if (existing) return existing.panel;
    const box = node('fieldset', 'page-editor-section');
    box.append(node('legend', '', title));
    const index = editorSections.length;
    const tab = node('button', 'page-section-tab', title);
    tab.type = 'button'; tab.id = 'page-section-tab-' + index;
    tab.setAttribute('role', 'option');
    tab.setAttribute('aria-label', title);
    tab.setAttribute('aria-controls', 'page-section-' + index);
    box.id = 'page-section-' + index;
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', title);
    tab.addEventListener('click', () => activateSection(index, true));
    editorSections.push({ panel: box, tab });
    sectionTabs.append(tab);
    fields.append(box);
    return box;
  }
  function listEditor(parent, title, values, create, emptyValue, limit) {
    const container = node('div', 'page-editor-list');
    const undoList = node('div', 'page-editor-undo');
    const add = node('button', 'subtle', 'Dodaj: ' + title);
    add.type = 'button';
    const update = () => {
      const entries = [...container.children];
      add.disabled = entries.length >= limit;
      entries.forEach((entry, index) => {
        entry.up.disabled = index === 0;
        entry.down.disabled = index === entries.length - 1;
      });
    };
    const insert = value => {
      const entry = node('div', 'page-editor-entry');
      entry.read = create(entry, value);
      const actions = node('div', 'form-actions');
      const action = (text, label, callback, danger = false) => {
        const button = node('button', danger ? 'danger' : 'subtle', text);
        button.type = 'button';
        button.setAttribute('aria-label', label + ': ' + title);
        button.addEventListener('click', async () => { if (await callback() === false) return; update(); markDirty(); });
        actions.append(button);
        return button;
      };
      entry.up = action('↑', 'Przesuń w górę', () => { if (entry.previousElementSibling) container.insertBefore(entry, entry.previousElementSibling); });
      entry.down = action('↓', 'Przesuń w dół', () => { if (entry.nextElementSibling) container.insertBefore(entry.nextElementSibling, entry); });
      action('Usuń', 'Usuń', async () => {
        const label = entry.querySelector('input:not([type="checkbox"]),textarea')?.value?.trim();
        if (!await window.confirmAdminAction({ title: 'Usunąć element z formularza?', message: 'Element: ' + (label || title) + '. Możesz cofnąć usunięcie przed zapisaniem podstrony.', accept: 'Usuń z formularza' })) return false;
        const index = [...container.children].indexOf(entry);
        const notice = node('div', 'page-editor-undo-item');
        notice.append(node('span', '', 'Usunięto: ' + (label || title) + '. Zmiana czeka na zapis.'));
        const undo = node('button', 'subtle', 'Cofnij usunięcie'); undo.type = 'button';
        undo.addEventListener('click', () => {
          if (container.children.length >= limit) { status('Najpierw zwolnij miejsce na liście, aby przywrócić ten element.', true); return; }
          container.insertBefore(entry, container.children[index] || null);
          notice.remove(); update(); markDirty(); entry.querySelector('input,textarea,button')?.focus();
        });
        notice.append(undo); undoList.append(notice); entry.remove(); undo.focus();
      }, true);
      entry.append(actions);
      container.append(entry);
      update();
    };
    values.forEach(insert);
    add.addEventListener('click', () => { if (container.children.length < limit) { insert(structuredClone(emptyValue)); markDirty(); } });
    parent.append(container, undoList, add);
    update();
    return () => [...container.children].map(entry => entry.read());
  }
  function editorFields(editor) {
    if (!editor) return () => undefined;
    const readers = editor.groups.map(group => {
      const box = section(group.title);
      const visible = field(box, 'Pokazuj sekcję na stronie', group.visible, 'checkbox');
      if(selected === 'contact') { visible.closest('label').hidden=true; visible.checked=true; }
      if(selected==='knowledge' && group.id==='group-6') box.append(node('p','admin-hint','Treść, podpisy i oceny edytuj w Bazy danych → Opinie.'));
      const texts = group.fields.map(item => {
        if(selected==='knowledge' && group.id==='group-6' && !['text-0','text-1'].includes(item.id)) return ()=>item;
        if (item.kind === 'rating') {
          const input = field(box, 'Ocena opinii (0–5)', parseFloat(item.value.pl.replace(',', '.')), 'number');
          input.min = '0'; input.max = '5'; input.step = '0.5'; input.required = true;
          return () => ({ ...item, value: { pl: input.value.replace('.', ',') + ' / 5', en: input.value + ' / 5' } });
        }
        const read = bilingual(box, item.label || 'Tekst', item.value, item.value.pl.length > 100, 5000, true);
        return () => ({ ...item, value: read() });
      });
      const links = group.links.map(item => {
        const href = field(box, 'Link: ' + item.label, item.href, 'text', 2000);
        const enabled = field(box, 'Pokazuj przycisk / link', item.visible, 'checkbox');
        const active = typeof item.enabled === 'boolean' ? field(box, 'Aktywny link (wyłączony pokazuje SOON)', item.enabled, 'checkbox') : null;
        return () => ({ ...item, href: href.value.trim(), visible: enabled.checked, ...(active ? { enabled: active.checked } : {}) });
      });
      return () => ({ ...group, visible: visible.checked, fields: texts.map(read => read()), links: links.map(read => read()) });
    });
    return () => ({ groups: readers.map(read => read()) });
  }
  function build() {
    fields.replaceChildren();
    sectionTabs.replaceChildren(); editorSections = []; picker.hidden = true; picker.open = false; sectionSearch.value = ''; emptySections.hidden = true;
    if (selected === 'projects' || selected === 'contact') {
      fields.append(node('p', 'page-editor-note', selected === 'contact' ? 'Edytuj teksty PL/EN, dane kontaktowe i opcje kreatora. Szkic publikujesz osobno.' : 'Nagłówki i przyciski podstrony edytujesz tutaj. Poszczególne realizacje i ich zdjęcia znajdziesz w Bazy danych → Projekty / Osiągnięcia.'));
      const readEditor = editorFields(record.editor);
      readFields = () => ({ editor: readEditor() });
      activateSection(Math.min(activeSections.get(selected) || 0, editorSections.length - 1));
      return;
    }
    if (selected === 'knowledge') {
      const readEditor = editorFields(record.editor);
      fields.prepend(node('p', 'page-editor-note', 'Wybierz sekcję powyżej. Treści, linki, pakiety, rabaty i FAQ zapisują się razem w bazie.'));
      const titles = { start: 'Pakiet START', single: 'Jedno spotkanie', regular: 'Regularna nauka', matura: 'Przygotowanie do matury' };
      const readers = record.offers.map(offer => {
        const box = section(titles[offer.id]);
        const enabled = field(box, 'Pokazuj plakietkę rabatu', offer.enabled, 'checkbox');
        const readText = bilingual(box, 'Tekst plakietki', offer.text, false, 100, true);
        return () => ({ id: offer.id, enabled: enabled.checked, text: readText() });
      });
      const readFaq = listEditor(section('FAQ'), 'pytanie', record.faq || [], (parent, entry) => {
        const visible = field(parent, 'Pokazuj na stronie', entry.visible, 'checkbox');
        const question = bilingual(parent, 'Pytanie', entry.question, false, 300);
        const answer = bilingual(parent, 'Odpowiedź', entry.answer, true, 3000);
        return () => ({ question: question(), answer: answer(), visible: visible.checked });
      }, { question: { pl: '', en: '' }, answer: { pl: '', en: '' }, visible: true }, 20);
      readFields = () => ({ offers: readers.map(read => read()), faq: readFaq(), editor: readEditor() });
      activateSection(Math.min(activeSections.get(selected) || 0, editorSections.length - 1));
      return;
    }
    const content = record.content;
    const readEditor = editorFields(content.editor);
    const heading = section('Nagłówek i wstęp');
    const readHeading = bilingual(heading, 'Nagłówek', content.heading, false, 160);
    const readAccent = bilingual(heading, 'Wyróżniona część nagłówka', content.accent, false, 160, true);
    const readGreeting = selected === 'home' ? bilingual(heading, 'Mały tekst nad nagłówkiem', content.greeting, false, 120, true) : () => content.greeting;
    const readBio = selected === 'home' ? bilingual(heading, 'Opis', record.bio, true, 2000) : null;
    let readCurrentWork;
    if(selected==='home'){
      const box=section('Teraz tworzę');const work=record.currentWork;
      const visible=field(box,'Pokazuj sekcję na Starcie',work.visible,'checkbox');
      const title=bilingual(box,'Nagłówek',work.title,false,120);const text=bilingual(box,'Aktualizacja',work.text,true,1000);
      readCurrentWork=()=>({visible:visible.checked,title:title(),text:text()});
    }
    const emptyText = { pl: '', en: '' };
    const readParagraphs = selected === 'about' ? listEditor(heading, 'akapit', content.paragraphs,
      (parent, value) => bilingual(parent, 'Treść', value, true, 5000), emptyText, 8) : () => content.paragraphs;
    const photo = section('Zdjęcie');
    const photoVisible = field(photo, 'Pokazuj zdjęcie', content.photo.visible, 'checkbox');
    const preview = node('img', 'page-editor-photo');
    preview.src = content.photo.thumbUrl || content.photo.src;
    preview.alt = 'Podgląd zdjęcia podstrony';
    preview.addEventListener('error', () => { preview.src = content.photo.src; }, { once: true });
    photo.append(preview);
    const photoFile = field(photo, 'Wymień zdjęcie (JPG, PNG lub WebP)', null, 'file');
    photoFile.accept = 'image/jpeg,image/png,image/webp';
    photoFile.addEventListener('change', () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = photoFile.files[0] ? URL.createObjectURL(photoFile.files[0]) : null;
      preview.src = previewUrl || content.photo.src;
    });
    const readAlt = bilingual(photo, 'Opis zdjęcia dla czytników ekranu', content.photo.alt, false, 300);
    const tags = section('Kapsułki');
    const readTags = listEditor(tags, 'kapsułka', content.tags,
      (parent, value) => bilingual(parent, 'Tekst', value, false, 80), emptyText, 12);
    const buttons = section('Przyciski');
    const readButtons = listEditor(buttons, 'przycisk', content.buttons, (parent, value) => {
      const readLabel = bilingual(parent, 'Tekst', value.label, false, 80);
      const href = field(parent, 'Link, np. contact.html, #featured-projects lub https://…', value.href, 'text', 2000);
      href.required = true;
      const visible = field(parent, 'Widoczny na stronie', value.visible, 'checkbox');
      const download = field(parent, 'Pobieraj plik zamiast otwierać link', value.download, 'checkbox');
      return () => ({ label: readLabel(), href: href.value.trim(), visible: visible.checked, download: download.checked });
    }, { label: emptyText, href: 'contact.html', visible: true, download: false }, 4);
    let readFeatured = null;
    if (selected === 'home') {
      const box = section('Wyróżnione projekty i osiągnięcia');
      const selects = [0, 1, 2].map(index => {
        const label = node('label', '', `Kafelek ${index + 1}`);
        const input = document.createElement('select');
        input.add(new Option('Nie pokazuj', ''));
        for (const project of projects) input.add(new Option(`${project.section === 'achievements' ? 'Osiągnięcie' : 'Projekt'}: ${pl(project.title)}${project.visible === false ? ' (ukryte)' : ''}`, project.id));
        input.value = record.featured[index] || '';
        label.append(input); box.append(label);
        return input;
      });
      readFeatured = () => selects.map(input => input.value).filter(Boolean);
    }
    const readSections = selected === 'about' ? listEditor(section('Sekcje CV'), 'sekcja', content.sections, (parent, value) => {
      const title = bilingual(parent, 'Tytuł', value.title, false, 160);
      const plain = document.createElement('details');
      plain.append(node('summary', '', 'Opis zwykłej sekcji (gdy nie ma wpisów osi czasu)'));
      const body = bilingual(plain, 'Treść', value.body, true, 5000, true);
      parent.append(plain);
      const entries = listEditor(parent, 'wpis osi czasu', value.entries || [], (entryParent, entry) => {
        const title = bilingual(entryParent, 'Nazwa / funkcja', entry.title, false, 300);
        const date = bilingual(entryParent, 'Okres, np. 2025–obecnie', entry.date, false, 160, true);
        const body = bilingual(entryParent, 'Opis', entry.body, true, 5000);
        return () => ({ title: title(), date: date(), body: body() });
      }, { title: emptyText, date: emptyText, body: emptyText }, 20);
      const visible = field(parent, 'Widoczna na stronie', value.visible, 'checkbox');
      return () => ({ title: title(), body: body(), visible: visible.checked, entries: entries() });
    }, { title: emptyText, body: emptyText, visible: true, entries: [] }, 12) : () => content.sections;
    const otherFields = {}, otherLinks = {};
    if (Object.keys(content.fields || {}).length) {
      const box = section('Pozostałe treści Start');
      const details = document.createElement('details');
      details.append(node('summary', '', 'Nagłówki i opisy pod wstępem'));
      for (const [key, value] of Object.entries(content.fields)) {
        otherFields[key] = bilingual(details, 'Tekst: ' + value.pl.slice(0, 55), value, value.pl.length > 90, 2000);
      }
      box.append(details);
    }
    if (Object.keys(content.links || {}).length) {
      const box = section('Odnośniki w dolnych sekcjach Start');
      for (const [key, value] of Object.entries(content.links)) {
        const href = field(box, 'Link: ' + value.href, value.href, 'text', 2000);
        href.required = true;
        const visible = field(box, 'Widoczny na stronie', value.visible, 'checkbox');
        otherLinks[key] = () => ({ href: href.value.trim(), visible: visible.checked });
      }
    }
    readFields = () => ({ ...record,
      ...(readBio ? { bio: readBio(), featured: readFeatured(), currentWork: readCurrentWork() } : {}),
      content: { editor: readEditor(), greeting: readGreeting(), heading: readHeading(), accent: readAccent(), paragraphs: readParagraphs(), tags: readTags(), buttons: readButtons(),
        photo: { ...content.photo, visible: photoVisible.checked, alt: readAlt() }, sections: readSections(),
        fields: Object.fromEntries(Object.entries(otherFields).map(([key, read]) => [key, read()])),
        links: Object.fromEntries(Object.entries(otherLinks).map(([key, read]) => [key, read()])),
      },
      file: photoFile.files[0],
    });
    activateSection(Math.min(activeSections.get(selected) || 0, editorSections.length - 1));
  }
  async function load() {
    loadController?.abort();
    const controller = new AbortController();
    loadController = controller;
    const page = selected;
    readFields = null;
    sectionTabs.replaceChildren(); editorSections = []; picker.hidden = true; picker.open = false; sectionSearch.value = ''; emptySections.hidden = true;
    busy = true; form.inert = true;
    state.textContent = 'Wczytywanie…';
    try {
      const preview = document.querySelector('#page-editor-preview');
      preview.href = urls[selected];
      preview.textContent = `Otwórz ${names[selected]} ↗`;
      document.querySelector('#page-editor-title').textContent = names[selected];
      const supported = ['home', 'about', 'projects', 'knowledge', 'contact'].includes(selected);
      document.querySelector('#page-editor-save').disabled = !supported;
      document.querySelector('#page-editor-compare').disabled = !supported;
      document.querySelector('#page-editor-draft-preview').disabled = !supported;
      document.querySelector('#page-editor-discard').disabled = !supported;
      publishButton.disabled = !supported; historyButton.disabled = !supported;
      if (!supported) {
        readFields = null; record = null; dirty = false;
        fields.replaceChildren(node('p', 'page-editor-note', 'Edycja treści tej podstrony będzie dostępna w kolejnym etapie. Teraz możesz otworzyć jej podgląd.'));
        state.textContent = '';
        return;
      }
      const cached = cache.get(page);
      const reloadProjects = page === 'home' && Date.now() - projectsLoadedAt >= 30000;
      const [data, items] = await Promise.all([
        cached && Date.now() - cached.time < 30000 ? cached.data : api(`/api/pages/${page}`, { signal: controller.signal }),
        reloadProjects ? api('/api/projects', { signal: controller.signal }) : projects,
      ]);
      if (controller.signal.aborted || selected !== page) return;
      cache.set(page, { data, time: Date.now() });
      const draft = await api(`/api/page-drafts/${page}`, { signal:controller.signal });
      if (controller.signal.aborted || selected !== page) return;
      savedDraft = Boolean(draft.data);
      record = draft.data || data; projects = items;
      if (reloadProjects) projectsLoadedAt = Date.now();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      build();
      dirty = false;
      state.textContent = savedDraft ? 'Wczytano zapisany szkic. Strona publiczna pozostaje bez zmian.' : 'Edytujesz wersję opublikowaną. Zmiany możesz zapisać jako szkic.';
    } catch (error) {
      if (controller.signal.aborted) return;
      fields.replaceChildren(); readFields = null;
      state.textContent = 'Nie udało się wczytać treści. Spróbuj ponownie.';
      throw error;
    } finally {
      if (loadController === controller) { busy = false; form.inert = false; }
    }
  }
  window.loadAdminHome = () => dirty || busy ? Promise.resolve() : load();
  window.canSelectAdminPage = page => Object.hasOwn(names, page) && !saving &&
    (page === selected || !dirty || confirm('Odrzucić niezapisane zmiany i przejść do innej podstrony?'));
  window.selectAdminPage = async page => {
    if (!Object.hasOwn(names, page) || saving) return false;
    if (page === selected && readFields) return true;
    selected = page;
    dirty = false;
    await load();
    return true;
  };
  document.querySelector('#page-editor-discard').addEventListener('click', async () => {
    if ((dirty || savedDraft) && !confirm('Usunąć szkic i niezapisane zmiany? Wersja publiczna pozostanie bez zmian.')) return;
    cache.delete(selected);
    try { await api(`/api/page-drafts/${selected}`, { method:'DELETE' }); await load(); } catch (error) { status(error.message, true); }
  });
  document.querySelector('#page-editor-compare').onclick=async()=>{
    if(!readFields||busy)return;
    const button=document.querySelector('#page-editor-compare');button.disabled=true;
    try{
      const published=await api('/api/pages/'+selected),current={...structuredClone(record),...readFields()};
      const file=current.file;delete current.file;
      const flatten=(value,prefix='',result={})=>{if(value===null||typeof value!=='object'){result[prefix]=String(value??'');return result;}for(const [key,item] of Object.entries(value))flatten(item,prefix?prefix+'.'+key:key,result);return result;};
      const before=flatten(published),after=flatten(current),keys=[...new Set([...Object.keys(before),...Object.keys(after)])].filter(key=>(before[key]??'')!==(after[key]??''));
      const dialog=node('dialog','admin-compare-dialog'),title=node('h2','','Porównanie z wersją opublikowaną'),close=node('button','subtle','Zamknij');close.type='button';close.onclick=()=>dialog.close();dialog.append(title,node('p','admin-hint','Po lewej wersja publiczna, po prawej aktualny formularz (także niezapisane zmiany). Porównanie niczego nie zapisuje.'),close);
      if(!keys.length&&!file)dialog.append(node('p','','Brak różnic.'));
      for(const key of keys){const row=node('section','compare-row');const words={content:'Treść',heading:'Nagłówek',bio:'Opis',paragraphs:'Akapity',tags:'Kapsułki',buttons:'Przyciski',label:'Podpis',href:'Adres',visible:'Widoczność',pl:'Polski',en:'Angielski',title:'Tytuł',text:'Tekst',greeting:'Powitanie',accent:'Wyróżnienie',editor:'Sekcje',groups:'Grupy',fields:'Pola',value:'Wartość',photo:'Zdjęcie'};const readable=key.split('.').map(part=>words[part]||(/^\d+$/.test(part)?'Element '+(Number(part)+1):part)).join(' › ');row.append(node('h3','',readable),node('pre','compare-before',before[key]||'—'),node('pre','compare-after',after[key]||'—'));dialog.append(row);}
      if(file)dialog.append(node('p','','Zdjęcie: wybrano nowy plik „'+file.name+'”.'));
      dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();close.focus();
    }catch(error){status(error.message,true);}finally{button.disabled=false;}
  };
  const draftButton = document.querySelector('#page-editor-draft-preview');
  draftButton.addEventListener('click', async () => {
    if (busy || !readFields) return;
    const page = selected;
    const draft = { ...structuredClone(record), ...readFields() };
    const file = draft.file; delete draft.file;
    let photoUrl;
    draftButton.disabled = true;
    try {
      if (file && draft.content?.photo) {
        photoUrl = URL.createObjectURL(file);
        draft.content.photo = { ...draft.content.photo, src: photoUrl, thumbUrl: photoUrl };
      }
      const response = await fetch(urls[page]);
      if (!response.ok) throw new Error('Nie udało się otworzyć podglądu.');
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
      const base = doc.createElement('base'); base.href = new URL(urls[page], location.href).href; doc.head.prepend(base);
      const bootstrap = doc.createElement('script');
      const payload = JSON.stringify({ page, draft }).replace(/</g, '\\u003c');
      bootstrap.textContent = `(() => {
        const {page,draft} = ${payload};
        const originalFetch = window.fetch.bind(window);
        window.fetch = (input, options = {}) => {
          const url = new URL(typeof input === 'string' ? input : input.url, document.baseURI);
          const method = (options.method || input.method || 'GET').toUpperCase();
          if (method !== 'GET' && method !== 'HEAD') return Promise.reject(new Error('Podgląd: zapis wyłączony'));
          if (url.origin === new URL(document.baseURI).origin && url.pathname === '/api/pages/' + page) return Promise.resolve(new Response(JSON.stringify(draft), {headers:{'Content-Type':'application/json'}}));
          return originalFetch(input, options);
        };
        document.addEventListener('submit', event => event.preventDefault(), true);
        document.addEventListener('click', event => {
          const link = event.target.closest('a');
          if (link && !link.getAttribute('href')?.startsWith('#')) event.preventDefault();
        }, true);
      })();`;
      base.after(bootstrap);
      const dialog = node('dialog', 'draft-preview-dialog');
      const toolbar = node('div', 'draft-preview-toolbar');
      toolbar.append(node('strong', '', 'Podgląd — ' + names[page]), node('span', '', 'Niezapisane zmiany · linki i wysyłanie wyłączone'));
      const frame = node('iframe', 'draft-preview-frame'); frame.title = 'Podgląd niezapisanych zmian';
      const desktop = node('button', 'subtle', 'Komputer'); desktop.type = 'button'; desktop.setAttribute('aria-pressed', 'true');
      const mobile = node('button', 'subtle', 'Telefon'); mobile.type = 'button'; mobile.setAttribute('aria-pressed', 'false');
      const resize = phone => { frame.classList.toggle('is-mobile', phone); mobile.setAttribute('aria-pressed', String(phone)); desktop.setAttribute('aria-pressed', String(!phone)); };
      desktop.onclick = () => resize(false); mobile.onclick = () => resize(true);
      const close = node('button', 'subtle', 'Zamknij ×'); close.type = 'button'; close.onclick = () => dialog.close();
      toolbar.append(desktop, mobile, close); dialog.append(toolbar, frame); document.body.append(dialog);
      dialog.addEventListener('close', () => { dialog.remove(); if (photoUrl) URL.revokeObjectURL(photoUrl); draftButton.focus(); }, { once:true });
      frame.srcdoc = '<!doctype html>' + doc.documentElement.outerHTML;
      dialog.showModal(); close.focus();
    } catch (error) { if (photoUrl) URL.revokeObjectURL(photoUrl); status(error.message, true); }
    finally { draftButton.disabled = false; }
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !readFields) return;
    const input = readFields(), file = input.file;
    delete input.file;
    if (input.featured && new Set(input.featured).size !== input.featured.length) return status('Wybierz różne wyróżnione kafelki.', true);
    busy = true; saving = true; form.inert = true;
    state.textContent = 'Zapisywanie szkicu…';
    try {
      if (file) Object.assign(input, await prepareImage(file));
      const draft = await api(`/api/page-drafts/${selected}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
      record = draft.data; savedDraft = true;
      dirty = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      build();
      state.textContent = 'Szkic zapisany. Zmiany nie są jeszcze widoczne publicznie.';
      status(`Zapisano szkic: ${names[selected]}.`);
    } catch (error) { state.textContent = 'Nie zapisano zmian.'; status(error.message, true); }
    finally { busy = false; saving = false; form.inert = false; }
  });
  publishButton.addEventListener('click', async () => {
    if (busy || !readFields) return;
    if (dirty || !savedDraft) { state.textContent = 'Najpierw zapisz aktualne zmiany jako szkic, potem opublikuj.'; return; }
    if (!confirm('Opublikować zapisany szkic? Zmieni to treść publicznej podstrony.')) return;
    busy = true; saving = true; form.inert = true;
    try {
      await api(`/api/page-drafts/${selected}/publish`, { method:'POST' });
      savedDraft = false; cache.delete(selected); await load();
      state.textContent = 'Opublikowano. Poprzednia treść jest dostępna w historii wersji.';
    } catch(error) { status(error.message,true); }
    finally { busy = false; saving = false; form.inert = false; }
  });
  historyButton.addEventListener('click', async () => {
    if (busy) return;
    const page = selected;
    try {
      const versions = await api(`/api/page-drafts/${page}/history`);
      const dialog = node('dialog','admin-delete-dialog');
      dialog.append(node('h2','','Historia — ' + names[page]),node('p','','Do 10 poprzednich publikacji. Przywrócenie tworzy szkic; strona publiczna się nie zmienia.'));
      if (!versions.length) dialog.append(node('p','','Historia pojawi się po pierwszej zmianie opublikowanej treści.'));
      for (const version of versions) {
        const row = node('div','page-editor-undo-item');
        row.append(node('span','',new Date(version.created_at).toLocaleString('pl-PL')));
        const restore = node('button','subtle','Przywróć jako szkic'); restore.type = 'button';
        restore.onclick = async () => {
          if (!confirm('Zastąpić bieżący szkic i niezapisane zmiany tą wersją?')) return;
          restore.disabled = true;
          try {
            await api(`/api/page-drafts/${page}/restore`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:version.id}) });
            dirty = false; dialog.close(); cache.delete(page); await load();
          } catch(error) { status(error.message,true); restore.disabled = false; }
        };
        row.append(restore); dialog.append(row);
      }
      const close = node('button','subtle','Zamknij'); close.type = 'button'; close.onclick = () => dialog.close(); dialog.append(close);
      dialog.addEventListener('close',()=>dialog.remove(),{once:true}); document.body.append(dialog); dialog.showModal(); close.focus();
    } catch(error) { status(error.message,true); }
  });
  addEventListener('beforeunload', event => { if (dirty) { event.preventDefault(); event.returnValue = ''; } });
})();
