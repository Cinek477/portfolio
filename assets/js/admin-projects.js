// Panel projektów: edycja wpisów, opisów realizacji i ilustracji.
(() => {
  const projectForm = document.querySelector('#project-form');
  const list = document.querySelector('#project-list');
  const search=window.createAdminSearch(list,'Tytuł, opis, technologia, rok…');
  const preview = document.querySelector('#project-preview');
  const caseFields = ['title', 'problem', 'solution', 'contribution', 'result'];
  let editing = null;
  let previewUrl;
  let activeSection = 'projects';
  const achievement = () => activeSection === 'achievements';
  function reset() {
    editing = null;
    projectForm.reset();
    projectForm.elements.caseTitle.required = false;
    projectForm.elements.section.value = activeSection;
    projectForm.elements.year.value = new Date().getFullYear();
    preview.hidden = true;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    document.querySelector('#project-remove-image-label').hidden = true;
    document.querySelector('#project-cancel').hidden = true;
    document.querySelector('#project-form-title').textContent = achievement() ? 'Dodaj osiągnięcie' : 'Dodaj projekt';
    document.querySelector('#project-save').textContent = achievement() ? 'Zapisz osiągnięcie' : 'Zapisz projekt';
    window.markAdminClean?.(projectForm);
    document.querySelector('#project-list-label').textContent = achievement() ? 'Osiągnięcia' : 'Projekty';
  }
  function edit(project) {
    reset();
    editing = project.id;
    projectForm.elements.visible.checked = project.visible !== false;
    projectForm.elements.caseEnabled.checked = project.caseStudy?.enabled === true;
    projectForm.elements.caseTitle.required = projectForm.elements.caseEnabled.checked;
    for (const key of caseFields) {
      const name = 'case' + key[0].toUpperCase() + key.slice(1);
      projectForm.elements[name].value = pl(project.caseStudy?.[key]);
      projectForm.elements[name + 'En'].value = project.caseStudy?.[key]?.en || '';
    }
    for (const key of ['title', 'summary', 'description']) {
      projectForm.elements[key].value = pl(project[key]);
      projectForm.elements[`${key}En`].value = project[key]?.en || '';
    }
    for (const key of ['section', 'year', 'technologies', 'link', 'symbol'])
      projectForm.elements[key].value = project[key] || '';
    preview.src = project.src || '';
    preview.hidden = !project.src;
    document.querySelector('#project-remove-image-label').hidden = !project.src;
    document.querySelector('#project-cancel').hidden = false;
    document.querySelector('#project-form-title').textContent = achievement() ? 'Edytuj osiągnięcie' : 'Edytuj projekt';
    window.markAdminClean?.(projectForm);
    projectForm.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }
  window.loadAdminProjects = async () => {
    const projects = (await api('/api/projects')).filter(project => project.section === activeSection);
    document.querySelector('#project-count').textContent = `(${projects.length})`;
    list.replaceChildren();
    if (!projects.length) {
      const message = document.createElement('p');
      message.textContent = achievement() ? 'Dodaj swoje pierwsze osiągnięcie.' : 'Dodaj swój pierwszy projekt.';
      list.append(message);
    }
    projects.forEach((project) => {
      const card = document.createElement('article');
      card.className = 'admin-photo';
      card.dataset.searchText=window.adminSearchText(project.title,project.summary,project.description,project.technologies,project.year,project.caseStudy);
      if (project.src) {
        const image = new Image();
        image.src = project.thumbUrl || project.src;
        image.addEventListener(
          'error',
          () => {
            if (project.thumbUrl) image.src = project.src;
          },
          { once: true },
        );
        image.alt = pl(project.title);
        image.loading = 'lazy';
        card.append(image);
      }
      const content = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = pl(project.title);
      const summary = document.createElement('p');
      summary.textContent = `${project.section === 'projects' ? 'Aktualne projekty' : 'Osiągnięcia'} · ${project.year} · ${project.visible === false ? 'Ukryte' : 'Widoczne'}`;
      const actions = document.createElement('div');
      actions.className = 'form-actions';
      const editButton = document.createElement('button');
      editButton.type = 'button';
      editButton.className = 'subtle';
      editButton.textContent = 'Edytuj';
      editButton.addEventListener('click', () => edit(project));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'danger';
      remove.textContent = 'Usuń…';
      remove.addEventListener('click', async () => {
        const choice = await window.chooseAdminDeletion(pl(project.title));
        if (!choice) return;
        remove.disabled = true;
        try {
          await api(`/api/projects/${project.id}${choice === 'permanent' ? '?permanent=1' : ''}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ confirmId: project.id }) });
          if (editing === project.id) reset();
          await window.loadAdminProjects();
          status(choice === 'permanent' ? 'Trwale usunięto wpis. Plik zdjęcia pozostaje w magazynie.' : 'Wpis przeniesiony do kosza. Możesz go przywrócić w zakładce Kosz.');
        } catch (error) {
          status(error.message, true);
          remove.disabled = false;
        }
      });
      const visibility = document.createElement('button');
      visibility.type = 'button';
      visibility.className = 'subtle';
      visibility.textContent = project.visible === false ? 'Pokaż na stronie' : 'Ukryj na stronie';
      visibility.addEventListener('click', async () => {
        const input = { ...project, visible: project.visible === false };
        for (const key of ['title', 'summary', 'description']) {
          input[key] = pl(project[key]);
          input[key + 'En'] = project[key]?.en || input[key];
        }
        visibility.disabled = true;
        try {
          await api(`/api/projects/${project.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
          if (editing === project.id) projectForm.elements.visible.checked = input.visible;
          await window.loadAdminProjects();
          status(input.visible ? 'Wpis widoczny na stronie.' : 'Wpis ukryty. Pozostaje w bazie i panelu.');
        } catch (error) { status(error.message, true); visibility.disabled = false; }
      });
      actions.append(editButton, visibility, remove);
      content.append(title, summary, actions);
      card.append(content);
      list.append(card);
    });
    document.dispatchEvent(new CustomEvent('portfolio-admin-projects-change'));
  };
  projectForm.elements.image.addEventListener('change', () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const file = projectForm.elements.image.files[0];
    if (file) {
      previewUrl = URL.createObjectURL(file);
      preview.src = previewUrl;
      preview.hidden = false;
      projectForm.elements.removeImage.checked = false;
    }
  });
  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const id = editing;
    const input = Object.fromEntries(new FormData(projectForm));
    delete input.image;
    input.caseStudy = { enabled: projectForm.elements.caseEnabled.checked };
    delete input.caseEnabled;
    for (const key of caseFields) {
      const name = 'case' + key[0].toUpperCase() + key.slice(1);
      input.caseStudy[key] = { pl: projectForm.elements[name].value, en: projectForm.elements[name + 'En'].value };
      delete input[name]; delete input[name + 'En'];
    }
    input.removeImage = projectForm.elements.removeImage.checked;
    input.visible = projectForm.elements.visible.checked;
    const file = projectForm.elements.image.files[0];
    projectForm.inert = true;
    list.inert = true;
    status(achievement() ? 'Zapisywanie osiągnięcia…' : 'Zapisywanie projektu…');
    try {
      if (file) Object.assign(input, await prepareImage(file));
      await api(id ? `/api/projects/${id}` : '/api/projects', {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      reset();
      await window.loadAdminProjects();
      status(achievement() ? 'Osiągnięcie zapisane na stronie.' : 'Projekt zapisany na stronie i w plikach do Git.');
    } catch (error) {
      status(error.message, true);
    } finally {
      projectForm.inert = false;
      list.inert = false;
    }
  });
  projectForm.elements.caseEnabled.addEventListener('change', () => { projectForm.elements.caseTitle.required = projectForm.elements.caseEnabled.checked; });
  projectForm.addEventListener('admin-discard',reset);
  document.querySelector('#project-cancel').addEventListener('click', reset);
  window.selectAdminProjectSection = (section) => {
    search.clear();
    activeSection = section === 'achievements' ? 'achievements' : 'projects';
    reset();
    window.loadAdminProjects().catch(error => status(error.message, true));
  };
})();
