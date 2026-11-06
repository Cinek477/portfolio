// Prywatna skrzynka: listy, filtry, szczegóły spraw i odpowiedzi.
(() => {
  const list = document.querySelector('#messages-list');
  window.createAdminSearch(list,'E-mail, temat lub treść wiadomości…');
  const categories = {
    it: 'Projekt IT',
    photo: 'Fotografia',
    tutoring: 'Korepetycje',
    other: 'Inne',
  };
  const detailLabels = {
    web: 'Aplikacja webowa',
    hackathon: 'Hackathon',
    other: 'Inne',
    concert: 'Koncert',
    portrait: 'Portret/Plener',
    event: 'Event promocyjny',
    programming: 'Python / C++',
    maths: 'Algorytmy / Matma',
    basic:'Matematyka podstawowa',advanced:'Matematyka rozszerzona',university:'Matematyka akademicka',
  };
  const mailLabels = {
    pending: 'Powiadomienie w trakcie',
    sent: 'Powiadomienie przyjęte przez pocztę',
    failed: 'Błąd powiadomienia e-mail',
    not_configured: 'Poczta nie jest skonfigurowana',
  };
  const caseDrafts=new Map();
  addEventListener('beforeunload',event=>{if(caseDrafts.size){event.preventDefault();event.returnValue='';}});
  let version = 0;
  const footer = document.createElement('div'); footer.className = 'form-actions inbox-footer'; list.after(footer);
  let folder = 'inbox';
  const filterLabel=document.createElement('label');filterLabel.textContent='Status sprawy';const caseFilter=document.createElement('select');caseFilter.setAttribute('aria-label','Filtr statusu sprawy');
  for(const [value,label] of [['all','Wszystkie sprawy'],['new','Nowe'],['reply','Do odpowiedzi'],['agreed','Ustalone'],['done','Zakończone']]){const option=document.createElement('option');option.value=value;option.textContent=label;caseFilter.append(option);}filterLabel.append(caseFilter);list.before(filterLabel);caseFilter.onchange=()=>window.loadAdminMessages().catch(error=>status(error.message,true));
  const folderNames = { inbox: 'Odebrane', spam: 'Spam', trash: 'Kosz wiadomości' };
  window.loadAdminMessages = async () => {
    const request = ++version;
    const activeFolder = folder;
    {
      const data = await api('/api/messages?folder=' + activeFolder);
      if (request !== version) return;
      document.querySelectorAll('[data-message-folder]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.messageFolder === folder));
        button.textContent = folderNames[button.dataset.messageFolder] + ' (' + (data.counts?.[button.dataset.messageFolder] || 0) + ')';
      });
      document.querySelector('#messages-badge').textContent = data.unread ? `(${data.unread})` : '';
      document.querySelector('#messages-config').textContent = data.mailConfigured
        ? 'Powiadomienia e-mail są skonfigurowane.'
        : 'Skrzynka działa. Aby uruchomić powiadomienia e-mail, uzupełnij .env według CONTACT-MESSAGES.md i zrestartuj serwer.';
      list.replaceChildren(); footer.replaceChildren();
      if (!data.items.some(item=>caseFilter.value==='all'||(item.case_status||'new')===caseFilter.value)) {
        const empty = document.createElement('p');
        empty.textContent = caseFilter.value!=='all'?'Brak spraw o wybranym statusie.':activeFolder === 'inbox' ? 'Brak wiadomości. Nowe zgłoszenia z formularza pojawią się tutaj.' : activeFolder === 'spam' ? 'Brak wiadomości oznaczonych jako spam.' : 'Kosz wiadomości jest pusty.';
        list.append(empty);
      }
      if (activeFolder === 'trash' && data.counts?.trash) {
        const empty = document.createElement('button'); empty.type = 'button'; empty.className = 'danger'; empty.textContent = 'Opróżnij kosz (' + data.counts.trash + ')';
        empty.addEventListener('click', async () => {
          if (await window.chooseAdminDeletion('Wszystkie wiadomości w koszu: ' + data.counts.trash, true, true) !== 'permanent') return;
          empty.disabled = true;
          try {
            const result = await api('/api/messages', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: 'trash', confirmation: 'EMPTY_TRASH', snapshot: data.snapshot }) });
            await window.loadAdminMessages(); status('Opróżniono kosz. Usunięto wiadomości: ' + result.deleted + '.');
          } catch (error) { status(error.message, true); empty.disabled = false; await window.loadAdminMessages(); }
        }); footer.append(empty);
      }
      data.items.filter(item=>caseFilter.value==='all'||(item.case_status||'new')===caseFilter.value).forEach((item) => {
        const card = document.createElement('article');
        card.className = `inbox-message${item.is_read ? '' : ' unread'}`;
        card.dataset.searchText=window.adminSearchText(item.email,item.message,categories[item.category],detailLabels[item.details],item.created,item.private_note,item.case_status);
        const title = document.createElement('h3');
        title.textContent = `${categories[item.category]} · ${detailLabels[item.details]}`;
        const sender = document.createElement('a');
        sender.href = `mailto:${encodeURIComponent(item.email)}`;
        sender.textContent = item.email;
        const date = document.createElement('time');
        date.dateTime = item.created;
        date.textContent = new Date(item.created).toLocaleString('pl-PL', {
          timeZone: 'Europe/Warsaw',
        });
        const content = document.createElement('p');
        content.className = 'inbox-content';
        content.textContent = item.message;
        const mail = document.createElement('p');
        mail.className = 'admin-hint';
        mail.textContent = mailLabels[item.mail_status] || item.mail_status;
        const caseBox=document.createElement('details'),caseTitle=document.createElement('summary');
        const statuses={new:'Nowe',reply:'Do odpowiedzi',agreed:'Ustalone',done:'Zakończone'};caseTitle.textContent='Sprawa: '+(statuses[item.case_status]||'Nowe');caseBox.append(caseTitle);
        const statusLabel=document.createElement('label');statusLabel.textContent='Status sprawy';const caseSelect=document.createElement('select');
        for(const [value,label] of Object.entries(statuses)){const option=document.createElement('option');option.value=value;option.textContent=label;caseSelect.append(option);}caseSelect.value=caseDrafts.get(item.id)?.status??item.case_status??'new';statusLabel.append(caseSelect);
        const noteLabel=document.createElement('label');noteLabel.textContent='Prywatna notatka (tylko panel)';const note=document.createElement('textarea');note.maxLength=4000;note.value=caseDrafts.get(item.id)?.note??item.private_note??'';noteLabel.append(note);
        caseBox.open=caseDrafts.has(item.id);const remember=()=>caseDrafts.set(item.id,{status:caseSelect.value,note:note.value});caseSelect.onchange=remember;note.oninput=remember;
        const saveCase=document.createElement('button');saveCase.type='button';saveCase.className='subtle';saveCase.textContent='Zapisz status i notatkę';const feedback=document.createElement('p');feedback.setAttribute('role','status');
        saveCase.onclick=async()=>{saveCase.disabled=true;try{await api('/api/messages/'+item.id,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({caseStatus:caseSelect.value,privateNote:note.value})});caseDrafts.delete(item.id);item.case_status=caseSelect.value;item.private_note=note.value;caseTitle.textContent='Sprawa: '+statuses[item.case_status];card.dataset.searchText=window.adminSearchText(item.email,item.message,item.private_note,statuses[item.case_status]);feedback.textContent='Zapisano. Notatka nie jest wysyłana nadawcy.';}catch(error){feedback.textContent=error.message;}finally{saveCase.disabled=false;}};
        caseBox.append(statusLabel,noteLabel,saveCase,feedback);caseBox.className='inbox-case';
        const actions = document.createElement('div');
        actions.className = 'form-actions';
        const read = document.createElement('button');
        read.type = 'button';
        read.className = 'subtle';
        read.textContent = item.is_read ? 'Oznacz jako nową' : 'Oznacz jako przeczytaną';
        read.addEventListener('click', async () => {
          read.disabled = true;
          try {
            await api(`/api/messages/${item.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ read: !item.is_read }),
            });
            await window.loadAdminMessages();
          } catch (error) {
            status(error.message, true);
            read.disabled = false;
          }
        });
        const reply = document.createElement('a');
        reply.className = 'admin-link';
        reply.href = `mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(`Re: ${categories[item.category]} — Portfolio`)}`;
        reply.textContent = 'Odpowiedz ↗';
        actions.append(read, reply);
        const move = (text, target) => {
          const button = document.createElement('button'); button.type = 'button'; button.className = target === 'trash' ? 'danger' : 'subtle'; button.textContent = text;
          button.addEventListener('click', async () => {
            if (target === 'trash' && !await window.confirmAdminAction({ title: 'Przenieść wiadomość do kosza?', message: 'Nadawca: ' + item.email + '. Wiadomość zachowamy w koszu, skąd możesz ją przywrócić.', accept: 'Przenieś do kosza', preferenceKey: 'portfolio-confirm-message-trash-skip' })) return;
            actions.inert = true;
            try {
              await api('/api/messages/' + item.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder: target }) });
              await window.loadAdminMessages(); status('Wiadomość przeniesiona do: ' + folderNames[target] + '.');
            } catch (error) { status(error.message, true); actions.inert = false; }
          }); actions.append(button);
        };
        if (activeFolder !== 'inbox') move('Przywróć do odebranych', 'inbox');
        if (activeFolder !== 'spam' && activeFolder !== 'trash') move('Oznacz jako spam', 'spam');
        if (activeFolder !== 'trash') move('Do kosza', 'trash');
        else {
          const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'danger'; remove.textContent = 'Usuń trwale…';
          remove.addEventListener('click', async () => {
            if (await window.chooseAdminDeletion('Wiadomość od ' + item.email, true, true) !== 'permanent') return;
            actions.inert = true;
            try {
              await api('/api/messages/' + item.id, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmId: item.id }) });
              await window.loadAdminMessages(); status('Wiadomość została trwale usunięta z panelu.');
            } catch (error) { status(error.message, true); actions.inert = false; }
          }); actions.append(remove);
        }
        if (activeFolder === 'inbox' && data.mailConfigured && item.mail_status !== 'sent') {
          const retry = document.createElement('button');
          retry.type = 'button';
          retry.textContent = 'Ponów powiadomienie';
          retry.addEventListener('click', async () => {
            retry.disabled = true;
            try {
              const result = await api(`/api/messages/${item.id}/notify`, { method: 'POST' });
              await window.loadAdminMessages();
              if (result.status === 'failed')
                status('Poczta odrzuciła powiadomienie. Sprawdź konfigurację.', true);
            } catch (error) {
              status(error.message, true);
              retry.disabled = false;
            }
          });
          actions.append(retry);
        }
        card.append(title, sender, date, content, caseBox, mail, actions);
        list.append(card);
      });
    }
  };
  document.querySelector('#messages-confirm-reset').addEventListener('click', () => {
    try { localStorage.removeItem('portfolio-confirm-message-trash-skip'); } catch {}
    status('Potwierdzenie przenoszenia wiadomości do kosza zostało włączone.');
  });
  document.querySelectorAll('[data-message-folder]').forEach(button => button.addEventListener('click', () => {
    folder = button.dataset.messageFolder; window.loadAdminMessages().catch(error => status(error.message, true));
  }));
  document
    .querySelector('#messages-refresh')
    .addEventListener('click', () =>
      window.loadAdminMessages().catch((error) => status(error.message, true)),
    );
  setInterval(() => {
    if (!document.hidden && !document.querySelector('#admin-tabs').hidden && !list.querySelector('.inbox-case[open]'))
      window.loadAdminMessages().catch(() => {});
  }, 30000);
})();
